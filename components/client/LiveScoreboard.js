"use client";

import { useEffect, useState } from "react";

function resolveTeam(label, event) {
  return event?.teams?.find((team) => team.shortName === label || team.name === label);
}

function displayName(label, event) {
  return resolveTeam(label, event)?.name || label;
}

function ScoreLine({ match, event }) {
  const scorecard = match.scorecard || {};

  return (
    <article className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-turf">{match.date} · {match.time}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-pitch sm:text-xl">{displayName(match.team1, event)} vs {displayName(match.team2, event)}</h3>
          <p className="mt-1 text-sm font-semibold text-graphite/62">{match.venue}</p>
        </div>
        <span className={`shrink-0 rounded-md px-3 py-1 text-xs font-black uppercase ${match.status === "live" ? "pulse-live bg-red-600 text-white" : match.status === "completed" ? "bg-scoreboard text-white" : "bg-crease text-pitch"}`}>
          {match.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="score-pop rounded-md bg-floodlight p-4">
          <p className="text-sm font-bold text-graphite/60">{displayName(match.team1, event)}</p>
          <p className="mt-1 text-2xl font-black text-pitch">{scorecard.team1Score || "Pending"}</p>
        </div>
        <div className="score-pop rounded-md bg-floodlight p-4">
          <p className="text-sm font-bold text-graphite/60">{displayName(match.team2, event)}</p>
          <p className="mt-1 text-2xl font-black text-pitch">{scorecard.team2Score || "Pending"}</p>
        </div>
      </div>
      {match.result ? <p className="mt-4 rounded-md bg-floodlight px-4 py-3 text-sm font-black text-scoreboard">{match.result}</p> : null}
      {scorecard.playerOfMatch ? <p className="mt-3 text-sm font-black text-pitch">Player of the Match: {scorecard.playerOfMatch}</p> : null}
    </article>
  );
}

export default function LiveScoreboard({ initialScoreboard = [] }) {
  const [scoreboard, setScoreboard] = useState(initialScoreboard);
  const [message, setMessage] = useState(initialScoreboard.length ? "" : "Loading live scoreboard...");
  const [refreshMessage, setRefreshMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/scoreboard", { cache: "no-store" });
        const data = await response.json();
        if (!mounted) {
          return;
        }
        if (!response.ok) {
          if (!scoreboard.length) {
            setMessage(data.error || "Could not load scoreboard.");
          }
          setRefreshMessage("Showing saved schedule while live updates reconnect.");
          return;
        }
        const nextScoreboard = data.scoreboard?.length ? data.scoreboard : initialScoreboard;
        setScoreboard(nextScoreboard);
        setMessage(nextScoreboard.length ? "" : "No live scoreboard data is available yet.");
        setRefreshMessage("");
      } catch {
        if (!mounted) {
          return;
        }
        if (!scoreboard.length) {
          setMessage("Could not load scoreboard.");
        }
        setRefreshMessage("Showing saved schedule while live updates reconnect.");
      }
    }

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [initialScoreboard, scoreboard.length]);

  if (message) {
    return <div className="rounded-lg bg-white p-6 font-black text-pitch shadow-sm">{message}</div>;
  }

  return (
    <div className="grid gap-10">
      {refreshMessage ? <p className="rounded-lg bg-crease/20 px-4 py-3 text-sm font-black text-pitch">{refreshMessage}</p> : null}
      {scoreboard.map((event) => (
        <section key={event.tournamentSlug}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-turf">{event.sport}</p>
              <h2 className="mt-1 text-2xl font-black text-pitch">{event.tournamentName}</h2>
            </div>
            <p className="text-sm font-bold text-graphite/60">{event.matches.length} matches</p>
          </div>
          <div className="stagger-list mt-4 grid gap-4 lg:grid-cols-2">
            {event.matches.map((match) => (
              <ScoreLine key={`${event.tournamentSlug}-${match.id}`} match={match} event={event} />
            ))}
          </div>
          {event.standings.length ? (
            <div className="motion-card mt-5 overflow-hidden rounded-lg border border-graphite/10 bg-white shadow-sm">
              <div className="table-scroll mobile-scroll">
              <table className="w-full min-w-[540px] text-left text-sm sm:min-w-[620px]">
                <thead className="bg-pitch text-white">
                  <tr>
                    {["Team", "P", "W", "L", "Pts", "NRR"].map((item) => (
                      <th key={item} className="px-3 py-3 sm:px-4">{item}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {event.standings.map((row) => (
                    <tr key={row.team} className="border-t border-graphite/10 odd:bg-floodlight/55">
                      <td className="px-3 py-3 font-black text-pitch sm:px-4">{row.team}</td>
                      <td className="px-3 py-3 sm:px-4">{row.played}</td>
                      <td className="px-3 py-3 sm:px-4">{row.won}</td>
                      <td className="px-3 py-3 sm:px-4">{row.lost}</td>
                      <td className="px-3 py-3 font-black text-turf sm:px-4">{row.points}</td>
                      <td className="px-3 py-3 sm:px-4">{row.nrr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
