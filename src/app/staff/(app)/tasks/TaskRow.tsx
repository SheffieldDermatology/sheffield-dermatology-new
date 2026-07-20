"use client";

import { useActionState } from "react";
import { updateTaskStatus, assignTask, type TaskActionState } from "@/server/tasks";

interface TaskLite {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  teamRole: string | null;
}

export default function TaskRow({
  task,
  staff,
  canWrite,
  canAssign,
}: {
  task: TaskLite;
  staff: { id: string; displayName: string }[];
  canWrite: boolean;
  canAssign: boolean;
}) {
  const [, statusAction] = useActionState<TaskActionState, FormData>(updateTaskStatus, {});
  const [, assignActionFn] = useActionState<TaskActionState, FormData>(assignTask, {});

  return (
    <div style={{ border: "1px solid var(--app-line)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <strong>{task.title}</strong>
          {task.description ? <div style={{ fontSize: 13, color: "var(--app-muted)", marginTop: 3 }}>{task.description}</div> : null}
          <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 5 }}>
            {task.assigneeName ? `Assigned to ${task.assigneeName}` : task.teamRole ? `Team: ${task.teamRole}` : "Unassigned"}
            {task.dueAt ? ` · Due ${new Date(task.dueAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}` : ""}
          </div>
        </div>
        {(task.priority === "urgent" || task.priority === "high") && (
          <span className={`pill pill-${task.priority}`}>{task.priority}</span>
        )}
      </div>

      {(canWrite || canAssign) && (
        <div className="btn-row" style={{ marginTop: 10, alignItems: "center" }}>
          {canWrite && (
            <form action={statusAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="hidden" name="taskId" value={task.id} />
              <label className="visually-hidden" htmlFor={`st-${task.id}`}>Status</label>
              <select id={`st-${task.id}`} name="status" defaultValue={task.status} style={{ padding: "6px 8px", borderRadius: 7, border: "1px solid var(--app-line)", fontSize: 12 }}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button type="submit" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Update</button>
            </form>
          )}
          {canAssign && (
            <form action={assignActionFn} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="hidden" name="taskId" value={task.id} />
              <label className="visually-hidden" htmlFor={`as-${task.id}`}>Assignee</label>
              <select id={`as-${task.id}`} name="assigneeId" defaultValue={task.assigneeId ?? ""} style={{ padding: "6px 8px", borderRadius: 7, border: "1px solid var(--app-line)", fontSize: 12 }}>
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
              </select>
              <button type="submit" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Assign</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
