import LiveScoreboard from "../../components/client/LiveScoreboard";
import SectionHeader from "../../components/SectionHeader";
import { tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Live Scores"
};

export default function LivePage() {
  const initialScoreboard = tournaments.map((tournament) => ({
    tournamentSlug: tournament.slug,
    tournamentName: tournament.name,
    sport: tournament.sport,
    teams: tournament.teams || [],
    matches: tournament.matches || [],
    standings: tournament.standings || []
  }));

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Live"
          title="Live scores and standings"
          description="Match status, scorecards, results, and points table updates from the tournament admin console."
        />
        <div className="mt-8">
          <LiveScoreboard initialScoreboard={initialScoreboard} />
        </div>
      </div>
    </main>
  );
}
