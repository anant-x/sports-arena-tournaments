import { getTeam, sortedStandings } from "../lib/tournament";
import TeamBadge from "./TeamBadge";

export default function PointsTable({ limit, tournament }) {
  const rows = sortedStandings(tournament).slice(0, limit ?? undefined);

  return (
    <div className="motion-card overflow-hidden rounded-lg border border-graphite/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-pitch text-white">
            <tr>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-center">P</th>
              <th className="px-4 py-3 text-center">W</th>
              <th className="px-4 py-3 text-center">L</th>
              <th className="px-4 py-3 text-center">Pts</th>
              <th className="px-4 py-3 text-center">NRR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const team = tournament?.teams?.find((item) => item.shortName === row.team || item.name === row.team) || getTeam(row.team);
              return (
                <tr key={row.team} className="border-t border-graphite/10 odd:bg-floodlight/55 transition hover:bg-crease/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-black text-graphite/45">{index + 1}</span>
                      {team ? <TeamBadge team={team} size="sm" /> : null}
                      <span className="font-black text-pitch">{team?.name ?? row.team}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{row.played}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.won}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.lost}</td>
                  <td className="px-4 py-3 text-center font-black text-turf">{row.points}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.nrr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
