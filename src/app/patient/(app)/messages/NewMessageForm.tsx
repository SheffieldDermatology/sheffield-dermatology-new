"use client";

import { useActionState, useRef } from "react";
import { sendPatientMessage, type PatientActionState } from "@/server/patient";

export default function NewMessageForm() {
  const [state, action, pending] = useActionState<PatientActionState, FormData>(
    sendPatientMessage,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await action(fd);
        ref.current?.reset();
      }}
    >
      {state.ok ? (
        <div className="alert alert-success" role="status">
          {state.message}
        </div>
      ) : null}
      {state.error ? (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="field-block">
        <label htmlFor="msg-subject">Subject</label>
        <input id="msg-subject" name="subject" required maxLength={150} />
      </div>
      <div className="field-block">
        <label htmlFor="msg-body">Message</label>
        <textarea id="msg-body" name="body" rows={5} required maxLength={4000} />
        <small className="field-help">
          Please keep messages non-urgent. Do not use this for emergencies.
        </small>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send secure message"}
      </button>
    </form>
  );
}
