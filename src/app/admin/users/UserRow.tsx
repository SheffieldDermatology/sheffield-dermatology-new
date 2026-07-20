"use client";

import { useActionState } from "react";
import { setUserStatus, setUserRoles, type AdminState } from "@/server/admin";

interface UserLite {
  id: string;
  displayName: string;
  email: string;
  kind: string;
  status: string;
  roles: string[];
  mfaEnrolled: boolean;
}

export default function UserRow({
  user,
  allRoles,
  canManageRoles,
  isSelf,
}: {
  user: UserLite;
  allRoles: string[];
  canManageRoles: boolean;
  isSelf: boolean;
}) {
  const [, statusAction] = useActionState<AdminState, FormData>(setUserStatus, {});
  const [roleState, roleAction, rolePending] = useActionState<AdminState, FormData>(setUserRoles, {});

  return (
    <div style={{ border: "1px solid var(--app-line)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <strong>{user.displayName}</strong>{" "}
          <span className={`pill pill-${user.status === "active" ? "completed" : user.status === "disabled" ? "cancelled" : "requested"}`}>{user.status}</span>
          {user.kind === "staff" && (
            <span className={`pill pill-${user.mfaEnrolled ? "completed" : "requested"}`} style={{ marginLeft: 6 }}>
              {user.mfaEnrolled ? "MFA on" : "MFA pending"}
            </span>
          )}
          <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 3 }}>{user.email} · {user.kind}</div>
          <div style={{ fontSize: 12, color: "var(--app-muted)" }}>Roles: {user.roles.join(", ") || "none"}</div>
        </div>
        {user.kind === "staff" && !isSelf && (
          <form action={statusAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="status" value={user.status === "disabled" ? "active" : "disabled"} />
            <button type="submit" className={`btn ${user.status === "disabled" ? "btn-ghost" : "btn-danger"}`} style={{ padding: "6px 12px", fontSize: 12 }}>
              {user.status === "disabled" ? "Enable" : "Disable"}
            </button>
          </form>
        )}
      </div>

      {canManageRoles && user.kind === "staff" && (
        <form action={roleAction} style={{ marginTop: 10 }}>
          <input type="hidden" name="userId" value={user.id} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            {allRoles.map((role) => (
              <label key={role} style={{ fontSize: 12, display: "flex", gap: 5, alignItems: "center" }}>
                <input type="checkbox" name="roles" value={role} defaultChecked={user.roles.includes(role)} />
                {role.replace(/_/g, " ")}
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-ghost" disabled={rolePending} style={{ padding: "6px 12px", fontSize: 12 }}>
            {rolePending ? "Saving…" : "Save roles"}
          </button>
          {roleState.message ? <span style={{ fontSize: 12, color: "#1e6b43", marginLeft: 8 }}>{roleState.message}</span> : null}
          {roleState.error ? <span style={{ fontSize: 12, color: "#a6294f", marginLeft: 8 }}>{roleState.error}</span> : null}
        </form>
      )}
    </div>
  );
}
