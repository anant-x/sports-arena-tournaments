import SectionHeader from "../../components/SectionHeader";
import TournamentCard from "../../components/TournamentCard";
import RegistrationForm from "../../components/client/RegistrationForm";
import { openTournaments } from "../../lib/tournament";

export const metadata = {
  title: "Register"
};

export default function RegisterPage() {
  const tournaments = openTournaments();
  const defaultTournament = tournaments[0];

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Register"
          title="Register your team or player entry"
          description="Fill the form, save the entry to the tournament database, then continue to Razorpay or UPI advance payment."
        />
        {defaultTournament ? (
          <div className="mt-8">
            <RegistrationForm tournament={defaultTournament} />
          </div>
        ) : null}
        <div className="mt-12">
          <SectionHeader eyebrow="Other Open Events" title="Switch tournament" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.slug} tournament={tournament} compact />
          ))}
        </div>
      </div>
    </main>
  );
}
