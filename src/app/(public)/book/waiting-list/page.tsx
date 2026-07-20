import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import WaitingListForm from "./WaitingListForm";
import "@/styles/booking.css";

export const metadata: Metadata = {
  title: "Join the waiting list",
  description:
    "Join the Sheffield Dermatology waiting list and we will contact you when a suitable appointment becomes available.",
};

export default async function WaitingListPage() {
  const db = getDb();
  const rows = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));

  return (
    <>
      <section className="book-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Waiting list
          </div>
          <h1>Join the waiting list</h1>
          <p className="page-lead">
            If nothing suitable is showing, leave your details and we&rsquo;ll be in touch when an
            appointment opens up that fits.
          </p>
        </div>
      </section>
      <section className="book-wrap">
        <div className="container">
          <div className="book-shell">
            <WaitingListForm services={rows} />
          </div>
        </div>
      </section>
    </>
  );
}
