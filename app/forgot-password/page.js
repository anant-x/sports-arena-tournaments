import Link from "next/link";
import SectionHeader from "../../components/SectionHeader";
import { contactInfo, whatsappUrl } from "../../lib/siteInfo";
import { platform } from "../../lib/tournament";

export const metadata = {
  title: "Password Help"
};

export default function ForgotPasswordPage() {
  const contact = contactInfo();
  const whatsapp = whatsappUrl(`Hi, I need help accessing my ${platform.name} account.`);

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          eyebrow="Account Help"
          title="Forgot your password?"
          description="Password reset emails are not enabled yet. Contact the organizer desk to verify your account and update access."
        />
        <div className="mt-8 rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-3 text-sm font-semibold text-graphite/72">
            <a href={`mailto:${contact.email}`} className="rounded-md bg-floodlight px-4 py-3 text-pitch">{contact.email}</a>
            <a href={`tel:${contact.phone}`} className="rounded-md bg-floodlight px-4 py-3 text-pitch">{contact.phone}</a>
          </div>
          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="tap-target flex items-center justify-center rounded-md bg-[#25D366] px-5 py-3 text-sm font-black text-pitch">
                WhatsApp Support
              </a>
            ) : null}
            <Link href="/login" className="tap-target flex items-center justify-center rounded-md border border-graphite/15 px-5 py-3 text-sm font-black text-pitch">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
