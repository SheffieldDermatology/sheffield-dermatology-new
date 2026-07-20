/**
 * Payment provider webhook. Payment success is recognised ONLY here, via a
 * verified signature — never from a browser redirect. Events are processed
 * idempotently (webhook_events unique on provider+externalEventId).
 */
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { webhookEvents, payments, invoices } from "@/lib/db/schema";
import { createPaymentProvider } from "@/adapters/payments";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const provider = createPaymentProvider();
  if (provider.mode === "disabled") {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const result = await provider.verifyWebhook(rawBody, signature);

  if (!result.valid) {
    await recordAudit({
      actorType: "integration",
      action: "payments.webhook_rejected",
      detail: { reason: "invalid signature" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();
  const eventId = result.eventId ?? `evt_${Date.now()}`;

  // Idempotency: skip if already recorded.
  const existing = await db
    .insert(webhookEvents)
    .values({
      provider: "payments",
      externalEventId: eventId,
      signatureValid: true,
      payload: JSON.parse(rawBody),
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (existing.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (result.type === "payment.succeeded" && result.providerRef) {
    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.providerRef, result.providerRef))
      .limit(1);
    const payment = paymentRows[0];
    if (payment) {
      // Cross-check the amount; flag a mismatch rather than trusting the event.
      const mismatch =
        typeof result.amountPence === "number" && result.amountPence !== payment.amountPence;
      await db
        .update(payments)
        .set({
          status: mismatch ? "failed" : "succeeded",
          verifiedByWebhook: true,
        })
        .where(eq(payments.id, payment.id));

      if (!mismatch) {
        // Recompute invoice status from succeeded payments.
        const invoiceRows = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, payment.invoiceId))
          .limit(1);
        const invoice = invoiceRows[0];
        if (invoice) {
          const sums = await db
            .select({ total: sql<number>`coalesce(sum(${payments.amountPence}), 0)` })
            .from(payments)
            .where(
              sql`${payments.invoiceId} = ${invoice.id} and ${payments.status} = 'succeeded'`,
            );
          const paid = Number(sums[0]?.total ?? 0);
          const status =
            paid >= invoice.totalPence ? "paid" : paid > 0 ? "part_paid" : invoice.status;
          await db
            .update(invoices)
            .set({ status, updatedAt: new Date() })
            .where(eq(invoices.id, invoice.id));
        }
      }

      await recordAudit({
        actorType: "integration",
        action: "payments.webhook_processed",
        entityType: "payment",
        entityId: payment.id,
        detail: { type: result.type, mismatch },
      });
    }
  } else {
    await recordAudit({
      actorType: "integration",
      action: "payments.webhook_processed",
      detail: { type: result.type ?? "other" },
    });
  }

  await db
    .update(webhookEvents)
    .set({ processedAt: new Date() })
    .where(eq(webhookEvents.externalEventId, eventId));

  return NextResponse.json({ received: true });
}
