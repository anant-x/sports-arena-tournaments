import PointsTable from "../../components/PointsTable";
import SectionHeader from "../../components/SectionHeader";
import { listScoreboard } from "../../lib/platformRepository";

export const metadata = {
  title: "Points Table"
};

export const dynamic = "force-dynamic";

export default async function PointsTablePage() {
  const scoreboard = await listScoreboard();
  const tournamentsWithStandings = scoreboard.filter((tournament) => tournament.standings?.length);

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Standings"
          title="Tournament points tables"
          description="Wins, losses, points, net run rate, and league standings where a tournament uses a table format."
        />
        <div className="mt-8 grid gap-8">
          {tournamentsWithStandings.map((tournament) => (
            <section key={tournament.tournamentSlug}>
              <p className="text-sm font-black uppercase text-turf">{tournament.sport} · {tournament.format}</p>
              <h2 className="mt-1 text-2xl font-black text-pitch">{tournament.tournamentName}</h2>
              <div className="mt-4">
                <PointsTable tournament={{ ...tournament, slug: tournament.tournamentSlug, name: tournament.tournamentName }} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
