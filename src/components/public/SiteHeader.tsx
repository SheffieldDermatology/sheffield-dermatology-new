import Link from "next/link";
import Image from "next/image";
import MobileNav from "./MobileNav";
import PrimaryNav from "./PrimaryNav";
import { getClinicInfo } from "@/lib/clinic-info";
import logo from "../../../public/assets/sheffield-dermatology-logo.png";

const CONDITIONS = [
  { href: "/conditions/mole-assessment", label: "Moles & skin lesions", icon: "◉" },
  { href: "/conditions/acne-rosacea", label: "Acne & rosacea", icon: "✦" },
  { href: "/conditions/eczema-psoriasis", label: "Eczema & psoriasis", icon: "❋" },
  { href: "/conditions/hair-scalp-nails", label: "Hair, scalp & nails", icon: "❧" },
  { href: "/conditions/general-dermatology", label: "General dermatology", icon: "✚" },
  { href: "/treatments", label: "All treatments & services", icon: "☰" },
];

export default async function SiteHeader() {
  const clinic = await getClinicInfo();
  const telHref = clinic.phone ? `tel:${clinic.phone.replace(/\s+/g, "")}` : "/contact";

  return (
    <div className="site-topbar">
      <div className="notice-bar">
        <div className="container notice-inner">
          <span>Consultant-led dermatology in Sheffield · Adults &amp; children</span>
          {clinic.phone ? (
            <a href={telHref} aria-label="Call Sheffield Dermatology">
              Call {clinic.phone}
            </a>
          ) : (
            <Link href="/contact">Contact the clinic</Link>
          )}
        </div>
      </div>

      <header className="site-header" id="top">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="Sheffield Dermatology home">
            <Image className="brand-logo" src={logo} alt="Sheffield Dermatology" width={208} priority />
          </Link>

          <MobileNav conditions={CONDITIONS} />

          {/* Circular action chips (desktop) */}
          <div className="header-chips" aria-label="Quick actions">
            <a className="chip chip-call" href={telHref}>
              <span>
                Call
                <br />
                us
              </span>
            </a>
            <Link className="chip chip-find" href="/contact">
              <span>
                Find
                <br />
                us
              </span>
            </Link>
            <Link className="chip chip-book" href="/book">
              <span>
                Book
                <br />
                online
              </span>
            </Link>
          </div>

          {/* Primary navigation with dropdown + active highlighting */}
          <PrimaryNav conditions={CONDITIONS} />
        </div>
      </header>
    </div>
  );
}
