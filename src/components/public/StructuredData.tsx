import { getClinicInfo } from "@/lib/clinic-info";

const ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";

/**
 * JSON-LD structured data for the clinic. Only verified facts are emitted —
 * address and telephone appear solely when the owner has supplied them; no
 * qualifications, ratings or claims are ever invented.
 */
export default async function StructuredData() {
  const clinic = await getClinicInfo();

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Sheffield Dermatology",
    url: ORIGIN,
    medicalSpecialty: "Dermatology",
    areaServed: { "@type": "City", name: "Sheffield" },
    availableService: {
      "@type": "MedicalProcedure",
      name: "Consultant-led dermatology consultation",
    },
  };

  if (clinic.phone) data.telephone = clinic.phone;
  if (clinic.email) data.email = clinic.email;
  if (clinic.addressLines && clinic.addressLines.length > 0) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: clinic.addressLines.join(", "),
      addressLocality: "Sheffield",
      addressCountry: "GB",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
