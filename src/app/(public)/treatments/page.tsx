import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Treatments & services | Sheffield Dermatology",
  description:
    "Medical, surgical and laser dermatology services offered by Dr Vinod Elangasinghe at Sheffield Dermatology — assessed and agreed with you at consultation.",
};

// Service taxonomy taken from the clinic's own previously-published site
// (medical / surgical / laser categories). Pending clinical review before launch.
const MEDICAL = [
  "Acne treatment",
  "Allergy & patch testing",
  "Dermatology consultation",
  "Eczema treatment",
  "Hair loss & alopecia",
  "Head and neck cancer",
  "Warts (HPV) & vaccinations",
  "Hyperhidrosis (excessive sweating)",
  "Keratosis",
  "Mole mapping & melanoma",
  "Paediatric dermatology",
  "Boils",
  "Daylight photodynamic therapy (PDT)",
  "Psoriasis",
  "Skin patch testing",
  "Immunosuppressant & immunomodulatory therapy",
  "Biological therapies",
  "Hidradenitis suppurativa (HS)",
  "Vitiligo",
  "Leg ulcers & red legs",
  "Photo-ageing & skin rejuvenation",
  "Nail disorders",
  "Haemangiomas",
  "Birth marks & blemishes",
  "Skin infections",
  "Rosacea / red face",
  "Pigmentation problems",
  "Keloids",
  "Molluscum contagiosum",
  "Allergic disorders of the skin",
];

const SURGICAL = [
  "Abscess incision & drainage",
  "Surgical removal of lumps & bumps",
  "Skin cancer / mole screening",
  "Skin cancer removal",
  "Skin cancer – melanoma",
  "Skin cancer – non-melanoma",
  "Skin tags & other growths",
  "Cryotherapy & cryosurgery",
  "Minor & invasive skin surgery",
];

const LASER = [
  "Pulsed dye laser (V Beam Candela)",
  "CO₂ fractional laser (CO2RE)",
  "PRP injections",
  "Q-switched Nd:YAG laser",
];

function ServiceList({ title, number, items }: { title: string; number: string; items: string[] }) {
  return (
    <section className="info-section">
      <div className="container info-columns">
        <div>
          <div className="eyebrow">
            <span></span> {number}
          </div>
          <h2>{title}</h2>
        </div>
        <div className="info-prose">
          <ul className="info-list" style={{ columns: 2, columnGap: "34px" }}>
            {items.map((item) => (
              <li key={item} style={{ breakInside: "avoid" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function TreatmentsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Treatments &amp; services
          </div>
          <h1>
            Medical, surgical <em>&amp; laser dermatology.</em>
          </h1>
          <p className="page-lead">
            Dr Vinod Elangasinghe offers a broad range of medical, surgical and laser dermatology
            services for adults and children. Every treatment begins with an accurate diagnosis and
            is agreed with you — including its cost — at your consultation.
          </p>
        </div>
      </section>

      <ServiceList title="Medical dermatology" number="Medical" items={MEDICAL} />
      <ServiceList title="Surgical dermatology" number="Surgical" items={SURGICAL} />
      <ServiceList title="Laser & rejuvenation" number="Laser" items={LASER} />

      <section className="info-section">
        <div className="container">
          <div className="tbc-panel">
            <strong>Service list pending clinical review.</strong> This list reflects the areas of
            care offered and is being reviewed and priced before launch. Not every item may be
            available at every appointment type — if you are unsure which appointment you need,{" "}
            <Link href="/contact">contact the clinic</Link> and we will help. See also our{" "}
            <Link href="/fees">fees</Link> page.
          </div>
          <div className="not-monitored" style={{ marginTop: "24px" }}>
            <h2>Ready to be seen?</h2>
            <p>
              Book a consultation and Dr Vinod Elangasinghe will assess your concern and set out
              the options.{" "}
              <Link href="/book">
                <strong>Book an appointment →</strong>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
