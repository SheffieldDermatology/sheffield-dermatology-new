import ConditionPage, { conditionMetadata, type ConditionContent } from "@/components/public/ConditionPage";

export const metadata = conditionMetadata({
  title: "Acne & rosacea treatment",
  description:
    "Consultant-led assessment and individual treatment plans for acne, rosacea, redness and sensitive skin in Sheffield with Dr Vinod Elangasinghe.",
});

const content: ConditionContent = {
  slug: "acne-rosacea",
  eyebrow: "Acne & rosacea",
  h1: (
    <>
      A calmer plan
      <br />
      <em>for your skin.</em>
    </>
  ),
  lead: "Persistent breakouts, redness and flushing can be frustrating and wearing. A dermatology assessment builds a plan around your skin, rather than a one-size-fits-all prescription.",
  intro: (
    <p>
      Acne and rosacea are common, treatable conditions that can affect confidence as much as
      comfort. Both benefit from an accurate diagnosis — the two can look similar but are managed
      differently — and from a plan that considers your skin type, history and what you have
      already tried.
    </p>
  ),
  covers: [
    {
      title: "Acne",
      copy: "Spots, blackheads, cysts and the marks they leave behind, on the face, chest or back.",
    },
    {
      title: "Rosacea",
      copy: "Facial redness, flushing, visible blood vessels and bumps that come and go.",
    },
    {
      title: "Sensitive skin",
      copy: "Skin that reacts easily, stings or flushes, and is difficult to find products for.",
    },
    {
      title: "Scarring & marks",
      copy: "Discussion of options where breakouts have left scarring or lasting discolouration.",
    },
  ],
  atAppointment: (
    <>
      <p>
        Dr Vinod Elangasinghe will talk through how your skin behaves, what tends to trigger it
        and what treatments you have used before, then examine your skin to reach a clear
        diagnosis.
      </p>
      <ul>
        <li>An accurate diagnosis — acne, rosacea, or something else.</li>
        <li>A treatment plan matched to the type and severity of your condition.</li>
        <li>Practical guidance on skincare and triggers.</li>
        <li>A plan for review, so treatment can be adjusted as your skin responds.</li>
      </ul>
      <p>
        Some treatments take a few weeks to show their full effect, so your plan will usually
        include a follow-up. Any prescription is discussed with you, including how to use it and
        what to expect.
      </p>
    </>
  ),
  urgent: {
    heading: "When to seek help sooner",
    signs: [
      "Acne that is severe, painful or leaving scars — earlier treatment can limit lasting marks",
      "A sudden, severe flare that is affecting your wellbeing",
      "Eye irritation, grittiness or redness alongside rosacea, which can need specific treatment",
    ],
  },
  related: [
    { href: "/conditions/general-dermatology", label: "General dermatology" },
    { href: "/conditions/eczema-psoriasis", label: "Eczema & psoriasis" },
    { href: "/fees", label: "Consultation fees" },
  ],
};

export default function Page() {
  return <ConditionPage content={content} />;
}
