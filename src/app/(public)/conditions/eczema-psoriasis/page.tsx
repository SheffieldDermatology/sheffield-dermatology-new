import ConditionPage, { conditionMetadata, type ConditionContent } from "@/components/public/ConditionPage";

export const metadata = conditionMetadata({
  title: "Eczema & psoriasis care",
  description:
    "Consultant-led support for eczema, psoriasis and other inflammatory skin conditions in Sheffield with Dr Vinod Elangasinghe.",
});

const content: ConditionContent = {
  slug: "eczema-psoriasis",
  eyebrow: "Eczema & psoriasis",
  h1: (
    <>
      Relief for skin
      <br />
      <em>that keeps flaring.</em>
    </>
  ),
  lead: "Itchy, inflamed or flaking skin that keeps coming back is exhausting. A specialist assessment can find what is driving it and set out a plan to bring it under control.",
  intro: (
    <p>
      Eczema and psoriasis are long-term inflammatory skin conditions that tend to come and go.
      They are very manageable with the right approach, but that often means more than a single
      cream — it means understanding your particular pattern and building a routine you can
      actually keep to.
    </p>
  ),
  covers: [
    {
      title: "Eczema (dermatitis)",
      copy: "Dry, itchy, inflamed skin, including contact and allergic dermatitis.",
    },
    {
      title: "Psoriasis",
      copy: "Thickened, scaly patches on the scalp, elbows, knees and elsewhere.",
    },
    {
      title: "Long-standing flares",
      copy: "Conditions that have never quite settled despite over-the-counter or GP treatment.",
    },
    {
      title: "Day-to-day impact",
      copy: "Itch, sleep, discomfort and the effect on how you feel — all part of the picture.",
    },
  ],
  atAppointment: (
    <>
      <p>
        Dr Vinod Elangasinghe will look at where your skin is affected and how it behaves over
        time, ask about triggers and previous treatments, and explain what is happening in the
        skin.
      </p>
      <ul>
        <li>A clear diagnosis and explanation of your condition.</li>
        <li>A stepwise treatment plan, from everyday skincare to prescribed treatments.</li>
        <li>Guidance on managing flares and reducing triggers.</li>
        <li>Follow-up to review progress and adjust the plan.</li>
      </ul>
      <p>
        Where a condition is more complex or widespread, the options for further treatment are
        discussed with you so you can decide together on the next step.
      </p>
    </>
  ),
  urgent: {
    heading: "When to seek help sooner",
    signs: [
      "Skin that becomes hot, weeping, crusted or increasingly painful, which can indicate infection",
      "A widespread, rapidly worsening rash, especially with feeling generally unwell",
      "Eczema or psoriasis that is severely affecting sleep, work or wellbeing",
    ],
  },
  related: [
    { href: "/conditions/acne-rosacea", label: "Acne & rosacea" },
    { href: "/conditions/general-dermatology", label: "General dermatology" },
    { href: "/patient-information", label: "Preparing for your visit" },
  ],
};

export default function Page() {
  return <ConditionPage content={content} />;
}
