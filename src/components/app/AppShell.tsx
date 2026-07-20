import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/server/auth";
import logo from "../../../public/assets/sheffield-dermatology-logo.png";
import MobileNavToggle from "./MobileNavToggle";
import AppNav from "./AppNav";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  count?: number;
}

export default function AppShell(props: {
  title: string;
  roleLabel: string;
  navItems: NavItem[];
  userName: string;
  userInitials: string;
  userSubtitle: string;
  demoBanner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell" id="app-shell">
      <aside className="app-sidebar" aria-label="Portal navigation">
        <Link className="app-brand" href={props.navItems[0]?.href ?? "/"}>
          <Image src={logo} alt="Sheffield Dermatology" width={190} priority />
        </Link>
        <span className="app-role-chip">{props.roleLabel}</span>
        <AppNav items={props.navItems} rootHref={props.navItems[0]?.href ?? "/"} />
        <div className="app-sidebar-footer">
          <div className="app-avatar">{props.userInitials}</div>
          <div className="who">
            <strong>{props.userName}</strong>
            <small>{props.userSubtitle}</small>
          </div>
          <form action={signOut}>
            <button className="app-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="app-main">
        {props.demoBanner ? (
          <div className="app-demo-banner">
            Demonstration environment — all data shown is fictional. No real patient information is
            stored here.
          </div>
        ) : null}
        <header className="app-topbar">
          <MobileNavToggle />
          <h1>{props.title}</h1>
        </header>
        <div className="app-content">{props.children}</div>
      </div>
    </div>
  );
}
