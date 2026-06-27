import { getTeam, teamName } from "../lib/tournament";
import TeamBadge from "./TeamBadge";

function resolveTeam(shortName, tournament) {
  return tournament?.teams?.find((team) => team.shortName === shortName || team.name === shortName) || getTeam(shortName);
}

function displayName(shortName, tournament) {
  const team = resolveTeam(shortName, tournament);
  return team?.name || (tournament ? shortName : teamName(shortName));
}

function TeamLine({ shortName, tournament }) {
  const team = resolveTeam(shortName, tournament);

  return (
    <div className="flex min-w-0 items-center gap-3">
      {team ? <TeamBadge team={team} size="sm" /> : <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-200 text-xs font-black">TBD</span>}
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-pitch">{displayName(shortName, tournament)}</p>
        <p className="text-xs font-bold uppercase text-graphite/48">{shortName}</p>
      </div>
    </div>
  );
}

export default function MatchCard({ match, tournament }) {
  const isCompleted = match.status === "completed";

  return (
    <article className="motion-card surface rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-3">
        <div>
          <p className="text-xs font-black uppercase text-turf">{match.date}</p>
          <p className="text-sm font-semibold text-graphite/65">{match.time} · {match.venue}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-black uppercase ${isCompleted ? "bg-scoreboard text-white" : "bg-crease text-pitch pulse-live"}`}>
          {isCompleted ? "Result" : "Upcoming"}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        <TeamLine shortName={match.team1} tournament={tournament} />
        <div className="field-line h-px" />
        <TeamLine shortName={match.team2} tournament={tournament} />
      </div>
      {match.result ? <p className="mt-4 rounded-md bg-floodlight px-3 py-2 text-sm font-bold text-scoreboard">{match.result}</p> : null}
    </article>
  );
}
