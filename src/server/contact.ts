"use server";

/**
 * Public contact-form server action. Rate-limited per IP, zod-validated, and
 * recorded as a receptionist task plus an audit event. The submitted message
 * is stored in the task description only — it is never echoed back to the
 * browser, and no message content is written to the audit trail.
 */
import { z } from "zod";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export type ContactFormState = { ok?: boolean; error?: string } | null;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(120, "Please keep your name under 120 characters."),
  email: z
    .email("Please enter a valid email address so we can reply.")
    .trim()
    .max(254, "Please keep your email address under 254 characters."),
  phone: z
    .string()
    .trim()
    .max(40, "Please keep your phone number under 40 characters.")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more so we can help (at least 10 characters).")
    .max(4000, "Please keep your message under 4,000 characters."),
});

const GENERIC_ERROR =
  "Sorry — we could not send your message just now. Please try again shortly, or use the other contact details on this page.";

export async function submitContactEnquiry(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  try {
    // Honeypot: real visitors never see or fill this field. Pretend success so
    // automated submitters learn nothing; no task or audit row is created.
    const honeypot = formData.get("company_website");
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      return { ok: true };
    }

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = hdrs.get("user-agent")?.slice(0, 400) ?? null;

    const allowed = await checkRateLimit(RATE_LIMITS.messaging, "contact:" + ip);
    if (!allowed) {
      return {
        ok: false,
        error:
          "Too many messages have been sent from your connection recently. Please wait a while and try again.",
      };
    }

    const rawPhone = formData.get("phone");
    const parsed = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: typeof rawPhone === "string" && rawPhone.trim() !== "" ? rawPhone : undefined,
      message: formData.get("message"),
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: first?.message ?? "Please check the form and try again." };
    }

    const { name, email, phone, message } = parsed.data;
    const db = getDb();
    const inserted = await db
      .insert(tasks)
      .values({
        title: `Website enquiry from ${name}`,
        description: [
          "Enquiry received via the public website contact form.",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone ?? "not provided"}`,
          "",
          "Message:",
          message,
        ].join("\n"),
        teamRole: "receptionist",
        priority: "normal",
        status: "open",
      })
      .returning({ id: tasks.id });

    await recordAudit({
      actorType: "system",
      action: "public.contact_submitted",
      entityType: "task",
      entityId: inserted[0]?.id,
      ipAddress: ip === "unknown" ? null : ip,
      userAgent,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}
