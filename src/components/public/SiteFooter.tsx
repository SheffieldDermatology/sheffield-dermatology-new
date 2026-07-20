import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/assets/sheffield-dermatology-logo.png";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <Link className="brand footer-brand" href="/">
          <Image className="brand-logo" src={logo} alt="Sheffield Dermatology" width={210} />
        </Link>
        <p>Consultant-led dermatology care, delivered with clarity and consideration.</p>
        <a className="circle-link footer-arrow" href="#top" aria-label="Back to top">
          ↑
        </a>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Sheffield Dermatology</span>
        <nav aria-label="Legal navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cancellation-policy">Cancellations</Link>
          <Link href="/ai-scribe">AI scribe</Link>
          <Link href="/patient">Patient portal</Link>
          <Link href="/staff">Staff</Link>
        </nav>
        <Link href="/urgent-help">Urgent medical help</Link>
      </div>
    </footer>
  );
}
