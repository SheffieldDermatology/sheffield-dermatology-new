import Link from "next/link";
import { getClinicInfo } from "@/lib/clinic-info";

/** Sticky Call + Book bar shown only on small screens (CSS-controlled). */
export default async function MobileCTABar() {
  const clinic = await getClinicInfo();
  return (
    <div className="mobile-cta" aria-label="Quick actions">
      {clinic.phone ? (
        <a className="mobile-cta-call" href={`tel:${clinic.phone.replace(/\s+/g, "")}`}>
          <span aria-hidden="true">✆</span> Call clinic
        </a>
      ) : (
        <Link className="mobile-cta-call" href="/contact">
          Contact
        </Link>
      )}
      <Link className="mobile-cta-book" href="/book">
        Book appointment
      </Link>
    </div>
  );
}
