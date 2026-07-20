import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/guards";
import { rolesHavePermission } from "@/lib/rbac/permissions";
import { getTasks, getStaffUsers } from "@/lib/staff/data";
import PermissionDenied from "@/components/app/PermissionDenied";
import NewTaskForm from "./NewTaskForm";
import TaskRow from "./TaskRow";

export const metadata: Metadata = { title: "Tasks" };

const GROUPS: { key: string; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

export default async function TasksPage() {
  const user = await requireStaff();
  if (!rolesHavePermission(user.roles, "tasks.read")) {
    return <PermissionDenied what="tasks" />;
  }
  const canWrite = rolesHavePermission(user.roles, "tasks.write");
  const canAssign = rolesHavePermission(user.roles, "tasks.assign");
  const [tasks, staff] = await Promise.all([getTasks(), getStaffUsers()]);

  return (
    <>
      <div className="welcome-head">
        <span className="eyebrow-app">Workflow</span>
        <h1>Tasks</h1>
        <p>Assign, track and complete follow-up actions across the clinic.</p>
      </div>

      {canWrite && (
        <div className="panel">
          <div className="panel-head"><h2>New task</h2></div>
          <NewTaskForm staff={staff} />
        </div>
      )}

      {GROUPS.map((group) => {
        const groupTasks = tasks.filter((t) => t.status === group.key);
        if (group.key === "done" && groupTasks.length === 0) return null;
        return (
          <div className="panel" key={group.key}>
            <div className="panel-head">
              <h2>{group.label}</h2>
              <span className="sub">{groupTasks.length}</span>
            </div>
            {groupTasks.length === 0 ? (
              <p style={{ color: "var(--app-muted)", fontSize: 13, margin: 0 }}>Nothing here.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groupTasks.map((t) => (
                  <TaskRow key={t.id} task={{ ...t, dueAt: t.dueAt ? t.dueAt.toISOString() : null }} staff={staff} canWrite={canWrite} canAssign={canAssign} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
