/**
 * Owner-supplied clinic details, read from the settings table. Values are
 * null until entered in Admin → Setup; the UI must render honest
 * "to be confirmed" states instead of invented details.
 */
import { cache } from "react";
import { inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export interface ClinicLocation {
  name: string;
  lines: string[];
}

export interface ClinicInfo {
  phone: string | null;
  email: string | null;
  addressLines: string[] | null;
  openingHours: string | null;
  legalEntity: string | null;
  icoRegistration: string | null;
  /** Consultation offices, when the clinic operates from more than one site. */
  locations: ClinicLocation[] | null;
}

const KEYS = [
  "clinic.phone",
  "clinic.email",
  "clinic.address_lines",
  "clinic.opening_hours",
  "clinic.legal_entity",
  "clinic.ico_registration",
  "clinic.locations",
] as const;

export const getClinicInfo = cache(async (): Promise<ClinicInfo> => {
  const db = getDb();
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, [...KEYS]));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const str = (key: string): string | null => {
    const v = map.get(key);
    return typeof v === "string" && v.trim() !== "" ? v : null;
  };
  const lines = map.get("clinic.address_lines");
  const locations = map.get("clinic.locations");
  const validLocations =
    Array.isArray(locations) &&
    locations.every(
      (l): l is ClinicLocation =>
        !!l && typeof (l as ClinicLocation).name === "string" && Array.isArray((l as ClinicLocation).lines),
    ) &&
    locations.length > 0
      ? (locations as ClinicLocation[])
      : null;
  return {
    phone: str("clinic.phone"),
    email: str("clinic.email"),
    addressLines: Array.isArray(lines) && lines.length > 0 ? (lines as string[]) : null,
    openingHours: str("clinic.opening_hours"),
    legalEntity: str("clinic.legal_entity"),
    icoRegistration: str("clinic.ico_registration"),
    locations: validLocations,
  };
});
