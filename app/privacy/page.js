import SectionHeader from "../../components/SectionHeader";
import { contactInfo } from "../../lib/siteInfo";

export const metadata = {
  title: "Privacy Policy"
};

export default function PrivacyPage() {
  const contact = contactInfo();

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeader eyebrow="Legal" title="Privacy Policy" description="How tournament registration and payment information is collected and used." />
        <div className="mt-8 grid gap-5 text-sm font-semibold leading-7 text-graphite/72">
          <p>We collect player, captain, team, contact, emergency contact, and payment reference details to manage tournament registrations, fixtures, scorecards, refunds, and organizer communication.</p>
          <p>Payment details are processed by Razorpay or UPI apps. We store payment IDs, order IDs, verification status, and registration references, not card or banking credentials.</p>
          <p>Registration data is available only to authorized organizers through the protected admin dashboard. Data may be exported for event operations, attendance, fixture planning, and payment reconciliation.</p>
          <p>For correction or deletion requests, contact {contact.email} or {contact.phone}.</p>
        </div>
      </div>
    </main>
  );
}
