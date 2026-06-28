import MatchCard from "../../components/MatchCard";
import SectionHeader from "../../components/SectionHeader";
import { listScoreboard } from "../../lib/platformRepository";

export const metadata = {
  title: "Fixtures"
};

export const dynamic = "force-dynamic";

export default async function FixturesPage() {
  const scoreboard = await listScoreboard();

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Schedule"
          title="All tournament fixtures"
          description="Match timings, courts, turfs, venues, and brackets across every sport hosted on the platform."
        />
        <div className="mt-8 grid gap-10">
          {scoreboard.map((tournament) => (
            <section key={tournament.tournamentSlug}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-turf">{tournament.sport} · {tournament.format}</p>
                  <h2 className="mt-1 text-2xl font-black text-pitch">{tournament.tournamentName}</h2>
                </div>
                <p className="text-sm font-bold text-graphite/60">{tournament.venue}</p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(tournament.matches || []).map((match) => (
                  <MatchCard key={`${tournament.tournamentSlug}-${match.id}`} match={match} tournament={{ ...tournament, slug: tournament.tournamentSlug, name: tournament.tournamentName }} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
