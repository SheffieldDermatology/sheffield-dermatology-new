"use client";

/**
 * Cookie preferences. The platform sets only strictly-necessary cookies
 * (session, CSRF, this preference). No analytics or advertising cookies
 * exist; if any are ever added they must be gated on the stored preference.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const PREF_COOKIE = "sd_cookie_prefs";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${PREF_COOKIE}=`))) {
      setVisible(true);
    }
  }, []);

  function store(value: "essential" | "all") {
    document.cookie = `${PREF_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie preferences">
      <p>
        <strong>Your privacy matters.</strong> This website uses only strictly necessary
        cookies for security and signing in — no analytics or advertising cookies. Read the{" "}
        <Link href="/cookies">cookie policy</Link>.
      </p>
      <button type="button" onClick={() => store("essential")}>
        Understood
      </button>
    </div>
  );
}
