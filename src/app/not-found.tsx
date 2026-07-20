import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import "@/styles/public.css";
import "@/styles/brand.css";
import "@/styles/legal.css";
import logo from "../../public/assets/sheffield-dermatology-logo.png";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Rendered outside the (public) layout, so it brings its own header/styles.
export default function NotFound() {
  return (
    <div className="nf-page">
      <header className="nf-header">
        <div className="container">
          <Link href="/" aria-label="Sheffield Dermatology home">
            <Image src={logo} alt="Sheffield Dermatology" width={190} priority />
          </Link>
        </div>
      </header>
      <main className="nf-main">
        <div className="container">
          <span className="nf-code">Error 404</span>
          <h1>
            We couldn&rsquo;t find <em>that page.</em>
          </h1>
          <p>
            The page may have moved or no longer exists. Let&rsquo;s help you find what you need.
          </p>
          <div className="nf-links">
            <Link className="button" href="/">
              Back to home <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-link" href="/conditions">
              Conditions &amp; care
            </Link>
            <Link className="text-link" href="/contact">
              Contact
            </Link>
          </div>
          <p className="nf-urgent">
            Need urgent medical help? Call 999 in an emergency, or NHS 111 for urgent advice. See{" "}
            <Link href="/urgent-help">urgent medical help</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
