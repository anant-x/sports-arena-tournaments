import SectionHeader from "../../components/SectionHeader";
import { contactInfo } from "../../lib/siteInfo";

export const metadata = {
  title: "Terms"
};

export default function TermsPage() {
  const contact = contactInfo();

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeader eyebrow="Legal" title="Terms and Conditions" description="Rules for using the platform and joining hosted tournaments." />
        <div className="mt-8 grid gap-5 text-sm font-semibold leading-7 text-graphite/72">
          <p>Players and teams must submit accurate registration details and follow tournament-specific rules, reporting times, venue instructions, footwear/equipment restrictions, and organizer decisions.</p>
          <p>A slot is confirmed only after the organizer verifies registration details and advance payment. Fixtures, timings, venues, and formats may change for weather, venue operations, or tournament management reasons.</p>
          <p>Misconduct, false details, unsafe play, or violation of venue rules can lead to disqualification without refund after fixtures are published.</p>
          <p>For tournament questions, contact {contact.name} at {contact.email}.</p>
        </div>
      </div>
    </main>
  );
}
