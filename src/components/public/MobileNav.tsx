"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface Condition {
  href: string;
  label: string;
  icon: string;
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Dr Elangasinghe" },
  { href: "/fees", label: "Fees" },
  { href: "/insurance", label: "Insurance" },
  { href: "/patient-information", label: "Patient information" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export default function MobileNav({ conditions }: { conditions: Condition[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((v) => !v)}
      >
        <span></span>
        <span></span>
        <span></span>
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <nav
        id="mobile-navigation"
        className={`mobile-nav${open ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        <Link href="/" onClick={close}>
          Home
        </Link>
        <span className="mobile-nav-label">Conditions &amp; care</span>
        {conditions.map((c) => (
          <Link key={c.href} href={c.href} onClick={close} className="mobile-nav-sub">
            <span aria-hidden="true">{c.icon}</span> {c.label}
          </Link>
        ))}
        {LINKS.slice(1).map((link) => (
          <Link key={link.href} href={link.href} onClick={close}>
            {link.label}
          </Link>
        ))}
        <Link className="button" href="/book" onClick={close}>
          Book online →
        </Link>
      </nav>
    </>
  );
}
