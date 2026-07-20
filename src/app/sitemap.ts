import type { MetadataRoute } from "next";

const ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";

const PUBLIC_PATHS = [
  "",
  "/conditions",
  "/conditions/mole-assessment",
  "/conditions/acne-rosacea",
  "/conditions/eczema-psoriasis",
  "/conditions/hair-scalp-nails",
  "/conditions/general-dermatology",
  "/treatments",
  "/about",
  "/patient-information",
  "/fees",
  "/insurance",
  "/faq",
  "/contact",
  "/book",
  "/ai-scribe",
  "/urgent-help",
  "/privacy",
  "/cookies",
  "/accessibility",
  "/terms",
  "/cancellation-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${ORIGIN}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/conditions") || path === "/book" ? 0.8 : 0.5,
  }));
}
