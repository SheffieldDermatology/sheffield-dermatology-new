/**
 * SMS provider adapter.
 *
 * Production: activated only when SMS_PROVIDER, SMS_ACCOUNT_SID,
 * SMS_AUTH_TOKEN and SMS_FROM are all set — sends via a Twilio-compatible
 * HTTPS API using fetch.
 *
 * Development: DevSmsProvider never contacts any external system. Its send()
 * returns null, which the outbox job layer records as "suppressed" (captured
 * in the outbox, visible in admin, nothing sent).
 *
 * Bodies must already be minimal (built by the template layer in
 * src/lib/notify.ts) — no clinical details ever travel through here.
 */
import { env } from "@/lib/env";
import type { SmsMessage, SmsProvider } from "@/adapters/types";

class DevSmsProvider implements SmsProvider {
  readonly name = "dev-outbox";
  readonly mode = "development" as const;

  // Captured in the outbox only; never sent externally.
  async send(_message: SmsMessage): Promise<string | null> {
    return null;
  }
}

class TwilioCompatibleSmsProvider implements SmsProvider {
  readonly name: string;
  readonly mode = "production" as const;

  constructor(
    providerLabel: string,
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly from: string,
  ) {
    this.name = providerLabel;
  }

  async send(message: SmsMessage): Promise<string | null> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      this.accountSid,
    )}/Messages.json`;
    const body = new URLSearchParams({
      To: message.to,
      From: this.from,
      Body: message.body,
    });
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`SMS provider responded ${response.status}: ${detail}`);
    }
    const data = (await response.json()) as { sid?: unknown };
    if (typeof data.sid !== "string" || data.sid === "") {
      // A production send must never be mistaken for a dev capture (null).
      throw new Error("SMS provider accepted the message but returned no message id.");
    }
    return data.sid;
  }
}

export function createSmsProvider(): SmsProvider {
  if (env.SMS_PROVIDER && env.SMS_ACCOUNT_SID && env.SMS_AUTH_TOKEN && env.SMS_FROM) {
    return new TwilioCompatibleSmsProvider(
      env.SMS_PROVIDER,
      env.SMS_ACCOUNT_SID,
      env.SMS_AUTH_TOKEN,
      env.SMS_FROM,
    );
  }
  return new DevSmsProvider();
}
