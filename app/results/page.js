import Scorecard from "../../components/Scorecard";
import SectionHeader from "../../components/SectionHeader";
import { tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Match Results"
};

export default function ResultsPage() {
  const results = tournaments.flatMap((tournament) =>
    (tournament.matches || [])
      .filter((match) => match.status === "completed")
      .map((match) => ({ match, tournament }))
  );

  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
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
