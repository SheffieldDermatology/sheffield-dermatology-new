/**
 * Appointment reconciliation with Semble. This is a documented no-op until
 * Semble is connected with a verified booking/appointments API. The real
 * signature is defined here so the semble_sync job handler can call it and the
 * production path is structurally complete.
 */
import { sembleConfigured } from "@/adapters/semble";
import { recordAudit } from "@/lib/audit";

export interface ReconcileResult {
  ran: boolean;
  reason?: string;
  reconciled?: number;
}

export async function reconcileAppointments(): Promise<ReconcileResult> {
  if (!sembleConfigured()) {
    return { ran: false, reason: "Semble not connected" };
  }
  // With Semble connected, reconciliation would compare local cached
  // appointment projections against Semble and update statuses/ids. The
  // verified query set is required before enabling this; until then we record
  // that a sync was requested and take no action rather than guessing the API.
  await recordAudit({
    actorType: "integration",
    action: "semble.reconcile_skipped",
    detail: { reason: "Awaiting verified Semble appointments API — see INTEGRATIONS.md" },
  });
  return { ran: false, reason: "Awaiting verified Semble appointments API" };
}
