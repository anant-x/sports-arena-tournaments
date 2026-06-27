import Link from "next/link";
import { notFound } from "next/navigation";
import RegistrationForm from "../../../components/client/RegistrationForm";
import SectionHeader from "../../../components/SectionHeader";
import { getTournament, isRegistrationOpen, tournaments } from "../../../lib/tournament";

export function generateStaticParams() {
  return tournaments.map((tournament) => ({
    slug: tournament.slug
  }));
}

export function generateMetadata({ params }) {
  const tournament = getTournament(params.slug);

  return {
    title: tournament ? `Register for ${tournament.name}` : "Register"
  };
}

export default function TournamentRegistrationPage({ params }) {
  const tournament = getTournament(params.slug);

  if (!tournament) {
    notFound();
  }

  const canRegister = isRegistrationOpen(tournament);

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href={`/tournaments/${tournament.slug}`} className="text-sm font-black text-turf">Back to tournament</Link>
        <div className="mt-6">
          <SectionHeader
            eyebrow="Registration"
            title={canRegister ? `Register for ${tournament.name}` : `${tournament.name} registration is closed`}
            description={
              canRegister
                ? "Your details are saved to your profile on this browser, then you can continue to advance payment."
                : "This tournament is no longer accepting new entries. You can still view tournament details, fixtures, results, and live updates."
            }
          />
        </div>
        <div className="mt-8">
          {canRegister ? (
            <RegistrationForm tournament={tournament} />
          ) : (
            <div className="motion-card rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
              <p className="text-xl font-black text-pitch">Registration Closed</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-graphite/68">
                New team/player entries are closed for this tournament.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/tournaments/${tournament.slug}`} className="shine-button rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">
                  View Tournament
                </Link>
                <Link href="/register" className="shine-button rounded-md border border-graphite/15 px-5 py-3 text-sm font-black text-pitch">
                  Browse Open Events
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
