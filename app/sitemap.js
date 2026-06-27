import { data, tournaments } from "../lib/tournament";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cricket-tournament-snowy.vercel.app";

export default function sitemap() {
  const routes = [
    "",
    "/tournaments",
    "/register",
    "/payment",
    "/live",
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

  return [...routes, ...teamRoutes, ...tournamentRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
}
