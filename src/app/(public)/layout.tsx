import "@/styles/public.css";
import "@/styles/brand.css";
import SiteHeader from "@/components/public/SiteHeader";
import SiteFooter from "@/components/public/SiteFooter";
import CookieBanner from "@/components/public/CookieBanner";
import RevealEffects from "@/components/public/RevealEffects";

// Public pages render per request so owner-supplied details (phone, address,
// fees) are always current once entered in the admin area.
export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <CookieBanner />
      <RevealEffects />
    </>
  );
}
