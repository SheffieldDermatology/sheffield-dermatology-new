"use client";

import { useActionState } from "react";
import { updateProfile, type PatientActionState } from "@/server/patient";

export default function ProfileForm(props: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState<PatientActionState, FormData>(updateProfile, {});

  return (
    <form action={action}>
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
        <label htmlFor="pf-name">Name</label>
        <input id="pf-name" value={`${props.firstName} ${props.lastName}`.trim()} disabled />
        <small className="field-help">
          To change your name, please contact the clinic so your records stay accurate.
        </small>
      </div>
      <div className="field-block">
        <label htmlFor="pf-email">Email address</label>
        <input id="pf-email" name="email" type="email" defaultValue={props.email} required maxLength={254} />
      </div>
      <div className="field-block">
        <label htmlFor="pf-phone">Mobile number</label>
        <input id="pf-phone" name="phone" type="tel" defaultValue={props.phone} maxLength={30} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
