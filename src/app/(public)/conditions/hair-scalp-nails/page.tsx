import ConditionPage, { conditionMetadata, type ConditionContent } from "@/components/public/ConditionPage";

export const metadata = conditionMetadata({
  title: "Hair, scalp & nail concerns",
  description:
    "Consultant-led assessment of hair loss, scalp symptoms and nail changes in Sheffield with Dr Vinod Elangasinghe.",
});

const content: ConditionContent = {
  slug: "hair-scalp-nails",
  eyebrow: "Hair, scalp & nails",
  h1: (
    <>
      Answers for hair,
      <br />
      <em>scalp and nails.</em>
    </>
  ),
  lead: "Hair thinning, an irritated scalp or a change in your nails can be unsettling and easy to dismiss. A dermatology assessment gives you a proper explanation and a plan.",
  intro: (
    <p>
      The hair, scalp and nails are part of the skin, and changes in them can have many different
      causes. Understanding the cause is the important first step — it determines whether
      something needs treatment, reassurance or simply monitoring.
    </p>
  ),
  covers: [
    {
      title: "Hair loss & thinning",
      copy: "Gradual thinning, patchy loss or increased shedding, in men and women.",
    },
    {
      title: "Scalp symptoms",
      copy: "An itchy, flaking, sore or persistently irritated scalp.",
    },
    {
      title: "Nail changes",
      copy: "Changes in the colour, shape, texture or thickness of the finger or toenails.",
    },
    {
      title: "Underlying causes",
      copy: "Assessment of whether a hair, scalp or nail change points to something that needs treating.",
    },
  ],
  atAppointment: (
    <>
      <p>
        Dr Vinod Elangasinghe will ask about how the change developed and examine the affected
        area — the scalp and hair, or the nails — using magnification where useful.
      </p>
      <ul>
        <li>An assessment to identify the likely cause.</li>
        <li>An explanation of what is happening and why.</li>
        <li>A treatment or management plan where one is needed.</li>
        <li>Advice on what to expect and when to review.</li>
      </ul>
      <p>
        Hair and nail conditions often change slowly, so a follow-up may be part of the plan to
        see how things are responding.
      </p>
    </>
  ),
  urgent: {
    heading: "When to seek help sooner",
    signs: [
      "Sudden or patchy hair loss, or hair loss with scalp soreness or scarring",
      "A new dark streak, mark or change under or around a single nail",
      "A scalp or nail change alongside feeling generally unwell",
    ],
  },
  related: [
    { href: "/conditions/mole-assessment", label: "Mole & lesion assessment" },
    { href: "/conditions/general-dermatology", label: "General dermatology" },
    { href: "/fees", label: "Consultation fees" },
  ],
};

export default function Page() {
  return <ConditionPage content={content} />;
}
