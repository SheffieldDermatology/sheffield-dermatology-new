import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/legal.css";

export const metadata: Metadata = {
  title: "AI scribe & your consent",
  description:
    "How Sheffield Dermatology uses an AI-assisted scribe to help draft consultation notes — always with your consent, always reviewed and approved by your clinician.",
};

export default function AiScribePage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> AI scribe
          </div>
          <h1>
            AI-assisted notes, <em>with your consent.</em>
          </h1>
          <p className="legal-lead">
            To spend more time with you and less time typing, your clinician may use an AI-assisted
            scribe to help draft the notes of your consultation. It is always optional and always
            reviewed by a person.
          </p>
          <div className="draft-banner" role="note">
            <span className="badge badge-draft">Draft</span>
            <p>
              <strong>Consent wording pending approval.</strong> The exact wording used to record
              your consent is being finalised with clinical and information-governance review. The
              principles below will not change.
            </p>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-prose">
            <h2>What the AI scribe does</h2>
            <p>
              With your agreement, the conversation during your consultation is transcribed to help
              produce a draft clinical note. This means your clinician can focus on you rather than
              on writing. The tool used for this is provided through a specialist supplier (Heidi)
              via the clinic&rsquo;s approved systems.
            </p>

            <h2>Your consent comes first</h2>
            <ul>
              <li>Your clinician will explain the AI scribe and ask if you are happy to use it.</li>
              <li>
                Your decision is recorded <strong>before</strong> any transcription begins.
              </li>
              <li>
                You can <strong>say no</strong>, or change your mind at any point during the
                appointment — the recording can be stopped immediately.
              </li>
              <li>
                Declining will <strong>not affect your care</strong> in any way. Your clinician will
                simply make notes as usual.
              </li>
            </ul>

            <h2>Audio is not kept by default</h2>
            <p>
              By default, the consultation is transcribed in real time and{" "}
              <strong>the audio is not retained</strong>. The screen shows clearly whether anything
              is being captured, and recording can be stopped at once. If the clinic ever wished to
              retain audio, this would only happen after a separate assessment of the lawful basis,
              consent, retention period and safeguards — and you would be told.
            </p>

            <h2>A person always checks the note</h2>
            <p>
              AI-generated text is only ever a <strong>draft</strong>. Your clinician reviews,
              corrects and approves every note before it is saved to your record. The clinician
              remains fully responsible for what goes into your notes — the record of who approved
              each note and when is kept.
            </p>

            <h2>Your information</h2>
            <p>
              Use of the AI scribe is covered by our <Link href="/privacy">privacy notice</Link>.
              The supplier processes information under a data-processing agreement with the clinic.
              If you have any questions, please <Link href="/contact">contact the clinic</Link> —
              you are always welcome to ask before your appointment.
            </p>

            <p className="legal-updated">Last updated: July 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
