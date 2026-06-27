import SectionHeader from "../../components/SectionHeader";
import TournamentCard from "../../components/TournamentCard";
import { sportsList, tournaments } from "../../lib/tournament";

export const metadata = {
  title: "Tournaments"
};

export default function TournamentsPage() {
  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Catalog"
          title="All hosted tournaments"
          description="Cricket, badminton, tennis, football, and turf tournaments with online registration and advance payment."
        />
        <div className="stagger-list mt-6 flex flex-wrap gap-2">
          {sportsList().map((sport) => (
            <span key={sport} className="motion-card rounded-md border border-graphite/10 bg-white px-3 py-2 text-sm font-black text-pitch shadow-sm">
              {sport}
            </span>
          ))}
        </div>
        <div className="stagger-list mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.slug} tournament={tournament} />
          ))}
        </div>
      </div>
    </main>
  );
}
