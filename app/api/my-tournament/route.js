import { NextResponse } from "next/server";
import { findPublicRegistrationsForPlayer } from "../../../lib/platformRepository";
import { displayTeamName, staticPlayerInvolvement } from "../../../lib/socialFeatures";
import { getTournament } from "../../../lib/tournament";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function registrationSchedule(registration) {
  const tournament = getTournament(registration.tournamentSlug);

  if (!tournament) {
    return [];
  }

  const teamName = String(registration.teamName || "").toLowerCase();
  const seededMatches = (tournament.matches || []).filter((match) => {
    const team1 = displayTeamName(match.team1, tournament).toLowerCase();
    const team2 = displayTeamName(match.team2, tournament).toLowerCase();
    return teamName && (team1.includes(teamName) || team2.includes(teamName));
  });

  const matches = seededMatches.length ? seededMatches : (tournament.matches || []).slice(0, 4);

  return matches.map((match) => ({
    id: match.id,
    date: match.date,
    time: match.time,
    venue: match.venue,
    status: match.status,
    result: match.result || "",
    team1: displayTeamName(match.team1, tournament),
    team2: displayTeamName(match.team2, tournament),
    seeded: Boolean(seededMatches.length)
  }));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = String(searchParams.get("name") || "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Enter at least 2 characters." }, { status: 400 });
    }

    const [staticMatches, registrations] = await Promise.all([
      Promise.resolve(staticPlayerInvolvement(name)),
      findPublicRegistrationsForPlayer(name)
    ]);

    return NextResponse.json({
      query: name,
      staticMatches,
      registrations: registrations.map((registration) => ({
        ...registration,
        matches: registrationSchedule(registration)
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not search tournaments." }, { status: 500 });
  }
}
