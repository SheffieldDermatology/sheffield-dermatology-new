import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/info-pages.css";

export const metadata: Metadata = {
  title: "Insurance | Sheffield Dermatology",
  description:
    "How private medical insurance works for dermatology appointments at Sheffield Dermatology, including pre-authorisation and what to check with your insurer.",
};

export default function InsurancePage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">
            <span></span> Insurance
          </div>
          <h1>
            Using private <em>medical insurance.</em>
          </h1>
          <p className="page-lead">
            If you have private medical insurance, you may be able to claim for your dermatology
            care. A little preparation with your insurer avoids surprises.
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> Before you book
            </div>
            <h2>What to check with your insurer</h2>
          </div>
          <div className="info-prose">
            <p>
              Every policy is different. Before your appointment, it helps to check the following
              directly with your insurance provider:
            </p>
            <ul className="info-list">
              <li>Whether your policy covers dermatology consultations</li>
              <li>Whether you need a referral from your GP first</li>
              <li>Whether pre-authorisation is required, and your authorisation code</li>
              <li>Your policy or membership number</li>
              <li>Any excess or shortfall you may be responsible for paying</li>
            </ul>
            <p>
              Bringing your authorisation code and membership number to your appointment lets us
              process your claim smoothly.
            </p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="container info-columns">
          <div>
            <div className="eyebrow">
              <span></span> How it works
            </div>
            <h2>Claiming for your care</h2>
          </div>
          <div className="info-prose">
            <p>
              Where possible, eligible fees can be invoiced to your insurer. Any amount not covered
              by your policy — such as an excess or a shortfall — remains your responsibility, and
              we will always be clear about this.
            </p>
            <div className="tbc-panel">
              <strong>Dr Elangasinghe is recognised by Bupa.</strong> The full list of insurers he
              is recognised by, and the details of insurer billing, is being confirmed and will be
              published here. Please check your cover and any pre-authorisation requirements with
              your insurer, and <Link href="/contact">contact us</Link> if you have any questions.
            </div>
            <p>
              If you are paying for yourself instead, see our <Link href="/fees">fees page</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
