import Link from "next/link";
import SectionHeader from "../../components/SectionHeader";
import { leaderboardData } from "../../lib/socialFeatures";

export const metadata = {
  title: "Leaderboard Wall"
};

function StatPill({ label, value }) {
  return (
    <div className="rounded-md bg-floodlight px-4 py-3">
      <p className="text-xs font-black uppercase text-graphite/45">{label}</p>
      <p className="mt-1 text-xl font-black text-pitch">{value}</p>
    </div>
  );
}

function ScorerCard({ player, rank }) {
  return (
    <article className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-turf">Rank #{rank}</p>
          <h3 className="mt-1 text-xl font-black text-pitch">{player.player}</h3>
          <p className="mt-1 text-sm font-semibold text-graphite/62">{player.teamName || "All teams"}</p>
        </div>
        <span className="rounded-md bg-crease px-3 py-1.5 text-sm font-black text-pitch">{player.sport}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatPill label="Runs" value={player.runs} />
        <StatPill label="High Score" value={player.highScore} />
        <StatPill label="Strike Rate" value={player.strikeRate} />
        <StatPill label="Sixes" value={player.sixes} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase text-graphite/48">{player.matches} match records · {player.tournaments.join(", ")}</p>
    </article>
  );
}

function BowlerCard({ player, rank }) {
  return (
    <article className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-turf">Rank #{rank}</p>
          <h3 className="mt-1 text-xl font-black text-pitch">{player.player}</h3>
          <p className="mt-1 text-sm font-semibold text-graphite/62">{player.teamName || "All teams"}</p>
        </div>
        <span className="rounded-md bg-scoreboard px-3 py-1.5 text-sm font-black text-white">{player.bestFigures}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatPill label="Wickets" value={player.wickets} />
        <StatPill label="Best" value={player.bestFigures} />
        <StatPill label="Runs Given" value={player.runsConceded} />
        <StatPill label="Matches" value={player.matches} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase text-graphite/48">{player.sport} · {player.tournaments.join(", ")}</p>
    </article>
  );
}

export default function LeaderboardPage() {
  const { topScorers, topWicketTakers } = leaderboardData();

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="All-Time Wall"
            title="Top scorers and wicket takers"
            description="Public leaderboard across every hosted tournament, calculated from verified scorecards and match highlights."
          />
          <Link href="/results" className="shine-button tap-target inline-flex items-center justify-center rounded-md bg-pitch px-4 py-2 text-sm font-black text-white">
            View Results
          </Link>
        </div>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-turf">Batting</p>
              <h2 className="mt-1 text-2xl font-black text-pitch">Top run scorers</h2>
            </div>
            <p className="text-sm font-bold text-graphite/60">{topScorers.length} players</p>
          </div>
          <div className="stagger-list mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topScorers.slice(0, 9).map((player, index) => (
              <ScorerCard key={`${player.player}-${player.team}`} player={player} rank={index + 1} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-turf">Bowling</p>
              <h2 className="mt-1 text-2xl font-black text-pitch">Top wicket takers</h2>
            </div>
            <p className="text-sm font-bold text-graphite/60">{topWicketTakers.length} players</p>
          </div>
          <div className="stagger-list mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topWicketTakers.slice(0, 9).map((player, index) => (
              <BowlerCard key={`${player.player}-${player.team}`} player={player} rank={index + 1} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
