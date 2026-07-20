import Link from "next/link";
import Image from "next/image";
import MobileNav from "./MobileNav";
import { getClinicInfo } from "@/lib/clinic-info";
import logo from "../../../public/assets/sheffield-dermatology-logo.png";

export default async function SiteHeader() {
  const clinic = await getClinicInfo();

  return (
    <>
      <div className="notice-bar">
        <div className="container notice-inner">
          <span>Consultant-led dermatology in Sheffield</span>
          {clinic.phone ? (
            <a href={`tel:${clinic.phone.replace(/\s+/g, "")}`} aria-label="Call Sheffield Dermatology">
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
            <Image
              className="brand-logo"
              src={logo}
              alt="Sheffield Dermatology"
              width={210}
              priority
            />
          </Link>
          <MobileNav />
          <Link className="button button-small header-book" href="/book">
            Book an appointment
          </Link>
        </div>
      </header>
    </>
  );
}
