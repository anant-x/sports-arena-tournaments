import MyTournamentSearch from "../../components/client/MyTournamentSearch";
import SectionHeader from "../../components/SectionHeader";

export const metadata = {
  title: "My Tournament"
};

export default function MyTournamentPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Player Lookup"
          title="My Tournament"
          description="Enter a player or captain name to see squad matches, scorecard appearances, and registered tournament entries across the platform."
        />
        <div className="mt-8">
          <MyTournamentSearch />
        </div>
      </div>
    </main>
  );
}
