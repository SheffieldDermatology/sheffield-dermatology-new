/**
 * Booking provider selection. Semble is preferred when it is configured AND
 * the booking.live feature flag is on; otherwise the local availability engine
 * runs in request-only mode. In request mode a booking is a REQUEST awaiting
 * clinic confirmation — never shown as a confirmed appointment.
 */
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { featureFlags } from "@/lib/db/schema";
import { createSembleBookingProvider } from "@/adapters/semble";
import { generateAvailability } from "./availability";
import type { BookingProvider } from "@/adapters/types";

export async function bookingLiveEnabled(): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ enabled: featureFlags.enabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, "booking.live"))
    .limit(1);
  return rows[0]?.enabled ?? false;
}

class LocalBookingProvider implements BookingProvider {
  readonly name = "local-request";
  readonly mode = "development" as const;

  async getAvailability(query: {
    serviceId: string;
    clinicianId?: string;
    from: Date;
    to: Date;
    visitType?: "in_person" | "video";
  }) {
    return generateAvailability(query);
  }

  bookingOutcome(): "confirmed" | "request" {
    return "request";
  }

  async notifyCancellation(): Promise<void> {
    // Nothing external in request mode.
  }
}

/** Returns the active booking provider for this deployment. */
export async function getBookingProvider(): Promise<BookingProvider> {
  if (await bookingLiveEnabled()) {
    const semble = createSembleBookingProvider();
    if (semble) return semble;
  }
  return new LocalBookingProvider();
}
