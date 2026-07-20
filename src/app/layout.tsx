import type { Metadata } from "next";
import { Poppins, DM_Sans } from "next/font/google";
import "./globals.css";

// Poppins — the friendly, rounded geometric sans used for headings and UI,
// echoing the reference design. DM Sans is kept as the body/fallback sans.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? "http://localhost:3000"),
  title: {
    default: "Sheffield Dermatology | Consultant-led skin care",
    template: "%s | Sheffield Dermatology",
  },
  description:
    "Consultant-led private dermatology care in Sheffield. Request an appointment with Dr Vinod Elangasinghe for expert assessment of skin, hair and nail concerns.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${dmSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
