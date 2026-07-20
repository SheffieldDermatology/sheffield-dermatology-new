"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/conditions", label: "Conditions & care" },
  { href: "/about", label: "About Dr Elangasinghe" },
  { href: "/patient-information", label: "Patient information" },
  { href: "/fees", label: "Fees & insurance" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen((v) => !v)}
      >
        <span></span>
        <span></span>
        <span></span>
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <nav
        id="site-navigation"
        className={`site-nav${open ? " open" : ""}`}
        aria-label="Main navigation"
      >
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={close}>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
