import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "../../../components/MatchCard";
import SectionHeader from "../../../components/SectionHeader";
import { contactInfo, tournamentEssentials, whatsappUrl } from "../../../lib/siteInfo";
import { formatCurrency, getTournament, isRegistrationOpen, tournaments } from "../../../lib/tournament";

export function generateStaticParams() {
  return tournaments.map((tournament) => ({
    slug: tournament.slug
  }));
}

export function generateMetadata({ params }) {
  const tournament = getTournament(params.slug);

  return {
    title: tournament ? tournament.name : "Tournament"
  };
}

export default function TournamentDetailPage({ params }) {
  const tournament = getTournament(params.slug);

  if (!tournament) {
    notFound();
  }

  const slotsLeft = Math.max(tournament.slots - tournament.registered, 0);
  const essentials = tournamentEssentials(tournament);
  const contact = contactInfo();
  const whatsapp = whatsappUrl(`Hi, I want to register for ${tournament.name}. Please share slot confirmation and payment details.`);
  const canRegister = isRegistrationOpen(tournament);

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-pitch text-white">
        <Image src={tournament.bannerImage} alt={`${tournament.name} banner`} fill priority sizes="100vw" className="hero-media object-cover opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,33,23,0.96),rgba(13,33,23,0.72),rgba(13,33,23,0.32))]" />
        <div className="relative mx-auto grid min-h-[58vh] max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:px-8">
          <div className="hero-copy">
            <Link href="/tournaments" className="text-sm font-black text-crease">Back to tournaments</Link>
            <p className="mt-6 text-sm font-black uppercase tracking-wide text-crease">{tournament.sport} · {tournament.format}</p>
            <h1 className="mt-3 text-5xl font-black leading-tight tracking-normal sm:text-6xl">{tournament.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">{tournament.description}</p>
          </div>
          <div className="float-soft rounded-lg border border-white/12 bg-white/10 p-5 backdrop-blur">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-bold uppercase text-white/55">Date</dt>
                <dd className="mt-1 font-black text-white">{tournament.dates}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-white/55">Slots Left</dt>
                <dd className="mt-1 font-black text-white">{slotsLeft}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-white/55">Fee</dt>
                <dd className="mt-1 font-black text-white">{formatCurrency(tournament.registrationFee, tournament.currency)}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-white/55">Advance</dt>
                <dd className="mt-1 font-black text-white">{formatCurrency(tournament.advanceAmount, tournament.currency)}</dd>
              </div>
            </dl>
            {canRegister ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link href={`/register/${tournament.slug}`} className="shine-button rounded-md bg-crease px-4 py-3 text-center text-sm font-black text-pitch transition hover:bg-white">
                  Register
                </Link>
                <Link href={`/payment?slug=${tournament.slug}`} className="shine-button rounded-md border border-white/22 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-pitch">
                  Pay Advance
                </Link>
              </div>
            ) : (
              <p className="mt-5 rounded-md bg-white/12 px-4 py-3 text-sm font-black uppercase text-crease">
                Registration Closed
              </p>
            )}
            {canRegister && whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="shine-button mt-3 flex rounded-md bg-[#25D366] px-4 py-3 text-center text-sm font-black text-pitch transition hover:bg-white">
                WhatsApp Registration
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionHeader eyebrow="Details" title="Registration information" />
            <div className="stagger-list mt-6 grid gap-4">
              {[
                ["Sport / Format", `${tournament.sport} · ${tournament.format}`],
                ["Date / Time", `${tournament.dates}${tournament.matches?.[0]?.time ? ` · ${tournament.matches[0].time}` : ""}`],
                ["Venue", tournament.venue],
                ["Google Map", "Open location"],
                ["City", tournament.city],
                tournament.participation ? ["Participation", tournament.participation] : null,
                ["Squad Size", essentials.squadSize],
                ["Age Limit", essentials.ageLimit],
                ["Last Date", essentials.lastDate],
                ["Entry Fee", formatCurrency(tournament.registrationFee, tournament.currency)],
                ["Advance", formatCurrency(tournament.advanceAmount, tournament.currency)],
                ["Refund Policy", essentials.refundPolicy],
                tournament.registrationNote ? ["Registration", tournament.registrationNote] : null,
                tournament.social ? ["Instagram", tournament.social] : null
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
                  <p className="text-xs font-black uppercase text-turf">{label}</p>
                  {label === "Google Map" ? (
                    <a href={essentials.venueMapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex font-black text-pitch underline decoration-turf/40 underline-offset-4">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 font-black text-pitch">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Rules" title="Tournament rules" />
            <div className="stagger-list mt-6 grid gap-3 sm:grid-cols-2">
              {tournament.rules.map((rule) => (
                <div key={rule} className="motion-card rounded-md border border-graphite/10 bg-white px-4 py-3 text-sm font-bold text-graphite/75 shadow-sm">
                  {rule}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <SectionHeader eyebrow="Prizes" title="Awards" />
              <div className="stagger-list mt-4 grid gap-3">
                {tournament.prizes.map((prize) => (
                  <div key={prize} className="motion-card rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch">
                    {prize}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-floodlight px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Schedule" title={`${tournament.sport} fixtures and bracket`} />
          <div className="stagger-list mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(tournament.matches ?? []).map((match) => (
              <MatchCard key={match.id} match={match} tournament={tournament} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase text-turf">Organizer Contact</p>
            <h2 className="mt-2 text-3xl font-black text-pitch">{contact.name}</h2>
            <div className="mt-5 grid gap-3 text-sm font-semibold text-graphite/72">
              <a href={`tel:${contact.phone}`} className="rounded-md bg-floodlight px-4 py-3 text-pitch">{contact.phone}</a>
              <a href={`mailto:${contact.email}`} className="rounded-md bg-floodlight px-4 py-3 text-pitch">{contact.email}</a>
              <span className="rounded-md bg-floodlight px-4 py-3 text-pitch">Support: {essentials.supportWindow}</span>
            </div>
          </div>
          <div className="rounded-lg bg-pitch p-6 text-white shadow-lift">
            <p className="text-sm font-black uppercase text-crease">Before You Register</p>
            <div className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-white/78">
              <p>{essentials.reportingRule}</p>
              <p>Payment receipt and registration confirmation are stored in your profile and visible to the organizer from the admin database.</p>
              <p>Final fixture order can change after slot confirmation, weather, or venue instructions.</p>
            </div>
            {canRegister ? (
              <Link href={`/register/${tournament.slug}`} className="shine-button mt-6 inline-flex rounded-md bg-crease px-5 py-3 text-sm font-black text-pitch">
                Complete Registration Form
              </Link>
            ) : (
              <p className="mt-6 inline-flex rounded-md border border-white/18 px-5 py-3 text-sm font-black text-white">
                Registration Closed
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
