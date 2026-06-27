"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readUser } from "./localStore";

function MatchRow({ match }) {
  return (
    <div className="rounded-md bg-floodlight px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-pitch">{match.team1} vs {match.team2}</p>
          <p className="mt-1 text-xs font-bold uppercase text-graphite/48">{match.date} · {match.time}</p>
        </div>
        <span className="w-fit rounded-md bg-white px-2.5 py-1 text-xs font-black uppercase text-pitch">{match.status}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-graphite/65">{match.venue}</p>
      {match.result ? <p className="mt-2 text-sm font-black text-scoreboard">{match.result}</p> : null}
      {match.shareUrl ? (
        <Link href={match.shareUrl} className="mt-3 inline-flex text-sm font-black text-turf">
          Result Share Card
        </Link>
      ) : null}
      {match.seeded === false ? <p className="mt-2 text-xs font-bold text-graphite/52">Fixture slots shown until seeding is confirmed.</p> : null}
    </div>
  );
}

function StaticResult({ item }) {
  return (
    <article className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-turf">{item.sport}</p>
          <h3 className="mt-1 text-xl font-black text-pitch">{item.tournamentName}</h3>
          <p className="mt-1 text-sm font-semibold text-graphite/62">{item.role}</p>
        </div>
        <Link href={`/tournaments/${item.tournamentSlug}`} className="tap-target flex items-center justify-center rounded-md border border-graphite/15 px-3 py-2 text-sm font-black text-pitch">
          Details
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {item.matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </article>
  );
}

function RegistrationResult({ item }) {
  return (
    <article className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-turf">{item.sport} Registration</p>
          <h3 className="mt-1 text-xl font-black text-pitch">{item.tournamentName}</h3>
          <p className="mt-1 text-sm font-semibold text-graphite/62">{item.teamName || item.playerName}</p>
        </div>
        <span className="w-fit rounded-md bg-crease/25 px-3 py-2 text-xs font-black uppercase text-pitch">{item.status}</span>
      </div>
      <div className="mt-4 grid gap-3">
        {item.matches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </article>
  );
}

export default function MyTournamentSearch() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => {
    const user = readUser();
    if (user?.name) {
      setName(user.name);
    }
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setResults(null);

    try {
      const response = await fetch(`/api/my-tournament?name=${encodeURIComponent(name)}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not find matches.");
        return;
      }

      setResults(data);
      if (!data.staticMatches.length && !data.registrations.length) {
        setMessage("No tournament matches found for that name yet.");
      }
    } catch {
      setMessage("Could not reach the tournament lookup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="motion-card rounded-lg border border-graphite/10 bg-white p-4 shadow-sm sm:p-5">
        <label className="grid gap-2 text-sm font-bold text-pitch">
          Player or captain name
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="Aarav Mehta"
              className="rounded-md border border-graphite/15 px-4 py-3 font-semibold outline-none focus:border-turf"
            />
            <button disabled={busy} className="shine-button tap-target rounded-md bg-pitch px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Searching..." : "Find My Matches"}
            </button>
          </div>
        </label>
      </form>

      {message ? <p className="rounded-lg bg-floodlight px-4 py-3 text-sm font-black text-pitch">{message}</p> : null}

      {results ? (
        <div className="grid gap-8">
          {results.staticMatches.length ? (
            <section>
              <p className="text-sm font-black uppercase text-turf">Squad and scorecard matches</p>
              <div className="stagger-list mt-4 grid gap-4 lg:grid-cols-2">
                {results.staticMatches.map((item) => (
                  <StaticResult key={item.tournamentSlug} item={item} />
                ))}
              </div>
            </section>
          ) : null}

          {results.registrations.length ? (
            <section>
              <p className="text-sm font-black uppercase text-turf">Registered entries</p>
              <div className="stagger-list mt-4 grid gap-4 lg:grid-cols-2">
                {results.registrations.map((item) => (
                  <RegistrationResult key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
