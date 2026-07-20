import ConditionPage, { conditionMetadata, type ConditionContent } from "@/components/public/ConditionPage";

export const metadata = conditionMetadata({
  title: "General dermatology",
  description:
    "Consultant-led review of rashes, itching, pigmentation changes and other adult skin concerns in Sheffield with Dr Vinod Elangasinghe.",
});

const content: ConditionContent = {
  slug: "general-dermatology",
  eyebrow: "General dermatology",
  h1: (
    <>
      Any skin concern,
      <br />
      <em>properly assessed.</em>
    </>
  ),
  lead: "Not every skin problem fits a neat category. A general dermatology appointment is the place to bring any adult skin concern — including the ones you cannot name.",
  intro: (
    <p>
      A general dermatology consultation is a broad, unhurried assessment of whatever is affecting
      your skin. It is ideal when you are not sure which appointment to choose, or when a concern
      spans more than one area.
    </p>
  ),
  covers: [
    {
      title: "Rashes & itching",
      copy: "New or persistent rashes, hives, and itching without an obvious cause.",
    },
    {
      title: "Pigmentation",
      copy: "Dark or pale patches, uneven skin tone and changes in existing marks.",
    },
    {
      title: "Lumps & bumps",
      copy: "Skin lumps, cysts and growths you would like checked or discussed.",
    },
    {
      title: "Something unnamed",
      copy: "Any skin change you cannot categorise but would like a professional opinion on.",
    },
  ],
  atAppointment: (
    <>
      <p>
        Dr Vinod Elangasinghe will listen to your concern, take a history and examine your skin,
        then explain what the problem appears to be and how best to approach it.
      </p>
      <ul>
        <li>A thorough assessment of your concern.</li>
        <li>A clear diagnosis or, where needed, a plan to reach one.</li>
        <li>A treatment or management plan explained in plain language.</li>
        <li>Onward advice or review where appropriate.</li>
      </ul>
      <p>
        If your concern turns out to fit a specific area — a mole, acne, eczema or a hair or nail
        issue — it is assessed with the same expertise within the same appointment.
      </p>
    </>
  ),
  urgent: {
    heading: "When to seek help sooner",
    signs: [
      "A rash that spreads quickly, blisters, or comes with feeling unwell, facial swelling or difficulty breathing (seek emergency help)",
      "A skin lesion that is new, growing, bleeding or not healing",
      "Any skin change alongside fever or feeling generally unwell",
    ],
  },
  related: [
    { href: "/conditions/mole-assessment", label: "Mole & lesion assessment" },
    { href: "/conditions", label: "All conditions we care for" },
    { href: "/book", label: "Book an appointment" },
  ],
};

export default function Page() {
  return <ConditionPage content={content} />;
}
