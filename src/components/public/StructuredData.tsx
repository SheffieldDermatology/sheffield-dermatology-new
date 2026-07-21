import { getClinicInfo } from "@/lib/clinic-info";
import { CLINICIAN } from "@/lib/site-config";

const ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";

/**
 * JSON-LD structured data. Only verified facts are emitted — GMC number,
 * confirmed memberships, and addresses/phone that the clinic has supplied. No
 * ratings or claims are invented.
 */
export default async function StructuredData() {
  const clinic = await getClinicInfo();

  const addresses = (clinic.locations ?? []).map((loc) => ({
    "@type": "PostalAddress",
    name: loc.name,
    streetAddress: loc.lines.slice(0, -2).join(", ") || loc.lines[0],
    addressLocality: loc.lines[loc.lines.length - 2] ?? "Sheffield",
    postalCode: loc.lines[loc.lines.length - 1],
    addressCountry: "GB",
  }));

  const business: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "MedicalClinic", "LocalBusiness"],
    name: "Sheffield Dermatology",
    url: ORIGIN,
    medicalSpecialty: "Dermatology",
    areaServed: [
      { "@type": "City", name: "Sheffield" },
      { "@type": "City", name: "Manchester" },
    ],
    ...(clinic.phone ? { telephone: clinic.phone } : {}),
    ...(clinic.email ? { email: clinic.email } : {}),
    ...(addresses.length ? { address: addresses } : {}),
  };

  const physician: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: CLINICIAN.name,
    medicalSpecialty: "Dermatology",
    url: `${ORIGIN}/about`,
    ...(clinic.phone ? { telephone: clinic.phone } : {}),
    identifier: {
      "@type": "PropertyValue",
      propertyID: "GMC",
      value: CLINICIAN.gmcNumber,
    },
    memberOf: CLINICIAN.memberships.map((m) => ({
      "@type": "Organization",
      name: m.replace(/^(Fellow|Member)\s+—\s+/, ""),
    })),
    ...(addresses.length ? { workLocation: addresses } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(physician) }} />
    </>
  );
}
