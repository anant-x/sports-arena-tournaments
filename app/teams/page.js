import Link from "next/link";
import SectionHeader from "../../components/SectionHeader";
import TeamBadge from "../../components/TeamBadge";
import { data } from "../../lib/tournament";

export const metadata = {
  title: "Teams"
};

export default function TeamsPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Squads"
          title="Participating teams"
          description="Browse captains, player lists, and team pages for every squad in the tournament."
        />
        <div className="stagger-list mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {data.teams.map((team) => (
            <Link key={team.shortName} href={`/teams/${team.shortName.toLowerCase()}`} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <TeamBadge team={team} size="lg" />
                <div>
                  <h2 className="text-lg font-black text-pitch">{team.name}</h2>
                  <p className="text-sm font-bold uppercase text-graphite/48">{team.shortName}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-graphite/65">Captain: {team.captain}</p>
              <ul className="mt-4 grid gap-2 text-sm text-graphite/72">
                {team.players.slice(0, 4).map((player) => (
                  <li key={player} className="rounded-md bg-floodlight px-3 py-2">{player}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-black text-turf">View full squad</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
