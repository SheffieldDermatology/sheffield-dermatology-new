"use client";

import { useActionState, useRef } from "react";
import { createStaffUser, type AdminState } from "@/server/admin";

export default function NewUserForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(createStaffUser, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (fd) => { await action(fd); if (state.ok) ref.current?.reset(); }} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      {state.error ? <div className="alert alert-error" role="alert" style={{ width: "100%" }}>{state.error}</div> : null}
      {state.ok ? <div className="alert alert-success" role="status" style={{ width: "100%" }}>{state.message}</div> : null}
      <div className="field-block" style={{ marginBottom: 0, minWidth: 180, flex: 1 }}>
        <label htmlFor="nu-name">Full name</label>
        <input id="nu-name" name="displayName" required maxLength={120} />
      </div>
      <div className="field-block" style={{ marginBottom: 0, minWidth: 220, flex: 1 }}>
        <label htmlFor="nu-email">Email</label>
        <input id="nu-email" name="email" type="email" required maxLength={254} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Creating…" : "Create (invited)"}</button>
    </form>
  );
}
