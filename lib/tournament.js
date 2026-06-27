import tournamentData from "../data/tournament.json";

export const platform = tournamentData.platform;
export const organizer = tournamentData.organizer;
export const tournaments = tournamentData.tournaments;
export const primaryTournament = tournaments.find((tournament) => tournament.slug === "tpl-2026") ?? tournaments[0];

export const data = {
  ...tournamentData,
  tournament: primaryTournament,
  teams: primaryTournament.teams ?? [],
  matches: primaryTournament.matches ?? [],
  standings: primaryTournament.standings ?? [],
  gallery: primaryTournament.gallery ?? []
};

export function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getTournament(slug) {
  return tournaments.find((tournament) => tournament.slug === slug);
}

export function isRegistrationOpen(tournament) {
  return tournament?.status === "Open";
}

export function featuredTournaments() {
  return tournaments.filter((tournament) => tournament.featured);
}

export function openTournaments() {
  return tournaments.filter(isRegistrationOpen);
}

export function sportsList() {
  return [...new Set(tournaments.map((tournament) => tournament.sport))];
}

export function allGalleryImages() {
  return tournaments.flatMap((tournament) =>
    (tournament.gallery ?? []).map((image) => ({
      ...image,
      tournamentName: tournament.name,
      sport: tournament.sport
    }))
  );
}

export function getTeam(shortName) {
  return data.teams.find((team) => team.shortName === shortName);
}

export function getTeamBySlug(shortName) {
  const normalized = shortName.toLowerCase();
  return data.teams.find((team) => team.shortName.toLowerCase() === normalized);
}

export function teamName(shortName) {
  if (shortName === "TBD") {
    return "To be decided";
  }

  return getTeam(shortName)?.name ?? shortName;
}

export function sortedStandings(tournament = primaryTournament) {
  return [...(tournament.standings ?? [])].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return parseFloat(b.nrr) - parseFloat(a.nrr);
  });
}

export function upcomingMatches(limit, tournament = primaryTournament) {
  const matches = (tournament.matches ?? []).filter((match) => match.status !== "completed");
  return typeof limit === "number" ? matches.slice(0, limit) : matches;
}

export function completedMatches(tournament = primaryTournament) {
  return (tournament.matches ?? []).filter((match) => match.status === "completed");
}

export function matchesForTeam(shortName) {
  return data.matches.filter((match) => match.team1 === shortName || match.team2 === shortName);
}
