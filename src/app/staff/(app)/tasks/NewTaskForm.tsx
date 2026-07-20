"use client";

import { useActionState, useRef } from "react";
import { createTask, type TaskActionState } from "@/server/tasks";

export default function NewTaskForm({ staff }: { staff: { id: string; displayName: string }[] }) {
  const [state, action, pending] = useActionState<TaskActionState, FormData>(createTask, {});
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset(); }}>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      <div className="grid-2">
        <div className="field-block">
          <label htmlFor="t-title">Title</label>
          <input id="t-title" name="title" required maxLength={200} />
        </div>
        <div className="field-block">
          <label htmlFor="t-priority">Priority</label>
          <select id="t-priority" name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div className="field-block">
        <label htmlFor="t-desc">Description (optional)</label>
        <textarea id="t-desc" name="description" rows={2} maxLength={4000} />
      </div>
      <div className="grid-2">
        <div className="field-block">
          <label htmlFor="t-assignee">Assign to (optional)</label>
          <select id="t-assignee" name="assigneeId" defaultValue="">
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.displayName}</option>)}
          </select>
        </div>
        <div className="field-block">
          <label htmlFor="t-due">Due (optional)</label>
          <input id="t-due" name="dueAt" type="datetime-local" />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}
