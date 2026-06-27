import Image from "next/image";
import Link from "next/link";
import PointsTable from "../components/PointsTable";
import SectionHeader from "../components/SectionHeader";
import TournamentCard from "../components/TournamentCard";
import { contactInfo, testimonials, trustStats, whatsappUrl } from "../lib/siteInfo";
import { featuredTournaments, openTournaments, platform, primaryTournament, sportsList, upcomingMatches } from "../lib/tournament";

export default function HomePage() {
  const featured = featuredTournaments();
  const nextMatches = upcomingMatches(3, primaryTournament);
  const sports = sportsList();
  const contact = contactInfo();
  const whatsapp = whatsappUrl(`Hi, I want to register for an upcoming tournament on ${platform.name}.`);

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-pitch text-white">
        <Image
          src={platform.heroImage}
          alt={`${platform.name} tournament collage`}
          fill
          priority
          sizes="100vw"
          className="hero-media object-cover opacity-42"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,33,23,0.97),rgba(13,33,23,0.76),rgba(13,33,23,0.28))]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl gap-8 px-4 py-10 sm:min-h-[70vh] sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div className="hero-copy">
            <p className="text-sm font-black uppercase tracking-wide text-crease">{platform.tagline}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-6xl lg:text-7xl">{platform.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/84 sm:text-lg sm:leading-8">{platform.description}</p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/tournaments" className="shine-button tap-target flex items-center justify-center rounded-md bg-crease px-5 py-3 text-sm font-black text-pitch shadow-lift transition hover:bg-white">
                Browse Tournaments
              </Link>
              <Link href="/signup" className="shine-button tap-target flex items-center justify-center rounded-md border border-white/35 px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-pitch">
                Create Account
              </Link>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="shine-button tap-target flex items-center justify-center rounded-md bg-[#25D366] px-5 py-3 text-sm font-black text-pitch shadow-lift transition hover:bg-white">
                  WhatsApp Register
                </a>
              ) : null}
            </div>
            <div className="stagger-list mt-9 flex flex-wrap gap-2">
              {sports.map((sport) => (
                <span key={sport} className="rounded-md border border-white/18 bg-white/10 px-3 py-2 text-sm font-bold text-white/86">
                  {sport}
                </span>
              ))}
            </div>
          </div>

          <div className="float-soft rounded-lg border border-white/12 bg-white/9 p-4 backdrop-blur sm:p-5">
            <p className="text-sm font-black uppercase text-crease">Open Registrations</p>
            <div className="stagger-list mt-5 grid gap-3">
              {openTournaments().slice(0, 4).map((tournament) => (
                <Link key={tournament.slug} href={`/tournaments/${tournament.slug}`} className="motion-card rounded-md bg-white/10 p-4 transition hover:bg-white/16">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-white">{tournament.name}</p>
                      <p className="mt-1 text-sm text-white/64">{tournament.sport} · {tournament.dates}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-crease px-3 py-1 text-xs font-black text-pitch">{tournament.slots - tournament.registered} left</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="stagger-list mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustStats.map(([value, label]) => (
            <div key={label} className="motion-card rounded-lg border border-graphite/10 p-5 shadow-sm">
              <p className="text-3xl font-black text-pitch">{value}</p>
              <p className="mt-1 text-sm font-bold text-graphite/60">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="Featured"
              title="Tournaments accepting registrations"
              description="Choose a tournament, save your player details, register, and pay the advance amount online."
            />
            <Link href="/tournaments" className="shine-button tap-target inline-flex items-center justify-center rounded-md bg-pitch px-4 py-2 text-sm font-black text-white transition hover:bg-scoreboard sm:w-auto">
              View All
            </Link>
          </div>
          <div className="stagger-list mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tournament) => (
              <TournamentCard key={tournament.slug} tournament={tournament} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-floodlight px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="TPL 2026"
              title="Featured cricket tournament"
              description="TPL remains the headline event inside the hub, with teams, fixtures, results, and points table live on the site."
            />
            <div className="stagger-list mt-6 grid gap-3">
              {nextMatches.map((match) => (
                <div key={match.id} className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase text-turf">{match.date} · {match.time}</p>
                  <p className="mt-1 font-black text-pitch">{match.team1} vs {match.team2}</p>
                  <p className="mt-1 text-sm text-graphite/62">{match.venue}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Standings" title="TPL points table" />
            <div className="mt-6">
              <PointsTable limit={5} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader
              eyebrow="Trust"
              title="Run by a reachable organizer"
              description="Tournament support, registration confirmations, venue help, and payment verification are handled through the organizer desk."
            />
            <div className="stagger-list mt-6 grid gap-3">
              <a href={`tel:${contact.phone}`} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 font-black text-pitch shadow-sm">
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 font-black text-pitch shadow-sm">
                {contact.email}
              </a>
              <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="motion-card rounded-lg border border-graphite/10 bg-white p-5 font-black text-pitch shadow-sm">
                Venue Map
              </a>
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Players" title="What participants say" />
            <div className="stagger-list mt-6 grid gap-4">
              {testimonials.map((item) => (
                <figure key={item.name} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
                  <blockquote className="text-sm font-semibold leading-6 text-graphite/72">"{item.quote}"</blockquote>
                  <figcaption className="mt-4">
                    <p className="font-black text-pitch">{item.name}</p>
                    <p className="text-xs font-bold uppercase text-turf">{item.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
