"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./AppShell";

export default function AppNav({ items, rootHref }: { items: NavItem[]; rootHref: string }) {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Sections">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== rootHref && pathname.startsWith(item.href + "/")) ||
          (item.href !== rootHref && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <i className="ico" aria-hidden="true">
              {item.icon}
            </i>
            <span>{item.label}</span>
            {item.count ? <span className="count">{item.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
