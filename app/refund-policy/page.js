import SectionHeader from "../../components/SectionHeader";
import { contactInfo } from "../../lib/siteInfo";

export const metadata = {
  title: "Cancellation & Refund Policy"
};

export default function RefundPolicyPage() {
  const contact = contactInfo();

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeader eyebrow="Legal" title="Cancellation and Refund Policy" description="How advance payments are handled for tournament registrations." />
        <div className="mt-8 grid gap-5 text-sm font-semibold leading-7 text-graphite/72">
          <p>Advance payments reserve a tournament slot and are adjusted against the final entry fee.</p>
          <p>If the organizer cancels the event, verified advance payments are refunded or moved to a rescheduled date, based on the player/team choice.</p>
          <p>If a player or team withdraws after fixtures are published, the advance is not refundable because the slot, venue time, and bracket planning have already been committed.</p>
          <p>UPI payments marked for verification are confirmed manually by the organizer. Share the payment screenshot on WhatsApp if verification is delayed.</p>
          <p>Refund support: {contact.email} or {contact.phone}.</p>
        </div>
      </div>
    </main>
  );
}
