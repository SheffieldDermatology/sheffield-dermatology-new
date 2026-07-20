"use client";

import { useActionState } from "react";
import { setFeatureFlag, type AdminState } from "@/server/admin";

export default function FlagRow({
  flag,
  warning,
}: {
  flag: { key: string; enabled: boolean; description: string };
  warning?: string;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(setFeatureFlag, {});
  return (
    <div style={{ border: "1px solid var(--app-line)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <strong>{flag.key}</strong>{" "}
          <span className={`pill pill-${flag.enabled ? "completed" : "cancelled"}`}>{flag.enabled ? "On" : "Off"}</span>
          <div style={{ fontSize: 13, color: "var(--app-muted)", marginTop: 4 }}>{flag.description}</div>
          {warning ? <div style={{ fontSize: 12, color: "#7a5b16", marginTop: 4 }}>⚠ {warning}</div> : null}
        </div>
        <form action={action}>
          <input type="hidden" name="key" value={flag.key} />
          <input type="hidden" name="enabled" value={flag.enabled ? "off" : "on"} />
          <button type="submit" className={`btn ${flag.enabled ? "btn-danger" : "btn-primary"}`} disabled={pending} style={{ padding: "8px 14px", fontSize: 12 }}>
            {pending ? "…" : flag.enabled ? "Disable" : "Enable"}
          </button>
        </form>
      </div>
      {state.error ? <span style={{ fontSize: 12, color: "#a6294f" }}>{state.error}</span> : null}
    </div>
  );
}
