"use client";

import { useActionState, useRef } from "react";
import { replyStaffThread, type StaffMsgState } from "@/server/staff-messages";

export default function StaffReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState<StaffMsgState, FormData>(replyStaffThread, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset(); }}>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      <input type="hidden" name="threadId" value={threadId} />
      <div className="field-block">
        <label htmlFor="sr-body" className="visually-hidden">Reply</label>
        <textarea id="sr-body" name="body" rows={3} required maxLength={4000} placeholder="Write a reply…" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
