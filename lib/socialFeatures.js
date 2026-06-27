import { platform, tournaments } from "./tournament";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cricket-tournament-snowy.vercel.app";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesName(value, query) {
  const needle = normalize(query);
  return needle.length >= 2 && normalize(value).includes(needle);
}

export function absoluteUrl(path) {
  return new URL(path, baseUrl).toString();
}

export function displayTeamName(label, tournament) {
  return tournament?.teams?.find((team) => team.shortName === label || team.name === label)?.name || label;
}

export function findMatchForShare(tournamentSlug, matchId) {
  const tournament = tournaments.find((item) => item.slug === tournamentSlug);
  const match = tournament?.matches?.find((item) => item.id === matchId);

  if (!tournament || !match) {
    return null;
  }

  return { tournament, match };
}

export function shareMatchPath(tournamentSlug, matchId) {
  return `/share/match/${encodeURIComponent(tournamentSlug)}/${encodeURIComponent(matchId)}`;
}

export function shareMatchUrl(tournamentSlug, matchId) {
  return absoluteUrl(shareMatchPath(tournamentSlug, matchId));
}

export function shareCardImagePath(tournamentSlug, matchId) {
  return `/api/share-card?tournament=${encodeURIComponent(tournamentSlug)}&match=${encodeURIComponent(matchId)}`;
}

export function shareCardImageUrl(tournamentSlug, matchId) {
  return absoluteUrl(shareCardImagePath(tournamentSlug, matchId));
}

export function matchShareText(match, tournament) {
  const team1 = displayTeamName(match.team1, tournament);
  const team2 = displayTeamName(match.team2, tournament);
  const scorecard = match.scorecard || {};
  const scores = [scorecard.team1Score, scorecard.team2Score].filter(Boolean).join(" | ");

  return [
    `${tournament.name}: ${team1} vs ${team2}`,
    match.result,
    scores,
    `${match.date} at ${match.venue}`
  ]
    .filter(Boolean)
    .join("\n");
}

function statTeamName(team, tournament) {
  return displayTeamName(team, tournament);
}

function parseHighlightStats(highlight) {
  const batting = String(highlight).match(/^(.+?)\s+(\d+)\s+(?:not out\s+)?off\s+(\d+)/i);
  if (batting) {
    return {
      type: "batting",
      player: batting[1].trim(),
      runs: Number(batting[2]),
      balls: Number(batting[3])
    };
  }

  const bowling = String(highlight).match(/^(.+?)\s+(\d+)\/(\d+)/i);
  if (bowling) {
    return {
      type: "bowling",
      player: bowling[1].trim(),
      wickets: Number(bowling[2]),
      runsConceded: Number(bowling[3])
    };
  }

  return null;
}

function ensurePlayer(map, player, tournament, team) {
  const key = normalize(`${player}-${team || ""}`);
  if (!map.has(key)) {
    map.set(key, {
      player,
      team,
      teamName: statTeamName(team, tournament),
      sport: tournament.sport,
      tournaments: new Set([tournament.name]),
      matches: new Set(),
      runs: 0,
      balls: 0,
      highScore: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      runsConceded: 0,
      bestWickets: 0,
      bestRunsConceded: 0
    });
  }

  return map.get(key);
}

export function leaderboardData() {
  const players = new Map();

  for (const tournament of tournaments) {
    for (const match of tournament.matches || []) {
      const scorecard = match.scorecard || {};

      for (const row of scorecard.batting || []) {
        const player = ensurePlayer(players, row.player, tournament, row.team);
        player.tournaments.add(tournament.name);
        player.matches.add(`${tournament.slug}-${match.id}`);
        player.runs += Number(row.runs || 0);
        player.balls += Number(row.balls || 0);
        player.fours += Number(row.fours || 0);
        player.sixes += Number(row.sixes || 0);
        player.highScore = Math.max(player.highScore, Number(row.runs || 0));
      }

      for (const row of scorecard.bowling || []) {
        const player = ensurePlayer(players, row.player, tournament, row.team);
        player.tournaments.add(tournament.name);
        player.matches.add(`${tournament.slug}-${match.id}`);
        player.wickets += Number(row.wickets || 0);
        player.runsConceded += Number(row.runsConceded || 0);

        if (Number(row.wickets || 0) > player.bestWickets) {
          player.bestWickets = Number(row.wickets || 0);
          player.bestRunsConceded = Number(row.runsConceded || 0);
        }
      }

      for (const highlight of scorecard.highlights || []) {
        const parsed = parseHighlightStats(highlight);
        if (!parsed) {
          continue;
        }

        const player = ensurePlayer(players, parsed.player, tournament, "");
        player.tournaments.add(tournament.name);
        player.matches.add(`${tournament.slug}-${match.id}`);

        if (parsed.type === "batting" && !scorecard.batting?.some((row) => row.player === parsed.player)) {
          player.runs += parsed.runs;
          player.balls += parsed.balls;
          player.highScore = Math.max(player.highScore, parsed.runs);
        }

        if (parsed.type === "bowling" && !scorecard.bowling?.some((row) => row.player === parsed.player)) {
          player.wickets += parsed.wickets;
          player.runsConceded += parsed.runsConceded;
          if (parsed.wickets > player.bestWickets) {
            player.bestWickets = parsed.wickets;
            player.bestRunsConceded = parsed.runsConceded;
          }
        }
      }
    }
  }

  const rows = [...players.values()].map((player) => ({
    ...player,
    matches: player.matches.size,
    tournaments: [...player.tournaments],
    strikeRate: player.balls ? ((player.runs / player.balls) * 100).toFixed(1) : "0.0",
    bestFigures: player.bestWickets ? `${player.bestWickets}/${player.bestRunsConceded}` : "-"
  }));

  return {
    topScorers: rows
      .filter((player) => player.runs > 0)
      .sort((a, b) => b.runs - a.runs || b.highScore - a.highScore || a.player.localeCompare(b.player)),
    topWicketTakers: rows
      .filter((player) => player.wickets > 0)
      .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded || a.player.localeCompare(b.player))
  };
}

export function staticPlayerInvolvement(query) {
  const results = [];

  if (normalize(query).length < 2) {
    return results;
  }

  for (const tournament of tournaments) {
    const matchedTeams = (tournament.teams || []).filter((team) =>
      (team.players || []).some((player) => includesName(player, query)) || includesName(team.captain, query)
    );
    const matchedTeamCodes = new Set(matchedTeams.flatMap((team) => [team.shortName, team.name]));
    const statMatches = new Set();

    for (const match of tournament.matches || []) {
      const scorecard = match.scorecard || {};
      const statRows = [...(scorecard.batting || []), ...(scorecard.bowling || [])];
      if (statRows.some((row) => includesName(row.player, query)) || includesName(scorecard.playerOfMatch, query)) {
        statMatches.add(match.id);
        statRows.filter((row) => includesName(row.player, query) && row.team).forEach((row) => matchedTeamCodes.add(row.team));
      }
    }

    const matches = (tournament.matches || [])
      .filter((match) => matchedTeamCodes.has(match.team1) || matchedTeamCodes.has(match.team2) || statMatches.has(match.id))
      .map((match) => ({
        id: match.id,
        date: match.date,
        time: match.time,
        venue: match.venue,
        status: match.status,
        result: match.result || "",
        team1: displayTeamName(match.team1, tournament),
        team2: displayTeamName(match.team2, tournament),
        shareUrl: match.status === "completed" ? shareMatchUrl(tournament.slug, match.id) : ""
      }));

    if (matches.length) {
      results.push({
        tournamentSlug: tournament.slug,
        tournamentName: tournament.name,
        sport: tournament.sport,
        role: matchedTeams.length ? matchedTeams.map((team) => `${team.name} player`).join(", ") : "Scorecard mention",
        teams: matchedTeams.map((team) => team.name),
        matches
      });
    }
  }

  return results;
}

export function platformShareFooter() {
  return `${platform.name} | Play. Compete. Win.`;
}
