/**
 * Payment provider adapter.
 *
 * Production: Stripe via its HTTPS API (fetch), activated only when
 * STRIPE_SECRET_KEY is set. Payment success is recognised ONLY through
 * verifyWebhook (signed events) — never a browser redirect.
 *
 * Default: DisabledPaymentProvider — createCheckout returns null (the booking
 * flow records an unpaid invoice), verifyWebhook reports invalid. No fake
 * "paid" state is ever produced.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { CheckoutRequest, PaymentProvider } from "@/adapters/types";

const STRIPE_API = "https://api.stripe.com/v1";
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

class DisabledPaymentProvider implements PaymentProvider {
  readonly name = "disabled";
  readonly mode = "disabled" as const;
  async createCheckout(): Promise<{ url: string; providerRef: string } | null> {
    return null;
  }
  async verifyWebhook(): Promise<{ valid: false }> {
    return { valid: false };
  }
}

class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  readonly mode = "production" as const;

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string | undefined,
  ) {}

  async createCheckout(
    request: CheckoutRequest,
  ): Promise<{ url: string; providerRef: string } | null> {
    const origin = env.APP_ORIGIN;
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": request.currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": request.description,
      "line_items[0][price_data][unit_amount]": String(request.amountPence),
      "line_items[0][quantity]": "1",
      success_url: `${origin}${request.successPath}`,
      cancel_url: `${origin}${request.cancelPath}`,
      "metadata[invoiceId]": request.invoiceId,
      client_reference_id: request.invoiceId,
    });
    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Stripe responded ${response.status}: ${detail}`);
    }
    const data = (await response.json()) as { id?: string; url?: string };
    if (!data.url || !data.id) {
      throw new Error("Stripe checkout session did not include a URL.");
    }
    return { url: data.url, providerRef: data.id };
  }

  async verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<{
    valid: boolean;
    eventId?: string;
    type?: "payment.succeeded" | "payment.failed" | "payment.refunded" | "other";
    providerRef?: string;
    amountPence?: number;
  }> {
    if (!this.webhookSecret || !signatureHeader) return { valid: false };

    // Stripe-Signature: t=timestamp,v1=hexsignature
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((kv) => {
        const [k, v] = kv.split("=");
        return [k?.trim(), v?.trim()];
      }),
    );
    const timestamp = parts["t"];
    const provided = parts["v1"];
    if (!timestamp || !provided) return { valid: false };

    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return { valid: false };

    const expected = createHmac("sha256", this.webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false };

    let event: {
      id?: string;
      type?: string;
      data?: { object?: Record<string, unknown> };
    };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return { valid: false };
    }

    const object = event.data?.object ?? {};
    const providerRef =
      (object["id"] as string | undefined) ??
      (object["payment_intent"] as string | undefined);
    const amountRaw =
      (object["amount_total"] as number | undefined) ??
      (object["amount"] as number | undefined) ??
      (object["amount_received"] as number | undefined);

    let type: "payment.succeeded" | "payment.failed" | "payment.refunded" | "other" = "other";
    switch (event.type) {
      case "checkout.session.completed":
      case "payment_intent.succeeded":
        type = "payment.succeeded";
        break;
      case "payment_intent.payment_failed":
        type = "payment.failed";
        break;
      case "charge.refunded":
      case "refund.created":
        type = "payment.refunded";
        break;
    }

    return {
      valid: true,
      eventId: event.id,
      type,
      providerRef,
      amountPence: typeof amountRaw === "number" ? amountRaw : undefined,
    };
  }
}

export function createPaymentProvider(): PaymentProvider {
  if (env.PAYMENT_PROVIDER === "stripe" && env.STRIPE_SECRET_KEY) {
    return new StripePaymentProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
  }
  return new DisabledPaymentProvider();
}
