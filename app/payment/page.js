import { Suspense } from "react";
import PaymentCheckout from "../../components/client/PaymentCheckout";
import SectionHeader from "../../components/SectionHeader";
import { contactInfo, paymentInfo } from "../../lib/siteInfo";
import { tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Payment"
};

export default function PaymentPage() {
  const contact = contactInfo();
  const payment = paymentInfo();

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Payment"
          title="Advance registration payment"
          description="Pay securely through Razorpay or UPI, then the organizer can verify your registration from the admin database."
        />
        <div className="mt-8">
          <Suspense fallback={<div className="rounded-lg bg-white p-6 font-black text-pitch shadow-sm">Preparing secure payment options...</div>}>
            <PaymentCheckout tournaments={tournaments} paymentConfig={payment} contact={contact} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
