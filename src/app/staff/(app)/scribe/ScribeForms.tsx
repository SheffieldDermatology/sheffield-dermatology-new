"use client";

import { useActionState } from "react";
import {
  startScribeSession,
  recordScribeConsent,
  saveScribeDraft,
  approveScribeNote,
  stopScribeSession,
  type ScribeActionState,
} from "@/server/scribe";

const CONSENT_WORDING =
  "We would like to use an AI-assisted scribe (Heidi) to help write today's consultation notes. " +
  "The conversation is transcribed in real time to draft a clinical note; audio is not kept. Your " +
  "clinician reviews, corrects and approves every note before it is saved to your record. You can " +
  "say no, or change your mind at any point, and it will not affect your care.";

export function StartSessionForm({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [state, action, pending] = useActionState<ScribeActionState, FormData>(startScribeSession, {});
  return (
    <form action={action}>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      <input type="hidden" name="patientId" value={patientId} />
      <p style={{ fontSize: 14, marginBottom: 14 }}>
        You are about to start an AI-scribe session for <strong>{patientName}</strong>. Consent will
        be recorded before any transcription begins.
      </p>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Opening…" : "Open scribe session"}
      </button>
    </form>
  );
}

export function ConsentPanel({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState<ScribeActionState, FormData>(recordScribeConsent, {});
  return (
    <div>
      <div className="alert alert-info" role="note" style={{ whiteSpace: "normal" }}>
        <strong>Explain to the patient and record their decision:</strong>
        <p style={{ margin: "8px 0 0" }}>{CONSENT_WORDING}</p>
      </div>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      {state.message ? <div className="alert alert-success" role="status">{state.message}</div> : null}
      <form action={action} className="btn-row" style={{ marginTop: 10 }}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <button type="submit" name="decision" value="granted" className="btn btn-primary" disabled={pending}>
          Patient consents — begin
        </button>
        <button type="submit" name="decision" value="declined" className="btn btn-ghost" disabled={pending}>
          Patient declines
        </button>
      </form>
    </div>
  );
}

export function DraftPanel({ sessionId, existingDraft }: { sessionId: string; existingDraft: string }) {
  const [state, action, pending] = useActionState<ScribeActionState, FormData>(saveScribeDraft, {});
  return (
    <form action={action}>
      <div className="alert alert-warning" role="note">
        <strong>AI-generated draft — must be reviewed and approved by a clinician.</strong> In this
        environment the transcription provider is not connected, so no text is produced
        automatically. Enter or paste the draft note to review.
      </div>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      {state.message ? <div className="alert alert-success" role="status">{state.message}</div> : null}
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="field-block">
        <label htmlFor="draft">Draft note</label>
        <textarea id="draft" name="draftText" rows={8} defaultValue={existingDraft} required maxLength={20000} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save draft"}
      </button>
    </form>
  );
}

export function ApprovePanel({
  sessionId,
  draft,
  canApprove,
}: {
  sessionId: string;
  draft: string;
  canApprove: boolean;
}) {
  const [state, action, pending] = useActionState<ScribeActionState, FormData>(approveScribeNote, {});
  if (!canApprove) {
    return (
      <div className="alert alert-info" role="note">
        You do not have permission to approve clinical notes. A clinician with approval rights must
        review and approve this draft before it can be saved to the record.
      </div>
    );
  }
  return (
    <form action={action}>
      <div className="alert alert-warning" role="note">
        Review and edit the note below. Approving records that you, as the clinician, are
        responsible for its content. Only an approved note is saved to the clinical record.
      </div>
      {state.error ? <div className="alert alert-error" role="alert">{state.error}</div> : null}
      {state.message ? <div className="alert alert-success" role="status">{state.message}</div> : null}
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="field-block">
        <label htmlFor="edited">Final note (review and edit before approving)</label>
        <textarea id="edited" name="editedText" rows={8} defaultValue={draft} required maxLength={20000} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        {pending ? "Approving…" : "Approve & save to record"}
      </button>
    </form>
  );
}

export function StopButton({ sessionId }: { sessionId: string }) {
  const [, action, pending] = useActionState<ScribeActionState, FormData>(stopScribeSession, {});
  return (
    <form action={action}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <button type="submit" className="btn btn-danger" disabled={pending}>
        ■ Stop session
      </button>
    </form>
  );
}
