import ConditionPage, { conditionMetadata, type ConditionContent } from "@/components/public/ConditionPage";

export const metadata = conditionMetadata({
  title: "Mole & skin lesion assessment",
  description:
    "Consultant-led assessment of new, changing or concerning moles and other skin lesions in Sheffield with Dr Vinod Elangasinghe.",
});

const content: ConditionContent = {
  slug: "mole-assessment",
  eyebrow: "Moles & skin lesions",
  h1: (
    <>
      A worrying mole,
      <br />
      <em>assessed properly.</em>
    </>
  ),
  lead: "If a mole or another mark on your skin has changed, or is simply worrying you, a considered assessment can give you clarity and a clear plan.",
  intro: (
    <p>
      Most moles are harmless and stay the same throughout life. But a mole that is new in
      adulthood, or one that has started to change, deserves a careful look. A dermatology
      assessment is the reassuring, thorough way to understand what a mark on your skin is — and
      what, if anything, should be done about it.
    </p>
  ),
  covers: [
    {
      title: "New or changing moles",
      copy: "Moles that have appeared recently, or existing moles that have changed in size, shape, colour or outline.",
    },
    {
      title: "Symptoms to check",
      copy: "Moles that itch, bleed, crust, or that look different from your other moles.",
    },
    {
      title: "Other skin lesions",
      copy: "Lumps, spots and patches that are new, growing or not healing, including on the face and scalp.",
    },
    {
      title: "Peace of mind",
      copy: "A professional opinion when you are unsure whether something needs checking at all.",
    },
  ],
  atAppointment: (
    <>
      <p>
        Dr Vinod Elangasinghe will ask about the history of the mark — when you noticed it and
        whether it has changed — and examine your skin. Where helpful, a dermatoscope (a
        specialised magnifier) is used to look at a lesion in more detail.
      </p>
      <ul>
        <li>An unhurried examination of the area you are concerned about.</li>
        <li>Where appropriate, a wider check of your skin.</li>
        <li>A clear explanation of what the lesion appears to be.</li>
        <li>
          A plan for what happens next — which may be reassurance, a review to monitor for change,
          or a discussion of removal or further tests where indicated.
        </li>
      </ul>
      <p>
        Any decision about a procedure or further investigation is discussed with you first, with
        time to ask questions. Fees for the consultation and any agreed procedure are explained
        before anything goes ahead.
      </p>
    </>
  ),
  urgent: {
    heading: "Signs a mole should be looked at sooner",
    intro:
      "Skin cancer is very treatable when found early. Please arrange a prompt assessment — or speak to your GP — if you notice a mole or skin lesion that is:",
    signs: [
      "Changing in size, shape or colour",
      "Developing an irregular or blurred edge, or more than one colour",
      "Larger than most of your other moles (around 6mm or more)",
      "Itching, bleeding, crusting or not healing",
      "New and looks different from your other moles (an \"ugly duckling\")",
    ],
    footer: (
      <>
        A prompt review does not mean something is seriously wrong — most changes turn out to be
        harmless — but it is always the safer choice.
      </>
    ),
  },
  related: [
    { href: "/conditions/general-dermatology", label: "General dermatology" },
    { href: "/conditions", label: "All conditions we care for" },
    { href: "/fees", label: "Consultation fees" },
  ],
};

export default function Page() {
  return <ConditionPage content={content} />;
}
