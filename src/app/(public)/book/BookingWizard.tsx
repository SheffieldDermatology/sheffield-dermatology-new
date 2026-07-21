"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createBooking, getAvailabilityForDay, type BookingState } from "@/server/booking";
import BookingCalendar from "./BookingCalendar";

interface ServiceOption {
  id: string;
  name: string;
  shortDescription: string;
  durationMinutes: number;
  pricePence: number | null;
}
interface ClinicianOption {
  id: string;
  fullName: string;
  title: string;
}
interface DaySlot {
  startsAt: string;
  clinicianId: string;
  clinicianName: string;
  label: string;
}

function makeIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `k-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function BookingWizard({
  services,
  clinicians,
  bookingLive,
}: {
  services: ServiceOption[];
  clinicians: ClinicianOption[];
  bookingLive: boolean;
}) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string>("");
  const [visitType, setVisitType] = useState<"in_person" | "video">("in_person");
  const [clinicianId, setClinicianId] = useState<string>(
    clinicians.length === 1 ? clinicians[0]!.id : "",
  );
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DaySlot | null>(null);
  const [loadingSlots, startLoad] = useTransition();
  const [idempotencyKey] = useState(makeIdempotencyKey);

  const [state, formAction] = useActionState<BookingState, FormData>(createBooking, {
    status: "idle",
  });

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  const loadSlots = useCallback(
    (forDate: string) => {
      if (!serviceId || !forDate) return;
      startLoad(async () => {
        const res = await getAvailabilityForDay({
          serviceId,
          clinicianId: clinicianId || undefined,
          dateISO: forDate,
          visitType,
        });
        setSlots(res.slots);
        setSelectedSlot(null);
      });
    },
    [serviceId, clinicianId, visitType],
  );

  if (state.status === "success") {
    return <BookingSuccess state={state} />;
  }

  return (
    <div className="book-shell">
      <ol className="book-progress" aria-label="Booking progress">
        {["Appointment", "Date & time", "Your details"].map((label, i) => {
          const n = i + 1;
          return (
            <li
              key={label}
              className={`book-progress-step${step === n ? " active" : step > n ? " done" : ""}`}
            >
              <span className="num">{step > n ? "✓" : n}</span>
              <small>{label}</small>
              {i < 2 ? <i aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      {/* Step 1 — appointment type */}
      {step === 1 && (
        <div className="book-step">
          <h2>What can we help with?</h2>
          <p className="step-help">Choose the appointment that best matches your concern.</p>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="visually-hidden">Appointment type</legend>
            {services.map((s) => (
              <label key={s.id} className="book-choice">
                <input
                  type="radio"
                  name="service"
                  value={s.id}
                  checked={serviceId === s.id}
                  onChange={() => setServiceId(s.id)}
                />
                <span className="fee">
                  {s.pricePence === null ? "Fee on booking" : `£${(s.pricePence / 100).toFixed(0)}`}
                </span>
                <strong>{s.name}</strong>
                <small>
                  {s.shortDescription} · {s.durationMinutes} minutes
                </small>
              </label>
            ))}
          </fieldset>

          <h2 style={{ marginTop: 26 }}>How would you like to meet?</h2>
          <div className="visit-toggle">
            <label>
              <input
                type="radio"
                name="visit"
                checked={visitType === "in_person"}
                onChange={() => setVisitType("in_person")}
              />
              In person
            </label>
            <label>
              <input
                type="radio"
                name="visit"
                checked={visitType === "video"}
                onChange={() => setVisitType("video")}
              />
              Video consultation
            </label>
          </div>

          {clinicians.length > 1 && (
            <>
              <h2 style={{ marginTop: 26 }}>Who would you like to see?</h2>
              <div className="visit-toggle" style={{ flexWrap: "wrap" }}>
                <label>
                  <input
                    type="radio"
                    name="clinician"
                    checked={clinicianId === ""}
                    onChange={() => setClinicianId("")}
                  />
                  First available
                </label>
                {clinicians.map((c) => (
                  <label key={c.id}>
                    <input
                      type="radio"
                      name="clinician"
                      checked={clinicianId === c.id}
                      onChange={() => setClinicianId(c.id)}
                    />
                    {c.fullName}
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="book-buttons">
            <span />
            <button
              type="button"
              className="button"
              disabled={!serviceId}
              onClick={() => setStep(2)}
            >
              Choose date &amp; time <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — date & time */}
      {step === 2 && (
        <div className="book-step">
          <h2>Choose a time</h2>
          <p className="step-help">
            Times shown are genuine availability
            {bookingLive ? "" : ". Your booking is a request the clinic will confirm"}.
          </p>
          <div className="cal-layout">
            <div className="cal-panel">
              <span className="cal-panel-label">Choose a date</span>
              <BookingCalendar
                serviceId={serviceId}
                clinicianId={clinicianId || undefined}
                visitType={visitType}
                selected={date || null}
                onSelect={(iso) => {
                  setDate(iso);
                  loadSlots(iso);
                }}
              />
            </div>

            <div className="times-panel">
              <span className="cal-panel-label">
                {date
                  ? `Times on ${new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`
                  : "Available times"}
              </span>

              {!date && <p className="times-hint">Pick an available date to see times.</p>}

              {date && loadingSlots && (
                <p className="time-empty">
                  <span className="spinner" aria-hidden="true" /> Checking availability…
                </p>
              )}

              {date && !loadingSlots && slots.length === 0 && (
                <div className="time-empty">
                  No appointments are available on that date. Try another day, or{" "}
                  <Link href="/book/waiting-list">join the waiting list</Link>.
                </div>
              )}

              {date && !loadingSlots && slots.length > 0 && (
                <div className="time-grid" role="radiogroup" aria-label="Available times">
                  {slots.map((slot) => (
                    <label key={`${slot.startsAt}-${slot.clinicianId}`}>
                      <input
                        type="radio"
                        name="slot"
                        checked={selectedSlot?.startsAt === slot.startsAt && selectedSlot?.clinicianId === slot.clinicianId}
                        onChange={() => setSelectedSlot(slot)}
                      />
                      {slot.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="book-buttons">
            <button type="button" className="book-back" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              type="button"
              className="button"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Enter your details <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — details */}
      {step === 3 && selectedSlot && service && (
        <form action={formAction} className="book-step">
          <h2>Your details</h2>
          <div className="book-summary-box">
            <strong>{service.name}</strong>
            <br />
            {visitType === "video" ? "Video consultation" : "In person"} with{" "}
            {selectedSlot.clinicianName}
            <br />
            {new Date(selectedSlot.startsAt).toLocaleString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/London",
            })}
          </div>

          {state.status === "error" && (
            <div className="alert alert-error" role="alert">
              {state.error}
            </div>
          )}

          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="clinicianId" value={selectedSlot.clinicianId} />
          <input type="hidden" name="startsAt" value={selectedSlot.startsAt} />
          <input type="hidden" name="visitType" value={visitType} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

          <div className="field-row">
            <div className="field-block">
              <label htmlFor="bf-first">First name *</label>
              <input id="bf-first" name="firstName" autoComplete="given-name" required maxLength={80} />
            </div>
            <div className="field-block">
              <label htmlFor="bf-last">Last name *</label>
              <input id="bf-last" name="lastName" autoComplete="family-name" required maxLength={80} />
            </div>
          </div>
          <div className="field-row">
            <div className="field-block">
              <label htmlFor="bf-email">Email address *</label>
              <input id="bf-email" name="email" type="email" autoComplete="email" required maxLength={254} />
            </div>
            <div className="field-block">
              <label htmlFor="bf-phone">Mobile number</label>
              <input id="bf-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
            </div>
          </div>
          <div className="field-block">
            <label htmlFor="bf-notes">Anything we should know? (optional)</label>
            <textarea id="bf-notes" name="notes" rows={3} maxLength={1000} />
            <small className="field-help">
              Please do not include detailed medical history here — share that securely through the
              patient portal or at your appointment.
            </small>
          </div>

          <div className="field-block checkbox-block">
            <label className="checkbox-label">
              <input type="checkbox" name="privacyConsent" required />
              <span>
                I have read the <Link href="/privacy">privacy notice</Link> and agree to my details
                being used to arrange my appointment.
              </span>
            </label>
          </div>
          <div className="field-block checkbox-block">
            <label className="checkbox-label">
              <input type="checkbox" name="cancellationConsent" required />
              <span>
                I have read the <Link href="/cancellation-policy">cancellation policy</Link>.
              </span>
            </label>
          </div>

          <div className="book-buttons">
            <button type="button" className="book-back" onClick={() => setStep(2)}>
              ← Back
            </button>
            <SubmitBookingButton bookingLive={bookingLive} />
          </div>
        </form>
      )}
    </div>
  );
}

function SubmitBookingButton({ bookingLive }: { bookingLive: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" /> Sending…
        </>
      ) : bookingLive ? (
        <>
          Confirm booking <span aria-hidden="true">→</span>
        </>
      ) : (
        <>
          Send booking request <span aria-hidden="true">→</span>
        </>
      )}
    </button>
  );
}

function BookingSuccess({ state }: { state: Extract<BookingState, { status: "success" }> }) {
  const icsHref = useMemo(() => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sheffield Dermatology//Booking//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Sheffield Dermatology appointment`,
      `DESCRIPTION:${state.summary.replace(/,/g, "\\,")}`,
      `STATUS:${state.outcome === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines)}`;
  }, [state]);

  return (
    <div className="book-shell">
      <div className="book-success">
        <div className="tick" aria-hidden="true">
          ✓
        </div>
        <h2>{state.outcome === "confirmed" ? "Appointment confirmed" : "Request received"}</h2>
        <p style={{ color: "#646b88" }}>
          Reference <strong>{state.reference}</strong>
        </p>
        <div className="book-summary-box" style={{ textAlign: "left" }}>
          {state.summary}
        </div>
        {state.outcome === "request" ? (
          <div className="book-note">
            <strong>Your appointment is not confirmed yet.</strong> We have received your request
            and the clinic will confirm the date and time with you by email shortly. You have not
            been charged.
          </div>
        ) : (
          <div className="book-note" style={{ background: "#eaf7f0", borderColor: "#bfe5d0", color: "#1e6b43" }}>
            A confirmation email is on its way. You can view or change this appointment in the
            patient portal.
          </div>
        )}
        <div className="book-actions-row">
          <a className="button" href={icsHref} download="appointment.ics">
            Add to calendar
          </a>
          <Link className="text-link" href="/patient">
            Go to patient portal
          </Link>
        </div>
      </div>
    </div>
  );
}
