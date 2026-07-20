"use client";

import { useActionState } from "react";
import { cancelAppointment, type PatientActionState } from "@/server/patient";

export default function CancelAppointmentButton({
  appointmentId,
  startsAt,
}: {
  appointmentId: string;
  startsAt: string;
}) {
  const [state, action, pending] = useActionState<PatientActionState, FormData>(
    cancelAppointment,
    {},
  );

  const withinDay = new Date(startsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  if (state.ok) {
    return <span style={{ fontSize: 12, color: "var(--app-muted)" }}>{state.message}</span>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button
        type="submit"
        className="btn btn-danger"
        disabled={pending || withinDay}
        title={withinDay ? "Within 24 hours — please contact the clinic" : "Cancel appointment"}
        style={{ padding: "6px 12px", fontSize: 12 }}
      >
        {pending ? "Cancelling…" : "Cancel"}
      </button>
      {state.error ? (
        <span style={{ fontSize: 12, color: "#a6294f", display: "block", marginTop: 4 }}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
