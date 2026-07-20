"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getAvailableDaysForMonth } from "@/server/booking";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** An expanded month-grid date picker showing which days have availability. */
export default function BookingCalendar({
  serviceId,
  clinicianId,
  visitType,
  selected,
  onSelect,
}: {
  serviceId: string;
  clinicianId?: string;
  visitType: "in_person" | "video";
  selected: string | null;
  onSelect: (dateISO: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [availDays, setAvailDays] = useState<Set<string>>(new Set());
  const [loading, startLoad] = useTransition();

  const todayISO = isoOf(today.getFullYear(), today.getMonth() + 1, today.getDate());

  useEffect(() => {
    startLoad(async () => {
      const res = await getAvailableDaysForMonth({
        serviceId,
        clinicianId: clinicianId || undefined,
        year: view.year,
        month: view.month,
        visitType,
      });
      setAvailDays(new Set(res.days));
    });
  }, [serviceId, clinicianId, visitType, view.year, view.month]);

  // Build the month grid (leading blanks so the 1st sits under its weekday).
  const daysInMonth = new Date(view.year, view.month, 0).getDate();
  const firstWeekday = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7; // Mon=0
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canGoPrev = !(view.year === today.getFullYear() && view.month === today.getMonth() + 1);
  const goPrev = () =>
    setView((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { ...v, month: v.month - 1 }));
  const goNext = () =>
    setView((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { ...v, month: v.month + 1 }));

  return (
    <div className="cal">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <strong aria-live="polite">
          {MONTHS[view.month - 1]} {view.year}
        </strong>
        <button type="button" className="cal-nav" onClick={goNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className={`cal-grid${loading ? " loading" : ""}`} role="grid" aria-label="Choose a date">
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} className="cal-cell empty" />;
          const iso = isoOf(view.year, view.month, d);
          const available = availDays.has(iso);
          const isPast = iso < todayISO;
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={`cal-cell${available ? " available" : ""}${isSelected ? " selected" : ""}`}
              disabled={!available || isPast}
              aria-selected={isSelected}
              aria-label={`${d} ${MONTHS[view.month - 1]} ${view.year}${available ? ", available" : ", no availability"}`}
              onClick={() => onSelect(iso)}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span>
          <i className="dot-avail" aria-hidden="true"></i> Available
        </span>
        <span>
          <i className="dot-none" aria-hidden="true"></i> No availability
        </span>
        {loading ? <span className="cal-loading">Checking…</span> : null}
      </div>
    </div>
  );
}
