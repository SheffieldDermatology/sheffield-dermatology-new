/**
 * Lightweight, database-free transactional email for the public "info +
 * enquiry" deployment. Sends via Resend's HTTPS API. No PHI/clinical detail
 * ever passes through here beyond what the patient typed into the enquiry.
 *
 * Configuration (Vercel environment variables):
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — verified sender, e.g. "Sheffield Dermatology <no-reply@sheffielddermatology.com>"
 *   CLINIC_INBOX     — where enquiries are delivered (defaults to contact@sheffielddermatology.com)
 */
const RESEND_URL = "https://api.resend.com/emails";

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export function mailerConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail(email: OutgoingEmail): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  // Without a provider (e.g. local dev), capture to the server log instead of
  // failing — but never pretend it was delivered.
  if (!apiKey || !from) {
    console.info("[site-mailer] email not sent (RESEND_API_KEY/EMAIL_FROM unset):", {
      to: email.to,
      subject: email.subject,
    });
    return { ok: false, error: "not_configured" };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      return { ok: false, error: `provider_${res.status}: ${detail}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}
