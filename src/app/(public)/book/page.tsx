import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { services, clinicians } from "@/lib/db/schema";
import { bookingLiveEnabled } from "@/lib/booking/provider";
import BookingWizard from "./BookingWizard";
import "@/styles/booking.css";

export const metadata: Metadata = {
  title: "Book an appointment",
  description:
    "Book a consultant-led dermatology appointment with Dr Vinod Elangasinghe in Sheffield — in person or by video consultation.",
};

export default async function BookPage() {
  const db = getDb();
  const [serviceRows, clinicianRows, live] = await Promise.all([
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder)),
    db.select().from(clinicians).where(eq(clinicians.active, true)),
    bookingLiveEnabled(),
  ]);

  return (
    <>
      <section className="book-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Appointments
          </div>
          <h1>Book your appointment</h1>
          <p className="page-lead">
            Choose an appointment type, pick a time that suits you and enter your details. It takes
            about two minutes.
          </p>
        </div>
      </section>
      <section className="book-wrap">
        <div className="container">
          <BookingWizard
            services={serviceRows.map((s) => ({
              id: s.id,
              name: s.name,
              shortDescription: s.shortDescription,
              durationMinutes: s.durationMinutes,
              pricePence: s.pricePence,
            }))}
            clinicians={clinicianRows.map((c) => ({ id: c.id, fullName: c.fullName, title: c.title }))}
            bookingLive={live}
          />
        </div>
      </section>
    </>
  );
}
