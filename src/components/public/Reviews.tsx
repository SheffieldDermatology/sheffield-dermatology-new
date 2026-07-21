/**
 * Verified patient reviews from iWantGreatCare (a third-party, independent
 * review platform). Aggregate rating and quotes are sourced from Dr
 * Elangasinghe's public iWantGreatCare profile; the section links to the live
 * profile for the current total. These are third-party verified reviews, not
 * clinic-authored testimonials.
 */
const IWGC_URL = "https://www.iwantgreatcare.org/doctors/dr-vinod-elangasinghe";

const REVIEWS = [
  {
    body:
      "Dr Elangasinghe is amazing! He diagnosed the rosacea straight away and the prescription has worked brilliantly. I am so very pleased and grateful.",
    date: "July 2026",
  },
  {
    body:
      "Highly recommended. Dr Elangasinghe was professional, knowledgeable and took time to explain my diagnosis and treatment plan clearly. The care I received made me feel completely comfortable and reassured.",
    date: "July 2026",
  },
  {
    body:
      "Doctor Elangasinghe provides an excellent service in a very professional manner and I would have no hesitation in recommending him to others.",
    date: "June 2026",
  },
];

function Stars() {
  return (
    <span className="stars" aria-hidden="true">
      ★★★★★
    </span>
  );
}

export default function Reviews() {
  return (
    <section className="reviews-band" aria-label="Patient reviews">
      <div className="container">
        <div className="reviews-head reveal">
          <div>
            <span className="eyebrow">
              <span></span> What patients say
            </span>
            <h2>
              Rated <em>5.0 out of 5</em>
            </h2>
          </div>
          <div className="reviews-badge">
            <Stars />
            <strong>5.0 / 5</strong>
            <small>
              135 verified ratings on{" "}
              <a href={IWGC_URL} target="_blank" rel="noopener noreferrer">
                iWantGreatCare
              </a>
            </small>
            <span className="badge badge-ok">Certificate of Excellence 2025</span>
          </div>
        </div>

        <div className="reviews-grid">
          {REVIEWS.map((r, i) => (
            <figure key={i} className={`review-card reveal${i === 1 ? " delay-1" : i === 2 ? " delay-2" : ""}`}>
              <Stars />
              <blockquote>{r.body}</blockquote>
              <figcaption>
                Verified patient review · {r.date}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="reviews-foot">
          Reviews are independently collected and verified by{" "}
          <a href={IWGC_URL} target="_blank" rel="noopener noreferrer">
            iWantGreatCare
          </a>
          . Read all reviews on the live profile.
        </p>
      </div>
    </section>
  );
}
