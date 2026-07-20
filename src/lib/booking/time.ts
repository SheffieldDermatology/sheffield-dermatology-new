/**
 * Clinic-local time helpers. The clinic operates in Europe/London; availability
 * rules are expressed in local wall-clock time and converted to UTC instants
 * for storage and comparison. No timezone library is needed — Intl provides the
 * offset for any date, so this stays correct across British Summer Time.
 */
export const CLINIC_TZ = "Europe/London";

/** Minutes that clinic-local time is ahead of UTC at the given instant. */
export function clinicOffsetMinutes(utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(utcDate).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - utcDate.getTime()) / 60000;
}

/** Converts a clinic-local wall-clock time to a UTC instant. */
export function clinicWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = clinicOffsetMinutes(new Date(utcGuess));
  return new Date(utcGuess - offset * 60000);
}

/** Parses "HH:MM" or "HH:MM:SS" into hour and minute. */
export function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":");
  return { hour: Number(h), minute: Number(m) };
}

/** ISO date (YYYY-MM-DD) in clinic-local time for a UTC instant. */
export function clinicDateString(utcDate: Date): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(utcDate);
}

/** Weekday (0 = Sunday … 6 = Saturday) in clinic-local time. */
export function clinicWeekday(utcDate: Date): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TZ, weekday: "short" }).format(
    utcDate,
  );
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

/** Human-friendly clinic-local time label, e.g. "09:30". */
export function clinicTimeLabel(utcDate: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(utcDate);
}

/** Human-friendly clinic-local date label, e.g. "Monday, 21 July 2026". */
export function clinicDateLabel(utcDate: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(utcDate);
}
