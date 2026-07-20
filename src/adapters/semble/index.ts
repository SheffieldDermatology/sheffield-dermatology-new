/**
 * Semble EHR provider. Semble is the clinical system of record. This adapter
 * provides the real transport and honest health reporting, but deliberately
 * does NOT invent GraphQL operations: writing a clinical note requires the
 * verified Semble mutation, which awaits official API documentation and
 * credentials (see INTEGRATIONS.md). Until then saveApprovedNote reports
 * {saved:false} rather than pretending.
 */
import { env } from "@/lib/env";
import type { BookingProvider, EhrProvider } from "@/adapters/types";
import { SembleClient } from "./client";

class SembleEhrProvider implements EhrProvider {
  readonly name = "semble";
  readonly mode: "production" | "development";
  private client: SembleClient;

  constructor() {
    this.client = new SembleClient();
    this.mode = this.client.isConfigured() ? "production" : "development";
  }

  async healthCheck(): Promise<{ ok: boolean; detail?: string }> {
    if (!this.client.isConfigured()) {
      return {
        ok: false,
        detail: "Semble credentials not configured — see INTEGRATIONS.md.",
      };
    }
    const ping = await this.client.ping();
    if (ping.reachable && ping.authAccepted) return { ok: true };
    return { ok: false, detail: ping.detail ?? "Semble not reachable" };
  }

  async saveApprovedNote(): Promise<{ saved: boolean; ehrRef?: string }> {
    // Intentionally not implemented against a guessed mutation. The verified
    // Semble write operation must be supplied before clinical notes are pushed
    // to the record. Approved notes remain safely stored locally meanwhile.
    return { saved: false };
  }
}

export function createEhrProvider(): EhrProvider {
  return new SembleEhrProvider();
}

/**
 * Semble-backed booking provider. Returned only when Semble is configured AND
 * the booking.live feature flag is enabled (checked by the booking engine).
 * Its operations currently throw NotConnected because live availability needs
 * the verified Semble booking API — the local availability engine is used
 * until then. This keeps the production path structurally complete.
 */
export function createSembleBookingProvider(): BookingProvider | null {
  const client = new SembleClient();
  if (!client.isConfigured()) return null;

  const notConnected = (op: string): never => {
    throw new Error(
      `Semble booking operation "${op}" requires the verified Semble booking API. See INTEGRATIONS.md.`,
    );
  };

  return {
    name: "semble-booking",
    mode: "development",
    async getAvailability() {
      return notConnected("getAvailability");
    },
    bookingOutcome() {
      return "confirmed";
    },
    async notifyCancellation() {
      notConnected("notifyCancellation");
    },
  };
}

export function sembleConfigured(): boolean {
  return !!env.SEMBLE_API_URL && !!env.SEMBLE_API_TOKEN;
}
