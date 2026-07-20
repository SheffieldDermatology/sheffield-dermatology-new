/**
 * Semble webhook receiver. Verifies an HMAC-SHA256 signature over the raw
 * body against SEMBLE_WEBHOOK_SECRET (timing-safe), stores the event
 * idempotently, and enqueues a semble_sync job. Never trusts an unsigned
 * payload.
 */
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { webhookEvents } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { enqueueJob } from "@/lib/jobs";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, header: string | null): boolean {
  if (!env.SEMBLE_WEBHOOK_SECRET || !header) return false;
  const expected = createHmac("sha256", env.SEMBLE_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const provided = header.replace(/^sha256=/, "");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!env.SEMBLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Integration not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get("x-semble-signature") ?? request.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    await recordAudit({
      actorType: "integration",
      action: "semble.webhook_rejected",
      detail: { reason: "invalid or missing signature" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const externalEventId =
    (payload.id as string | undefined) ??
    (payload.eventId as string | undefined) ??
    createHash("sha256").update(rawBody).digest("hex");

  const db = getDb();
  const inserted = await db
    .insert(webhookEvents)
    .values({ provider: "semble", externalEventId, signatureValid: true, payload })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });

  if (inserted.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await enqueueJob("semble_sync", { externalEventId });
  await db
    .update(webhookEvents)
    .set({ processedAt: new Date() })
    .where(eq(webhookEvents.externalEventId, externalEventId));

  return NextResponse.json({ received: true });
}
