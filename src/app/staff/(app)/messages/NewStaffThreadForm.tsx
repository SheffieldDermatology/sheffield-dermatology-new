"use client";

import { useActionState } from "react";
import { createStaffThread, type StaffMsgState } from "@/server/staff-messages";

export default function NewStaffThreadForm({ staff }: { staff: { id: string; displayName: string }[] }) {
  const [state, action, pending] = useActionState<StaffMsgState, FormData>(createStaffThread, {});
  return (
    <form action={action}>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      <div className="field-block">
        <label htmlFor="sm-subject">Subject</label>
        <input id="sm-subject" name="subject" required maxLength={150} />
      </div>
      <div className="field-block">
        <label htmlFor="sm-people">Include colleagues (optional)</label>
        <select id="sm-people" name="participantIds" multiple size={Math.min(4, Math.max(2, staff.length))}>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
        </select>
        <small className="field-help">Hold Ctrl/Cmd to select several.</small>
      </div>
      <div className="field-block">
        <label htmlFor="sm-body">Message</label>
        <textarea id="sm-body" name="body" rows={4} required maxLength={4000} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
