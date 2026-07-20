import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission, STAFF_ROLES } from "@/lib/rbac/permissions";
import { getDb } from "@/lib/db";
import { users, userRoles, mfaSecrets } from "@/lib/db/schema";
import PermissionDenied from "@/components/app/PermissionDenied";
import NewUserForm from "./NewUserForm";
import UserRow from "./UserRow";

export const metadata: Metadata = { title: "Users & roles" };

export default async function UsersPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "users.manage")) {
    return <PermissionDenied what="user administration" />;
  }
  const canManageRoles = rolesHavePermission(user.roles, "roles.manage");

  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(users.displayName);
  const roleRows = await db.select().from(userRoles);
  const mfaRows = await db.select({ userId: mfaSecrets.userId, confirmedAt: mfaSecrets.confirmedAt }).from(mfaSecrets);
  const mfaByUser = new Map(mfaRows.map((m) => [m.userId, !!m.confirmedAt]));
  const rolesByUser = new Map<string, string[]>();
  for (const r of roleRows) {
    rolesByUser.set(r.userId, [...(rolesByUser.get(r.userId) ?? []), r.role]);
  }

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Access</span>
        <h1>Users &amp; roles</h1>
        <p>Manage staff accounts and their roles. Least privilege: grant only what each role needs.</p>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Add staff user</h2></div>
        <NewUserForm />
      </div>

      <div className="panel">
        <div className="panel-head"><h2>All users</h2><span className="sub">{allUsers.length}</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allUsers.map((u) => (
            <UserRow
              key={u.id}
              user={{
                id: u.id,
                displayName: u.displayName,
                email: u.email,
                kind: u.kind,
                status: u.status,
                roles: rolesByUser.get(u.id) ?? [],
                mfaEnrolled: mfaByUser.get(u.id) ?? false,
              }}
              allRoles={[...STAFF_ROLES]}
              canManageRoles={canManageRoles}
              isSelf={u.id === user.id}
            />
          ))}
        </div>
      </div>
    </>
  );
}
