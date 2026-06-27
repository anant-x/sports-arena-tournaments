import Link from "next/link";
import SectionHeader from "../../components/SectionHeader";
import { contactInfo, whatsappUrl } from "../../lib/siteInfo";
import { platform, sportsList, tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Contact & About"
};

export default function AboutPage() {
  const contact = contactInfo();
  const whatsapp = whatsappUrl("Hi, I need help with tournament registration or payment.");
  const contactRows = [
    ["Platform", platform.name],
    ["Organizer", contact.name],
    ["Phone", contact.phone],
    ["Email", contact.email],
    ["Address", contact.address],
    ["Social", contact.social]
  ];

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <SectionHeader
            eyebrow="Organizer"
            title="Contact and hosting information"
            description="Reach the operations team for tournament listing, registration, payments, sponsorship, fixture updates, and venue questions."
          />
          <div className="stagger-list mt-8 grid gap-4">
            {contactRows.map(([label, value]) => (
              <div key={label} className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-black uppercase text-turf">{label}</p>
                {label === "Social" && contact.instagramUrl ? (
                  <a href={contact.instagramUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex break-words text-base font-black text-pitch underline decoration-turf/40 underline-offset-4 sm:text-lg">
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 break-words text-base font-black text-pitch sm:text-lg">{value}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="shine-button tap-target flex items-center justify-center rounded-md bg-[#25D366] px-5 py-3 text-sm font-black text-pitch">
                WhatsApp Organizer
              </a>
            ) : null}
            <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="shine-button tap-target flex items-center justify-center rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">
              Open Venue Map
            </a>
          </div>
        </section>

        <section className="motion-card rounded-lg bg-pitch p-4 text-white shadow-lift sm:p-6">
          <p className="text-sm font-black uppercase tracking-wide text-crease">Hosted Sports</p>
          <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{tournaments.length} tournaments on the hub</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {sportsList().map((sport) => (
              <span key={sport} className="rounded-md border border-white/12 bg-white/8 px-4 py-3 text-sm font-black text-white/88">
                {sport}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-3">
            <Link href="/tournaments" className="shine-button tap-target flex items-center justify-center rounded-md bg-crease px-4 py-3 text-center text-sm font-black text-pitch">
              Browse Tournaments
            </Link>
            <Link href="/register" className="shine-button tap-target flex items-center justify-center rounded-md border border-white/18 px-4 py-3 text-center text-sm font-black text-white">
              Register Now
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
