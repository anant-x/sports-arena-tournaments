import { teamName } from "../lib/tournament";

function displayName(shortName, tournament) {
  return tournament?.teams?.find((team) => team.shortName === shortName || team.name === shortName)?.name || (tournament ? shortName : teamName(shortName));
}

export default function Scorecard({ match, tournament }) {
  const scorecard = match.scorecard || {};

  return (
    <article className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-graphite/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-turf">{match.date} · {match.time}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-pitch sm:text-xl">{displayName(match.team1, tournament)} vs {displayName(match.team2, tournament)}</h3>
          <p className="mt-1 text-sm text-graphite/62">{match.venue}</p>
        </div>
        <span className="w-fit rounded-md bg-scoreboard px-3 py-1.5 text-sm font-black text-white">{match.result}</span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="score-pop rounded-md bg-floodlight p-4">
          <p className="text-sm font-semibold text-graphite/60">{displayName(match.team1, tournament)}</p>
          <p className="mt-1 text-2xl font-black text-pitch">{scorecard.team1Score || "Score pending"}</p>
        </div>
        <div className="score-pop rounded-md bg-floodlight p-4">
          <p className="text-sm font-semibold text-graphite/60">{displayName(match.team2, tournament)}</p>
          <p className="mt-1 text-2xl font-black text-pitch">{scorecard.team2Score || "Score pending"}</p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-sm font-black uppercase text-turf">Player of the Match</p>
        <p className="mt-1 text-lg font-black text-pitch">{scorecard.playerOfMatch || "Pending"}</p>
      </div>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-graphite/72">
        {(scorecard.highlights || []).map((highlight) => (
          <li key={highlight} className="rounded-md bg-white px-0 font-semibold">· {highlight}</li>
        ))}
      </ul>
    </article>
  );
}
