import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "../../../components/MatchCard";
import SectionHeader from "../../../components/SectionHeader";
import TeamBadge from "../../../components/TeamBadge";
import { data, getTeamBySlug, matchesForTeam } from "../../../lib/tournament";

export function generateStaticParams() {
  return data.teams.map((team) => ({
    shortName: team.shortName.toLowerCase()
  }));
}

export function generateMetadata({ params }) {
  const team = getTeamBySlug(params.shortName);

  return {
    title: team ? team.name : "Team"
  };
}

export default function TeamDetailPage({ params }) {
  const team = getTeamBySlug(params.shortName);

  if (!team) {
    notFound();
  }

  const teamMatches = matchesForTeam(team.shortName);

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/teams" className="text-sm font-black text-turf">Back to Teams</Link>
        <section className="mt-6 grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-lg border border-graphite/10 bg-white p-6 shadow-sm">
            <TeamBadge team={team} size="lg" />
            <h1 className="mt-5 text-4xl font-black text-pitch">{team.name}</h1>
            <p className="mt-2 text-sm font-bold uppercase text-graphite/48">{team.shortName}</p>
            <p className="mt-5 rounded-md bg-floodlight px-4 py-3 text-sm font-semibold text-graphite/72">Captain: {team.captain}</p>
          </div>
          <div>
            <SectionHeader eyebrow="Squad" title="Player list" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {team.players.map((player, index) => (
                <div key={player} className="rounded-md border border-graphite/10 bg-white px-4 py-3 shadow-sm">
                  <span className="mr-2 text-xs font-black text-turf">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-bold text-pitch">{player}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionHeader eyebrow="Fixtures" title={`${team.name} matches`} />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teamMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
