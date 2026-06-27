import LiveScoreboard from "../../components/client/LiveScoreboard";
import SectionHeader from "../../components/SectionHeader";

export const metadata = {
  title: "Live Scores"
};

export default function LivePage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Live"
          title="Live scores and standings"
          description="Match status, scorecards, results, and points table updates from the tournament admin console."
        />
        <div className="mt-8">
          <LiveScoreboard />
        </div>
      </div>
    </main>
  );
}
