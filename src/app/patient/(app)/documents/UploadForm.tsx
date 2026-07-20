"use client";

import { useActionState, useRef } from "react";
import { uploadDocument, type PatientActionState } from "@/server/patient";

export default function UploadForm() {
  const [state, action, pending] = useActionState<PatientActionState, FormData>(uploadDocument, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
    >
      {state.ok ? (
        <div className="alert alert-success" role="status">
          {state.message}
        </div>
      ) : null}
      {state.error ? (
        <div className="alert alert-error" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="field-block">
        <label htmlFor="upload-file">Choose a file (JPG, PNG, WebP or PDF, up to 10 MB)</label>
        <input
          id="upload-file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
        />
        <small className="field-help">
          Only upload photos or documents the clinic has asked for. Do not upload anything urgent.
        </small>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Uploading…" : "Upload securely"}
      </button>
    </form>
  );
}
