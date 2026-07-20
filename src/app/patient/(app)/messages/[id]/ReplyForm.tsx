"use client";

import { useActionState, useRef } from "react";
import { replyToThread, type PatientActionState } from "@/server/patient";

export default function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState<PatientActionState, FormData>(replyToThread, {});
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await action(fd);
        ref.current?.reset();
      }}
    >
      {state.error ? (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      ) : null}
      <input type="hidden" name="threadId" value={threadId} />
      <div className="field-block">
        <label htmlFor="reply-body" className="visually-hidden">
          Your reply
        </label>
        <textarea id="reply-body" name="body" rows={4} required maxLength={4000} placeholder="Write a reply…" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
