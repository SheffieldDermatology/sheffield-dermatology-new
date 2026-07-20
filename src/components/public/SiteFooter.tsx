import Link from "next/link";
import Image from "next/image";
import { getClinicInfo } from "@/lib/clinic-info";
import logo from "../../../public/assets/sheffield-dermatology-logo.png";

export default async function SiteFooter() {
  const clinic = await getClinicInfo();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" id="site-footer">
      <div className="container footer-top">
        <div className="footer-cols">
          <div>
            <Link className="brand footer-brand" href="/">
              <Image className="brand-logo" src={logo} alt="Sheffield Dermatology" width={208} />
            </Link>
            <p className="footer-tagline">
              Consultant-led dermatology for adults and children, delivered with clarity and care.
            </p>
          </div>

          <div className="footer-contact">
            <span className="footer-heading">Contact</span>
            {clinic.phone ? (
              <a href={`tel:${clinic.phone.replace(/\s+/g, "")}`}>Call: {clinic.phone}</a>
            ) : (
              <Link href="/contact">Contact the clinic</Link>
            )}
            {clinic.email ? <a href={`mailto:${clinic.email}`}>Email: {clinic.email}</a> : null}
            {clinic.locations && clinic.locations[0] ? (
              <p>
                {clinic.locations[0].name}
                <br />
                {clinic.locations[0].lines.join(", ")}
              </p>
            ) : null}
          </div>

          <div className="footer-links-col">
            <span className="footer-heading">Explore</span>
            <Link href="/conditions">Conditions &amp; care</Link>
            <Link href="/about">About Dr Elangasinghe</Link>
            <Link href="/fees">Fees</Link>
            <Link href="/book">Book online</Link>
            <Link href="/urgent-help">Urgent medical help</Link>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {year} Sheffield Dermatology</span>
        <nav aria-label="Legal navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cancellation-policy">Cancellations</Link>
          <Link href="/patient">Patient portal</Link>
          <Link href="/staff">Staff</Link>
        </nav>
      </div>
    </footer>
  );
}
