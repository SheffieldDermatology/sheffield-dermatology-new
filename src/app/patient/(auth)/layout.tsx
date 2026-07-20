import "@/app/globals.css";
import "@/styles/auth.css";

export const metadata = { robots: { index: false, follow: false } };

export default function PatientAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
