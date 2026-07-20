"use client";

import { useActionState } from "react";
import { updateOwnerInput, type AdminState } from "@/server/admin";

interface OwnerInput {
  key: string;
  title: string;
  why: string;
  whereShown: string;
  blocksProduction: boolean;
  safeDefault: string;
  status: string;
  note: string;
}

export default function OwnerInputRow({ input, canEdit }: { input: OwnerInput; canEdit: boolean }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateOwnerInput, {});
  const statusPill = input.status === "verified" || input.status === "supplied" ? "completed" : input.status === "partial" ? "requested" : "urgent";

  return (
    <div style={{ border: "1px solid var(--app-line)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div>
          <strong>{input.title}</strong>
          {input.blocksProduction && <span className="pill pill-urgent" style={{ marginLeft: 8 }}>Blocks production</span>}
          <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 4 }}>
            {input.why} · Appears: {input.whereShown}
          </div>
          <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 2 }}>
            Safe default: {input.safeDefault}
          </div>
        </div>
        <span className={`pill pill-${statusPill}`}>{input.status}</span>
      </div>

      {canEdit && (
        <form action={action} style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <input type="hidden" name="key" value={input.key} />
          <div className="field-block" style={{ marginBottom: 0 }}>
            <label htmlFor={`st-${input.key}`} style={{ fontSize: 11 }}>Status</label>
            <select id={`st-${input.key}`} name="status" defaultValue={input.status} style={{ padding: "6px 8px", borderRadius: 7, border: "1px solid var(--app-line)" }}>
              <option value="missing">Missing</option>
              <option value="partial">Partial</option>
              <option value="supplied">Supplied</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div className="field-block" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label htmlFor={`nt-${input.key}`} style={{ fontSize: 11 }}>Note / value</label>
            <input id={`nt-${input.key}`} name="value" defaultValue={input.note} maxLength={4000} placeholder="Optional note" />
          </div>
          <button type="submit" className="btn btn-ghost" disabled={pending}>{pending ? "…" : "Save"}</button>
          {state.message ? <span style={{ fontSize: 12, color: "#1e6b43" }}>{state.message}</span> : null}
          {state.error ? <span style={{ fontSize: 12, color: "#a6294f" }}>{state.error}</span> : null}
        </form>
      )}
    </div>
  );
}
