import { describe, it, expect } from "vitest";
import { makeTestDb } from "../helpers/db";
import { recordAudit, verifyAuditChain } from "@/lib/audit";
import type { Db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("hash-chained audit trail", () => {
  it("records events and verifies an intact chain", async () => {
    const db = (await makeTestDb()) as unknown as Db;
    await recordAudit({ action: "test.one", actorType: "system" }, db);
    await recordAudit({ action: "test.two", actorType: "system" }, db);
    await recordAudit({ action: "test.three", actorType: "system" }, db);

    const result = await verifyAuditChain(db);
    expect(result.ok).toBe(true);
    expect(result.checked).toBe(3);
  });

  it("detects tampering with a recorded event", async () => {
    const db = (await makeTestDb()) as unknown as Db;
    await recordAudit({ action: "test.one", actorType: "system" }, db);
    await recordAudit({ action: "test.two", actorType: "system" }, db);

    // Tamper: change an action after the fact (simulating an attacker).
    const rows = await db.select().from(auditEvents).limit(1);
    await db.update(auditEvents).set({ action: "test.tampered" }).where(eq(auditEvents.id, rows[0]!.id));

    const result = await verifyAuditChain(db);
    expect(result.ok).toBe(false);
    expect(result.brokenAtId).toBe(rows[0]!.id);
  });
});
