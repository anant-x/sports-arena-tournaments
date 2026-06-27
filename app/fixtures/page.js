import MatchCard from "../../components/MatchCard";
import SectionHeader from "../../components/SectionHeader";
import { tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Fixtures"
};

export default function FixturesPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Schedule"
          title="All tournament fixtures"
          description="Match timings, courts, turfs, venues, and brackets across every sport hosted on the platform."
        />
        <div className="mt-8 grid gap-10">
          {tournaments.map((tournament) => (
            <section key={tournament.slug}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-turf">{tournament.sport} · {tournament.format}</p>
                  <h2 className="mt-1 text-2xl font-black text-pitch">{tournament.name}</h2>
                </div>
                <p className="text-sm font-bold text-graphite/60">{tournament.venue}</p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(tournament.matches || []).map((match) => (
                  <MatchCard key={`${tournament.slug}-${match.id}`} match={match} tournament={tournament} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
