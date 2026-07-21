"use server";

/**
 * Booking-enquiry and contact server actions for the lean public deployment.
 * Database-free: the patient's request is emailed to the clinic inbox and a
 * short confirmation is emailed back to the patient. Patients are asked not to
 * include detailed medical history.
 */
import { z } from "zod";
import { sendEmail } from "@/lib/email/site-mailer";
import { CLINIC_INBOX } from "@/lib/site-config";

export type EnquiryState = { ok?: boolean; error?: string } | null;

const APP_ORIGIN = process.env.APP_ORIGIN ?? "https://sheffielddermatology.com";

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  phone: z.string().trim().max(40).optional(),
  service: z.string().trim().min(1, "Please choose the appointment you need.").max(120),
  location: z.string().trim().max(80).optional(),
  contactMethod: z.string().trim().max(20).optional(),
  payer: z.enum(["Self-pay", "Insured"]).catch("Self-pay"),
  insurer: z.string().trim().max(80).optional(),
  policyNumber: z.string().trim().max(60).optional(),
  preAuth: z.string().trim().max(60).optional(),
  preferred: z.string().trim().max(600).optional(),
  message: z.string().trim().max(3000).optional(),
});

const GENERIC =
  "Sorry — we could not send your request just now. Please call the clinic on +44 7539 578959 or email contact@sheffielddermatology.com.";

async function deliver(input: {
  kind: "Booking enquiry" | "Contact enquiry";
  name: string;
  email: string;
  phone?: string;
  lines: string[];
}): Promise<EnquiryState> {
  const body = [
    `${input.kind} received via the website.`,
    "",
    `Name:  ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "not provided"}`,
    "",
    ...input.lines,
  ].join("\n");

  const clinic = await sendEmail({
    to: CLINIC_INBOX,
    subject: `${input.kind} — ${input.name}`,
    text: body,
    replyTo: input.email,
  });
  if (!clinic.ok) return { ok: false, error: GENERIC };

  // Best-effort acknowledgement to the patient (failure here is non-fatal).
  await sendEmail({
    to: input.email,
    subject: "We've received your request — Sheffield Dermatology",
    text:
      `Dear ${input.name},\n\n` +
      `Thank you — we have received your ${input.kind.toLowerCase()} and the clinic will contact you to confirm.\n\n` +
      `If your concern is urgent please do not wait for a reply: call 999 in an emergency, or NHS 111 for urgent advice.\n\n` +
      `Sheffield Dermatology\n${APP_ORIGIN}`,
  });

  return { ok: true };
}

export async function submitBookingEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  // Honeypot — real visitors never fill this.
  if (typeof formData.get("company") === "string" && (formData.get("company") as string).trim()) {
    return { ok: true };
  }
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    service: formData.get("service"),
    location: formData.get("location") || undefined,
    contactMethod: formData.get("contactMethod") || undefined,
    payer: formData.get("payer"),
    insurer: formData.get("insurer") || undefined,
    policyNumber: formData.get("policyNumber") || undefined,
    preAuth: formData.get("preAuth") || undefined,
    preferred: formData.get("preferred") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;
  const lines = [
    `Appointment: ${d.service}`,
    `Location:    ${d.location || "no preference"}`,
    `Payment:     ${d.payer}`,
  ];
  if (d.payer === "Insured") {
    lines.push(
      `  Insurer:        ${d.insurer || "not given"}`,
      `  Policy number:  ${d.policyNumber || "not given"}`,
      `  Pre-auth code:  ${d.preAuth || "not given"}`,
    );
  }
  lines.push(
    `Preferred contact: ${d.contactMethod || "not given"}`,
    `Preferred days/times: ${d.preferred || "no preference given"}`,
    "",
    "Message:",
    d.message || "(none)",
  );
  return deliver({ kind: "Booking enquiry", name: d.name, email: d.email, phone: d.phone, lines });
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10, "Please tell us a little more.").max(3000),
});

export async function submitContactMessage(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const honeypot = formData.get("company_website");
  if (typeof honeypot === "string" && honeypot.trim()) {
    return { ok: true };
  }
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;
  return deliver({
    kind: "Contact enquiry",
    name: d.name,
    email: d.email,
    phone: d.phone,
    lines: ["Message:", d.message],
  });
}
