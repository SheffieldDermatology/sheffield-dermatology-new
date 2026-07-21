"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Condition {
  href: string;
  label: string;
  icon: string;
}

const LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/fees", label: "Fees" },
  { href: "/insurance", label: "Insurance" },
  { href: "/patient-information", label: "Patient information" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PrimaryNav({ conditions }: { conditions: Condition[] }) {
  const pathname = usePathname();
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const conditionsActive = pathname.startsWith("/conditions") || pathname === "/treatments";

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link href="/" aria-current={isActive("/", true) ? "page" : undefined}>
        Home
      </Link>

      <div className="nav-item">
        <button className="nav-trigger" type="button" aria-haspopup="true" aria-expanded={false}>
          <span className={conditionsActive ? "nav-active-label" : ""}>Conditions</span>{" "}
          <span className="caret" aria-hidden="true"></span>
        </button>
        <div className="dropdown" role="menu">
          {conditions.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              role="menuitem"
              aria-current={isActive(c.href) ? "page" : undefined}
            >
              <span className="dot" aria-hidden="true">
                {c.icon}
              </span>
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {LINKS.slice(1).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href, link.exact) ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}

      <Link className="nav-book" href="/book" aria-current={isActive("/book") ? "page" : undefined}>
        Book
      </Link>
    </nav>
  );
}
