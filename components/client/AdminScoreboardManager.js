"use client";

import { useEffect, useMemo, useState } from "react";

function blankMatch() {
  return {
    tournamentSlug: "",
    matchId: "",
    status: "upcoming",
    result: "",
    team1Score: "",
    team2Score: "",
    playerOfMatch: "",
    highlights: ""
  };
}

function blankStanding() {
  return {
    tournamentSlug: "",
    team: "",
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    nrr: "0.000"
  };
}

export default function AdminScoreboardManager({ password }) {
  const [scoreboard, setScoreboard] = useState([]);
  const [matchForm, setMatchForm] = useState(blankMatch());
  const [standingForm, setStandingForm] = useState(blankStanding());
  const [message, setMessage] = useState("");
  const selectedTournament = useMemo(
    () => scoreboard.find((item) => item.tournamentSlug === matchForm.tournamentSlug) || scoreboard[0],
    [scoreboard, matchForm.tournamentSlug]
  );

  useEffect(() => {
    if (password) {
      loadScoreboard();
    }
  }, [password]);

  async function loadScoreboard() {
    const response = await fetch("/api/admin/scoreboard", {
      headers: { "x-admin-password": password }
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not load scoreboard.");
      return;
    }

    setScoreboard(data.scoreboard || []);
    const first = data.scoreboard?.[0];
    const firstMatch = first?.matches?.[0];
    const firstStanding = first?.standings?.[0];
    if (first && firstMatch) {
      setMatchForm({
        tournamentSlug: first.tournamentSlug,
        matchId: firstMatch.id,
        status: firstMatch.status || "upcoming",
        result: firstMatch.result || "",
        team1Score: firstMatch.scorecard?.team1Score || "",
        team2Score: firstMatch.scorecard?.team2Score || "",
        playerOfMatch: firstMatch.scorecard?.playerOfMatch || "",
        highlights: (firstMatch.scorecard?.highlights || []).join("\n")
      });
    }
    if (first && firstStanding) {
      setStandingForm({
        tournamentSlug: first.tournamentSlug,
        team: firstStanding.team,
        played: firstStanding.played,
        won: firstStanding.won,
        lost: firstStanding.lost,
        points: firstStanding.points,
        nrr: firstStanding.nrr
      });
    }
  }

  function updateMatchField(event) {
    setMatchForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateStandingField(event) {
    setStandingForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function pickMatch(matchId) {
    const match = selectedTournament?.matches?.find((item) => item.id === matchId);
    if (!match) return;

    setMatchForm({
      tournamentSlug: selectedTournament.tournamentSlug,
      matchId: match.id,
      status: match.status || "upcoming",
      result: match.result || "",
      team1Score: match.scorecard?.team1Score || "",
      team2Score: match.scorecard?.team2Score || "",
      playerOfMatch: match.scorecard?.playerOfMatch || "",
      highlights: (match.scorecard?.highlights || []).join("\n")
    });
  }

  function pickStanding(team) {
    const standing = selectedTournament?.standings?.find((item) => item.team === team);
    if (!standing) return;

    setStandingForm({
      tournamentSlug: selectedTournament.tournamentSlug,
      team: standing.team,
      played: standing.played,
      won: standing.won,
      lost: standing.lost,
      points: standing.points,
      nrr: standing.nrr
    });
  }

  async function saveMatch(event) {
    event.preventDefault();
    setMessage("Saving match scorecard...");
    const match = selectedTournament?.matches?.find((item) => item.id === matchForm.matchId);
    const response = await fetch("/api/admin/scoreboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify({
        ...match,
        ...matchForm,
        tournamentSlug: matchForm.tournamentSlug
      })
    });
    const data = await response.json();
    setMessage(response.ok ? "Match scorecard updated." : data.error || "Could not update match.");
    if (response.ok) loadScoreboard();
  }

  async function saveStanding(event) {
    event.preventDefault();
    setMessage("Saving points table...");
    const response = await fetch("/api/admin/scoreboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify({
        ...standingForm,
        type: "standing"
      })
    });
    const data = await response.json();
    setMessage(response.ok ? "Points table updated." : data.error || "Could not update standing.");
    if (response.ok) loadScoreboard();
  }

  if (!scoreboard.length) {
    return <div className="rounded-lg bg-floodlight p-5 text-sm font-black text-pitch">No scoreboard data yet. Connect the database to enable live updates.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveMatch} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase text-turf">Match Scorecard</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Tournament
            <select name="tournamentSlug" value={matchForm.tournamentSlug} onChange={updateMatchField} className="rounded-md border border-graphite/15 px-4 py-3">
              {scoreboard.map((item) => (
                <option key={item.tournamentSlug} value={item.tournamentSlug}>{item.tournamentName}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Match
            <select name="matchId" value={matchForm.matchId} onChange={(event) => pickMatch(event.target.value)} className="rounded-md border border-graphite/15 px-4 py-3">
              {(selectedTournament?.matches || []).map((match) => (
                <option key={match.id} value={match.id}>{match.team1} vs {match.team2} · {match.time}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Status
            <select name="status" value={matchForm.status} onChange={updateMatchField} className="rounded-md border border-graphite/15 px-4 py-3">
              <option>upcoming</option>
              <option>live</option>
              <option>completed</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Result Text
            <input name="result" value={matchForm.result} onChange={updateMatchField} className="rounded-md border border-graphite/15 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Team 1 Score
            <input name="team1Score" value={matchForm.team1Score} onChange={updateMatchField} placeholder="96/4 (10 ov)" className="rounded-md border border-graphite/15 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Team 2 Score
            <input name="team2Score" value={matchForm.team2Score} onChange={updateMatchField} placeholder="78/6 (10 ov)" className="rounded-md border border-graphite/15 px-4 py-3" />
          </label>
        </div>
        <label className="mt-4 grid gap-2 text-sm font-bold text-pitch">
          Player of the Match
          <input name="playerOfMatch" value={matchForm.playerOfMatch} onChange={updateMatchField} className="rounded-md border border-graphite/15 px-4 py-3" />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-bold text-pitch">
          Highlights
          <textarea name="highlights" value={matchForm.highlights} onChange={updateMatchField} rows={4} placeholder="One highlight per line" className="rounded-md border border-graphite/15 px-4 py-3" />
        </label>
        <button className="shine-button mt-5 rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">Save Match</button>
      </form>

      <form onSubmit={saveStanding} className="motion-card rounded-lg border border-graphite/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase text-turf">Points Table</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-pitch">
            Team
            <select name="team" value={standingForm.team} onChange={(event) => pickStanding(event.target.value)} className="rounded-md border border-graphite/15 px-4 py-3">
              {(selectedTournament?.standings || []).map((standing) => (
                <option key={standing.team} value={standing.team}>{standing.team}</option>
              ))}
            </select>
          </label>
          {["played", "won", "lost", "points", "nrr"].map((field) => (
            <label key={field} className="grid gap-2 text-sm font-bold capitalize text-pitch">
              {field}
              <input name={field} value={standingForm[field]} onChange={updateStandingField} className="rounded-md border border-graphite/15 px-4 py-3" />
            </label>
          ))}
        </div>
        <button className="shine-button mt-5 rounded-md bg-pitch px-5 py-3 text-sm font-black text-white">Save Standing</button>
      </form>

      {message ? <p className="rounded-md bg-floodlight px-4 py-3 text-sm font-black text-pitch lg:col-span-2">{message}</p> : null}
    </div>
  );
}
