/**
 * Email provider adapter.
 *
 * Production: activated only when EMAIL_PROVIDER and EMAIL_API_KEY are both
 * set — sends via a Resend-compatible HTTPS API using fetch.
 *
 * Development: DevEmailProvider never contacts any external system. Its
 * send() returns null, which the outbox job layer records as "suppressed"
 * (captured in the outbox, visible in admin, nothing sent).
 *
 * Bodies must already be minimal (built by the template layer in
 * src/lib/notify.ts) — no clinical details ever travel through here.
 */
import { env } from "@/lib/env";
import type { EmailMessage, EmailProvider } from "@/adapters/types";

const RESEND_COMPATIBLE_API_URL = "https://api.resend.com/emails";

class DevEmailProvider implements EmailProvider {
  readonly name = "dev-outbox";
  readonly mode = "development" as const;

  // Captured in the outbox only; never sent externally.
  async send(_message: EmailMessage): Promise<string | null> {
    return null;
  }
}

class ResendCompatibleEmailProvider implements EmailProvider {
  readonly name: string;
  readonly mode = "production" as const;

  constructor(
    providerLabel: string,
    private readonly apiKey: string,
  ) {
    this.name = providerLabel;
  }

  async send(message: EmailMessage): Promise<string | null> {
    const from = env.EMAIL_FROM;
    if (!from) {
      throw new Error(
        "EMAIL_FROM must be set alongside EMAIL_PROVIDER and EMAIL_API_KEY. See INTEGRATIONS.md.",
      );
    }
    const response = await fetch(RESEND_COMPATIBLE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.bodyText,
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Email provider responded ${response.status}: ${detail}`);
    }
    const data = (await response.json()) as { id?: unknown };
    if (typeof data.id !== "string" || data.id === "") {
      // A production send must never be mistaken for a dev capture (null).
      throw new Error("Email provider accepted the message but returned no message id.");
    }
    return data.id;
  }
}

export function createEmailProvider(): EmailProvider {
  if (env.EMAIL_PROVIDER && env.EMAIL_API_KEY) {
    return new ResendCompatibleEmailProvider(env.EMAIL_PROVIDER, env.EMAIL_API_KEY);
  }
  return new DevEmailProvider();
}
