import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/assets/sheffield-dermatology-logo.png";

export default function AuthShell(props: {
  title: string;
  intro: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  wide?: boolean;
}) {
  return (
    <div className="auth-shell">
      <div className={`auth-card${props.wide ? " auth-card-wide" : ""}`}>
        <Link href="/" aria-label="Sheffield Dermatology home">
          <Image className="auth-logo" src={logo} alt="Sheffield Dermatology" width={200} priority />
        </Link>
        <h1>{props.title}</h1>
        <p>{props.intro}</p>
        {props.children}
      </div>
      <p className="auth-back">
        <Link href={props.backHref ?? "/"}>{props.backLabel ?? "← Back to the website"}</Link>
      </p>
    </div>
  );
}
