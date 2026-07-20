"use client";

import { useActionState, useRef } from "react";
import { uploadTeamFile, createFolder, softDeleteFile, type FileActionState } from "@/server/files";

export function UploadPanel({ libraryId }: { libraryId: string }) {
  const [state, action, pending] = useActionState<FileActionState, FormData>(uploadTeamFile, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset(); }}>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      {state.ok ? <div className="alert alert-success" role="status">File uploaded.</div> : null}
      <input type="hidden" name="libraryId" value={libraryId} />
      <div className="field-block">
        <label htmlFor="tf-file">Choose a file</label>
        <input id="tf-file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt,.csv" />
        <small className="field-help">PDF, images, Word, Excel, text or CSV, up to 20 MB.</small>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

export function NewFolderForm({ libraryId }: { libraryId: string }) {
  const [state, action, pending] = useActionState<FileActionState, FormData>(createFolder, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset(); }} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      <input type="hidden" name="libraryId" value={libraryId} />
      <div className="field-block" style={{ flex: 1, marginBottom: 0 }}>
        <label htmlFor="ff-name">Folder name</label>
        <input id="ff-name" name="name" required maxLength={160} />
      </div>
      <button type="submit" className="btn btn-ghost" disabled={pending}>{pending ? "Adding…" : "Add folder"}</button>
    </form>
  );
}

export function SoftDeleteForm({ entryId }: { entryId: string }) {
  const [, action, pending] = useActionState<FileActionState, FormData>(softDeleteFile, {});
  return (
    <form action={action}>
      <input type="hidden" name="entryId" value={entryId} />
      <button type="submit" className="btn btn-danger" disabled={pending} style={{ padding: "6px 12px", fontSize: 12 }}>
        {pending ? "…" : "Delete"}
      </button>
    </form>
  );
}
