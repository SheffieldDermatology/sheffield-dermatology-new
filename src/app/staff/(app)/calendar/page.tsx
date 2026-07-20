import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getWeekSchedule } from "@/lib/staff/data";
import { formatTime, statusLabel } from "@/lib/format";
import PermissionDenied from "@/components/app/PermissionDenied";

export const metadata: Metadata = { title: "Calendar" };

function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 Sun … 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - diff);
  return date;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "appointments.read")) {
    return <PermissionDenied what="the calendar" />;
  }

  const { week } = await searchParams;
  const base = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(`${week}T00:00:00Z`) : new Date();
  const weekStart = mondayOf(base);
  const prevWeek = isoDate(new Date(weekStart.getTime() - 7 * 86400_000));
  const nextWeek = isoDate(new Date(weekStart.getTime() + 7 * 86400_000));

  const appts = await getWeekSchedule(weekStart);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart.getTime() + i * 86400_000);
    const dayAppts = appts
      .filter((a) => isoDate(new Date(Date.UTC(a.startsAt.getUTCFullYear(), a.startsAt.getUTCMonth(), a.startsAt.getUTCDate()))) === isoDate(day))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return { day, dayAppts };
  });

  const weekLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" });

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Schedule</span>
        <h1>Calendar</h1>
        <p>Week of {weekLabel.format(weekStart)}. Appointments shown are demonstration data.</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="btn-row">
            <Link className="btn btn-ghost" href={`/staff/calendar?week=${prevWeek}`}>← Previous</Link>
            <Link className="btn btn-ghost" href="/staff/calendar">This week</Link>
            <Link className="btn btn-ghost" href={`/staff/calendar?week=${nextWeek}`}>Next →</Link>
          </div>
          <span className="sub">{appts.length} appointment(s)</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 10, overflowX: "auto" }}>
          {days.map(({ day, dayAppts }) => (
            <div key={day.toISOString()} style={{ border: "1px solid var(--app-line)", borderRadius: 10, padding: 8, minHeight: 160, background: "#fbfdff" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--app-muted)", marginBottom: 8 }}>
                {new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "Europe/London" }).format(day)}
              </div>
              {dayAppts.length === 0 ? (
                <div style={{ fontSize: 11, color: "#aeb4cc" }}>—</div>
              ) : (
                dayAppts.map((a) => (
                  <div key={a.id} style={{ background: "var(--app-sky-soft)", borderLeft: "3px solid var(--app-sky)", borderRadius: 6, padding: "6px 8px", marginBottom: 6 }}>
                    <strong style={{ fontSize: 12 }}>{formatTime(a.startsAt)}</strong>
                    <div style={{ fontSize: 12 }}>{a.patientFirst} {a.patientLast}</div>
                    <div style={{ fontSize: 11, color: "var(--app-muted)" }}>{a.serviceName}</div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: 14, fontSize: 12, color: "var(--app-muted)" }}>
          <span>Statuses shown: requested, confirmed, completed.</span>
        </div>
      </div>
    </>
  );
}
