/**
 * Static site configuration for the public "info + enquiry" deployment.
 *
 * When SITE_ONLY is set (the lean Vercel deployment), the public pages read
 * clinic details and the service list from here instead of the database, so
 * the site needs no Postgres. In the full platform (SITE_ONLY unset), the
 * database remains the source of truth.
 *
 * All values below are owner-confirmed public business information.
 */
export const SITE_ONLY =
  process.env.SITE_ONLY === "1" ||
  process.env.SITE_ONLY === "true" ||
  // Safety default: in production with no database configured, run the lean
  // public "info + enquiry" site rather than crashing on a missing DATABASE_URL.
  (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL);

/** Inbox that booking enquiries and contact messages are emailed to. */
export const CLINIC_INBOX = process.env.CLINIC_INBOX ?? "contact@sheffielddermatology.com";

export const CLINIC = {
  phone: "+44 7539 578959",
  email: "contact@sheffielddermatology.com",
  locations: [
    { name: "Thornbury Hospital", lines: ["312 Fulwood Road", "Sheffield", "S10 3BR"] },
    { name: "Alexandra Hospital", lines: ["Mill Lane, Cheadle", "Cheshire", "SK8 2PX"] },
  ],
} as const;

/** Owner-confirmed professional details for Dr Vinod Elangasinghe. */
export const CLINICIAN = {
  name: "Dr Vinod Elangasinghe",
  title: "Consultant Dermatologist",
  gmcNumber: "6027383",
  qualifications: "MBBS, FRCP, MRCP Derm UK",
  languages: ["English"],
  memberships: [
    "Fellow — Royal College of Physicians, London",
    "Fellow — Royal Society of Medicine",
    "Member — British Association of Dermatologists",
    "Member — British Association of Paediatric Dermatologists",
    "Member — North of England Dermatology Society",
    "Member — British Hair and Nail Society",
  ],
} as const;

/** Full treatment list offered by Dr Elangasinghe (owner-confirmed). */
export const TREATMENTS = [
  "Abscess incision and drainage",
  "Acne treatment",
  "Actinic keratosis",
  "Allergy medicine",
  "Allergy testing",
  "Cancer screening and diagnostics",
  "Cryotherapy treatment",
  "Dermatology consultation",
  "Eczema treatment",
  "Hair loss (alopecia) treatment",
  "Head and neck cancer",
  "HPV (human papillomavirus) vaccination",
  "Hyperhidrosis (excessive sweating)",
  "Narrowband UVB phototherapy treatment",
  "Non-melanoma skin cancer",
  "Paediatric dermatology",
  "Photodynamic treatment",
  "Pilonidal sinus surgery",
  "Psoriasis",
  "Skin cancer — melanoma",
  "Skin cancer facial skin removal treatment",
  "Skin lesion removal surgery",
  "Skin patch testing",
  "Skin tag removal (acrochordon)",
] as const;

/** Services offered — used by the fees page and the enquiry form. */
export const SERVICES = [
  { slug: "mole-assessment", name: "Mole or skin lesion assessment", durationMinutes: 30 },
  { slug: "acne-rosacea", name: "Acne or rosacea consultation", durationMinutes: 30 },
  { slug: "eczema-psoriasis", name: "Eczema or psoriasis consultation", durationMinutes: 30 },
  { slug: "hair-scalp-nails", name: "Hair, scalp or nail consultation", durationMinutes: 30 },
  { slug: "general-dermatology", name: "General dermatology consultation", durationMinutes: 45 },
  { slug: "follow-up", name: "Follow-up appointment", durationMinutes: 20 },
] as const;
