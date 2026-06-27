import { ImageResponse } from "next/og";
import { getMatchUpdate } from "../../../lib/platformRepository";
import { displayTeamName, findMatchForShare, matchShareText, platformShareFooter } from "../../../lib/socialFeatures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function latestShareMatch(tournamentSlug, matchId) {
  const fallback = findMatchForShare(tournamentSlug, matchId);

  if (!fallback) {
    return null;
  }

  try {
    const latestMatch = await getMatchUpdate(tournamentSlug, matchId);
    if (latestMatch) {
      return {
        tournament: fallback.tournament,
        match: {
          ...fallback.match,
          ...latestMatch,
          scorecard: {
            ...(fallback.match.scorecard || {}),
            ...(latestMatch.scorecard || {})
          }
        }
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tournamentSlug = searchParams.get("tournament") || "";
  const matchId = searchParams.get("match") || "";
  const item = await latestShareMatch(tournamentSlug, matchId);

  if (!item) {
    return new Response("Match not found", { status: 404 });
  }

  const { tournament, match } = item;
  const scorecard = match.scorecard || {};
  const team1 = displayTeamName(match.team1, tournament);
  const team2 = displayTeamName(match.team2, tournament);
  const status = match.status === "completed" ? "Final Result" : match.status || "Match Update";
  const summary = matchShareText(match, tournament);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #07130d 0%, #0d2117 52%, #a4d65e 160%)",
          color: "white",
          padding: 64,
          fontFamily: "Inter, Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#a4d65e", textTransform: "uppercase", letterSpacing: 2 }}>
              {status}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900 }}>{tournament.name}</div>
          </div>
          <div
            style={{
              border: "2px solid rgba(255,255,255,0.26)",
              borderRadius: 18,
              padding: "16px 22px",
              fontSize: 28,
              fontWeight: 900
            }}
          >
            {tournament.sport}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 34 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#d9e4dc" }}>{team1}</div>
              <div style={{ fontSize: 68, fontWeight: 1000 }}>{scorecard.team1Score || "Score pending"}</div>
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#a4d65e" }}>VS</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14, textAlign: "right" }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#d9e4dc" }}>{team2}</div>
              <div style={{ fontSize: 68, fontWeight: 1000 }}>{scorecard.team2Score || "Score pending"}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderLeft: "8px solid #a4d65e",
              padding: "8px 0 8px 24px"
            }}
          >
            <div style={{ fontSize: 46, fontWeight: 1000, color: "#a4d65e" }}>{match.result || "Result pending"}</div>
            <div style={{ fontSize: 27, fontWeight: 800, color: "#d9e4dc" }}>
              {scorecard.playerOfMatch ? `Player of the Match: ${scorecard.playerOfMatch}` : summary}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 26, fontWeight: 800, color: "#d9e4dc" }}>
            <div>{`${match.date} | ${match.time}`}</div>
            <div>{match.venue}</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 1000, color: "#a4d65e", textAlign: "right" }}>
            {platformShareFooter()}
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080
    }
  );
}
