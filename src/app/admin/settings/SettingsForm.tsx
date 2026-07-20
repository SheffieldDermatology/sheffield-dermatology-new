"use client";

import { useActionState } from "react";
import { updateClinicSettings, type AdminState } from "@/server/admin";

export default function SettingsForm(props: {
  phone: string;
  email: string;
  addressLines: string;
  openingHours: string;
  legalEntity: string;
  icoRegistration: string;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateClinicSettings, {});
  return (
    <form action={action}>
      {state.ok ? <div className="alert alert-success" role="status">{state.message}</div> : null}
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      <div className="field-block">
        <label htmlFor="s-phone">Telephone</label>
        <input id="s-phone" name="phone" defaultValue={props.phone} maxLength={40} />
      </div>
      <div className="field-block">
        <label htmlFor="s-email">Email</label>
        <input id="s-email" name="email" type="email" defaultValue={props.email} maxLength={254} />
      </div>
      <div className="field-block">
        <label htmlFor="s-address">Address (one line per row)</label>
        <textarea id="s-address" name="addressLines" rows={3} defaultValue={props.addressLines} maxLength={1000} />
      </div>
      <div className="field-block">
        <label htmlFor="s-hours">Opening hours</label>
        <input id="s-hours" name="openingHours" defaultValue={props.openingHours} maxLength={500} />
      </div>
      <div className="field-block">
        <label htmlFor="s-entity">Legal entity / data controller</label>
        <input id="s-entity" name="legalEntity" defaultValue={props.legalEntity} maxLength={200} />
      </div>
      <div className="field-block">
        <label htmlFor="s-ico">ICO registration number</label>
        <input id="s-ico" name="icoRegistration" defaultValue={props.icoRegistration} maxLength={60} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save clinic details"}
      </button>
    </form>
  );
}
