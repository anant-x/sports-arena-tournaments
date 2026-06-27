import { data, tournaments } from "../lib/tournament";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cricket-tournament-snowy.vercel.app";

export default function sitemap() {
  const routes = [
    "",
    "/tournaments",
    "/register",
    "/payment",
    "/live",
    "/my-tournament",
    "/leaderboard",
    "/login",
    "/signup",
    "/forgot-password",
    "/profile",
    "/teams",
    "/fixtures",
    "/points-table",
    "/results",
    "/gallery",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/refund-policy"
  ];
  const teamRoutes = data.teams.map((team) => `/teams/${team.shortName.toLowerCase()}`);
  const tournamentRoutes = tournaments.flatMap((tournament) => [`/tournaments/${tournament.slug}`, `/register/${tournament.slug}`]);
  const shareRoutes = tournaments.flatMap((tournament) =>
    (tournament.matches || [])
      .filter((match) => match.status === "completed")
      .map((match) => `/share/match/${tournament.slug}/${match.id}`)
  );

  return [...routes, ...teamRoutes, ...tournamentRoutes, ...shareRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
}
