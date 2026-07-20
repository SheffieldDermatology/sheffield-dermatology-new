"use client";

import { useActionState } from "react";
import { updateService, type AdminState } from "@/server/admin";

interface ServiceLite {
  id: string;
  name: string;
  durationMinutes: number;
  pricePence: number | null;
  active: boolean;
  approved: boolean;
}

export default function ServiceRow({ service }: { service: ServiceLite }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateService, {});
  return (
    <form action={action} style={{ border: "1px solid var(--app-line)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <input type="hidden" name="id" value={service.id} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <strong>{service.name}</strong>
        {!service.approved && <span className="pill pill-requested" style={{ marginLeft: 8 }}>Pending approval</span>}
      </div>
      <div className="field-block" style={{ marginBottom: 0, width: 110 }}>
        <label style={{ fontSize: 11 }}>Duration (min)</label>
        <input name="durationMinutes" type="number" min={5} max={240} defaultValue={service.durationMinutes} />
      </div>
      <div className="field-block" style={{ marginBottom: 0, width: 130 }}>
        <label style={{ fontSize: 11 }}>Price (pence)</label>
        <input name="pricePence" type="number" min={0} defaultValue={service.pricePence ?? ""} placeholder="blank = TBC" />
      </div>
      <label style={{ fontSize: 12, display: "flex", gap: 5, alignItems: "center" }}>
        <input type="checkbox" name="active" value="on" defaultChecked={service.active} /> Active
      </label>
      <label style={{ fontSize: 12, display: "flex", gap: 5, alignItems: "center" }}>
        <input type="checkbox" name="approved" value="on" defaultChecked={service.approved} /> Approved
      </label>
      <button type="submit" className="btn btn-ghost" disabled={pending}>{pending ? "…" : "Save"}</button>
      {state.message ? <span style={{ fontSize: 12, color: "#1e6b43" }}>{state.message}</span> : null}
      {state.error ? <span style={{ fontSize: 12, color: "#a6294f" }}>{state.error}</span> : null}
    </form>
  );
}
