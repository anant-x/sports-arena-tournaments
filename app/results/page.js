import Scorecard from "../../components/Scorecard";
import SectionHeader from "../../components/SectionHeader";
import { listScoreboard } from "../../lib/platformRepository";

export const metadata = {
  title: "Match Results"
};

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const scoreboard = await listScoreboard();
  const results = scoreboard.flatMap((tournament) =>
    (tournament.matches || [])
      .filter((match) => match.status === "completed")
      .map((match) => ({ match, tournament: { ...tournament, slug: tournament.tournamentSlug, name: tournament.tournamentName } }))
  );

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Results"
          title="Completed match scorecards"
          description="Score summaries, player of the match, key moments, and verified results across all hosted tournaments."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {results.map(({ match, tournament }) => (
            <Scorecard key={`${tournament.slug}-${match.id}`} match={match} tournament={tournament} />
          ))}
        </div>
      </div>
    </main>
  );
}
