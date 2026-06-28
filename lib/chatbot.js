import { contactInfo, paymentInfo } from "./siteInfo";
import { displayTeamName, staticPlayerInvolvement } from "./socialFeatures";
import { formatCurrency, getTournament, openTournaments, primaryTournament, tournaments } from "./tournament";
import { findPublicRegistrationsForPlayer, getStandingUpdates, listRegistrations } from "./platformRepository";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function sentenceJoin(lines) {
  return lines.filter(Boolean).join("\n");
}

function parseDateTime(match) {
  return new Date(`${match.date || ""} ${match.time || "00:00"}`.replace(/-/g, "/"));
}

function tournamentUrl(tournament) {
  return `/tournaments/${tournament.slug}`;
}

function registerUrl(tournament) {
  return `/register/${tournament.slug}`;
}

function paymentUrl(tournament) {
  return `/payment?slug=${encodeURIComponent(tournament.slug)}`;
}

function matchSummary(match) {
  return `${match.date} · ${match.time} — ${match.team1} vs ${match.team2} at ${match.venue}${match.result ? ` (${match.result})` : ""}`;
}

function findTournamentInText(text) {
  const value = normalize(text);

  return (
    tournaments.find((tournament) => {
      const aliases = [
        tournament.slug,
        tournament.shortName,
        tournament.name,
        tournament.sport,
        tournament.format,
        ...String(tournament.name)
          .split(/\s+/)
          .filter((part) => part.length > 3)
      ];

      return aliases.some((alias) => alias && value.includes(normalize(alias)));
    }) || primaryTournament
  );
}

function extractName(message, profile) {
  if (profile?.name && normalize(profile.name).length >= 2) {
    return profile.name;
  }

  const text = String(message || "");
  const patterns = [
    /(?:my name is|i am|i'm|for player|for captain|for)\s+([a-z][a-z\s.'-]{2,50})/i,
    /next match\s+([a-z][a-z\s.'-]{2,50})/i,
    /matches?\s+for\s+([a-z][a-z\s.'-]{2,50})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\b(?:please|today|tomorrow|next|match|matches)\b/gi, "").trim();
    }
  }

  return "";
}

function registrationMatches(registration) {
  const tournament = getTournament(registration.tournamentSlug);
  if (!tournament) {
    return [];
  }

  const teamName = normalize(registration.teamName);
  const seededMatches = (tournament.matches || []).filter((match) => {
    const team1 = normalize(displayTeamName(match.team1, tournament));
    const team2 = normalize(displayTeamName(match.team2, tournament));
    return teamName && (team1.includes(teamName) || team2.includes(teamName));
  });
  const fallback = (tournament.matches || []).filter((match) => match.status !== "completed").slice(0, 3);

  return (seededMatches.length ? seededMatches : fallback).map((match) => ({
    id: match.id,
    date: match.date,
    time: match.time,
    venue: match.venue,
    status: match.status,
    result: match.result || "",
    team1: displayTeamName(match.team1, tournament),
    team2: displayTeamName(match.team2, tournament),
    tournamentName: tournament.name,
    tournamentSlug: tournament.slug
  }));
}

async function answerNextMatch(message, profile) {
  const name = extractName(message, profile);
  const email = profile?.email ? normalize(profile.email) : "";
  let matches = [];

  if (email) {
    const registrations = await listRegistrations({ email });
    matches.push(...registrations.flatMap(registrationMatches));
  }

  if (name) {
    const staticMatches = staticPlayerInvolvement(name).flatMap((item) =>
      item.matches.map((match) => ({
        ...match,
        tournamentName: item.tournamentName,
        tournamentSlug: item.tournamentSlug
      }))
    );
    matches.push(...staticMatches);

    if (!staticMatches.length) {
      const publicRegistrations = await findPublicRegistrationsForPlayer(name);
      matches.push(...publicRegistrations.flatMap(registrationMatches));
    }
  }

  const upcoming = matches
    .filter((match) => match.status !== "completed")
    .sort((a, b) => parseDateTime(a) - parseDateTime(b));

  if (!name && !email) {
    return {
      intent: "next_match_missing_name",
      reply: "Tell me your player or captain name and I can find your next match. Example: “my name is Aarav Mehta, when is my next match?”",
      suggestions: ["My name is Aarav Mehta, when is my next match?", "Show TPL fixtures", "Open My Tournament"],
      links: [{ label: "My Tournament Page", href: "/my-tournament" }]
    };
  }

  if (!upcoming.length) {
    return {
      intent: "next_match_not_found",
      reply: `I could not find an upcoming match for ${name || email} yet. If you registered recently, fixtures may still be getting seeded by the organizer.`,
      suggestions: ["Show all fixtures", "Open My Tournament", "How do I contact organizer?"],
      links: [
        { label: "My Tournament", href: "/my-tournament" },
        { label: "Fixtures", href: "/fixtures" }
      ]
    };
  }

  const next = upcoming[0];
  return {
    intent: "next_match",
    reply: sentenceJoin([
      `Your next match is in ${next.tournamentName}:`,
      matchSummary(next),
      next.result ? `Note: ${next.result}` : ""
    ]),
    suggestions: ["What is the points table?", "How do I pay?", "Show live scores"],
    links: [
      { label: "Tournament Details", href: tournamentUrl(getTournament(next.tournamentSlug)) },
      { label: "All My Matches", href: "/my-tournament" }
    ]
  };
}

async function answerPointsTable(message) {
  const tournament = findTournamentInText(message);
  const staticStandings = tournament.standings || [];
  const liveStandings = staticStandings.length ? [] : await getStandingUpdates(tournament.slug);
  const standings = staticStandings.length ? staticStandings : liveStandings;

  if (!standings.length) {
    return {
      intent: "points_empty",
      reply: `${tournament.name} does not have a published points table yet. Once matches are updated, it will appear on Live Scores and Points Table.`,
      suggestions: ["Show fixtures", "Show live scores", "Open tournaments"],
      links: [
        { label: "Live Scores", href: "/live" },
        { label: "Tournament Details", href: tournamentUrl(tournament) }
      ]
    };
  }

  const topRows = standings
    .slice(0, 5)
    .map((row, index) => `${index + 1}. ${displayTeamName(row.team, tournament)} — ${row.points} pts, W${row.won}/L${row.lost}, NRR ${row.nrr}`);

  return {
    intent: "points_table",
    reply: sentenceJoin([`${tournament.name} points table:`, ...topRows]),
    suggestions: ["Show live scores", "When is my next match?", "Show leaderboard"],
    links: [
      { label: "Full Points Table", href: "/points-table" },
      { label: "Live Scores", href: "/live" }
    ]
  };
}

function answerPayment(message) {
  const tournament = findTournamentInText(message);
  const payment = paymentInfo();
  const upiLine = payment.upiId ? `UPI ID: ${payment.upiId}` : "UPI QR is available on the payment page.";

  return {
    intent: "payment",
    reply: sentenceJoin([
      `To pay for ${tournament.name}:`,
      `1. Register first so your team/player details are saved.`,
      `2. Open the payment page and select ${tournament.name}.`,
      `3. Pay the advance amount: ${formatCurrency(tournament.advanceAmount, tournament.currency)}.`,
      `4. Use Razorpay or PhonePe/UPI QR, then mark it for organizer verification.`,
      upiLine
    ]),
    suggestions: ["Open payment page", "How much is the entry fee?", "Contact organizer"],
    links: [
      { label: "Register", href: registerUrl(tournament) },
      { label: "Pay Advance", href: paymentUrl(tournament) }
    ]
  };
}

function answerFixtures(message) {
  const tournament = findTournamentInText(message);
  const matches = (tournament.matches || [])
    .filter((match) => match.status !== "completed")
    .slice(0, 5)
    .map((match) =>
      matchSummary({
        ...match,
        team1: displayTeamName(match.team1, tournament),
        team2: displayTeamName(match.team2, tournament)
      })
    );

  return {
    intent: "fixtures",
    reply: sentenceJoin([`Upcoming fixtures for ${tournament.name}:`, ...matches]),
    suggestions: ["When is my next match?", "Show points table", "Open live scores"],
    links: [
      { label: "All Fixtures", href: "/fixtures" },
      { label: "Tournament Details", href: tournamentUrl(tournament) }
    ]
  };
}

function answerRegistration(message) {
  const tournament = findTournamentInText(message);
  const open = tournament.status === "Open";

  return {
    intent: "registration",
    reply: open
      ? `${tournament.name} registration is open. Entry fee is ${formatCurrency(tournament.registrationFee, tournament.currency)}, advance is ${formatCurrency(tournament.advanceAmount, tournament.currency)}, and the last date is ${tournament.registrationDeadline}.`
      : `${tournament.name} registration is currently closed. You can still view fixtures, results, and live scores.`,
    suggestions: ["How do I pay?", "Show rules", "Open tournaments"],
    links: [
      { label: open ? "Register Now" : "Tournament Details", href: open ? registerUrl(tournament) : tournamentUrl(tournament) },
      { label: "All Tournaments", href: "/tournaments" }
    ]
  };
}

function answerRules(message) {
  const tournament = findTournamentInText(message);
  const rules = (tournament.rules || []).slice(0, 6).map((rule) => `• ${rule}`);

  return {
    intent: "rules",
    reply: sentenceJoin([`${tournament.name} rules:`, ...rules]),
    suggestions: ["Show prize money", "How do I register?", "Venue location"],
    links: [{ label: "Full Tournament Details", href: tournamentUrl(tournament) }]
  };
}

function answerPrizeFee(message) {
  const tournament = findTournamentInText(message);

  return {
    intent: "prize_fee",
    reply: sentenceJoin([
      `${tournament.name}:`,
      `Entry fee: ${formatCurrency(tournament.registrationFee, tournament.currency)}`,
      `Advance: ${formatCurrency(tournament.advanceAmount, tournament.currency)}`,
      ...(tournament.prizes || []).slice(0, 4).map((prize) => `• ${prize}`)
    ]),
    suggestions: ["How do I pay?", "Register now", "Show rules"],
    links: [
      { label: "Payment", href: paymentUrl(tournament) },
      { label: "Tournament Details", href: tournamentUrl(tournament) }
    ]
  };
}

function answerContact() {
  const contact = contactInfo();

  return {
    intent: "contact",
    reply: sentenceJoin([
      `Organizer: ${contact.name}`,
      `Phone: ${contact.phone}`,
      `Email: ${contact.email}`,
      `Instagram: ${contact.social}`
    ]),
    suggestions: ["Open WhatsApp", "Venue location", "How do I pay?"],
    links: [
      contact.whatsappUrl ? { label: "WhatsApp Organizer", href: contact.whatsappUrl } : null,
      { label: "Contact Page", href: "/about" }
    ].filter(Boolean)
  };
}

function answerOpenTournaments() {
  const items = openTournaments()
    .slice(0, 5)
    .map((tournament) => `• ${tournament.name} — ${tournament.sport}, ${tournament.dates}, ${tournament.slots - tournament.registered} slots left`);

  return {
    intent: "open_tournaments",
    reply: sentenceJoin(["Open tournaments:", ...items]),
    suggestions: ["How do I register?", "How do I pay?", "Show badminton"],
    links: [
      { label: "Browse Tournaments", href: "/tournaments" },
      { label: "Register", href: "/register" }
    ]
  };
}

function answerLeaderboard() {
  return {
    intent: "leaderboard",
    reply: "The leaderboard wall shows all-time top run scorers and wicket takers from verified scorecards across every tournament.",
    suggestions: ["Open leaderboard", "Show results", "Share match cards"],
    links: [
      { label: "Leaderboard Wall", href: "/leaderboard" },
      { label: "Results", href: "/results" }
    ]
  };
}

function fallbackAnswer() {
  return {
    intent: "fallback",
    reply: "I can help with next match lookup, points table, payment, fixtures, registration, rules, prizes, venue, live scores, and organizer contact.",
    suggestions: ["When is my next match?", "What is the points table?", "How do I pay?", "Show open tournaments"],
    links: [
      { label: "Live Scores", href: "/live" },
      { label: "My Tournament", href: "/my-tournament" }
    ]
  };
}

export async function answerTournamentQuestion({ message, profile = {} }) {
  const text = normalize(message);

  if (!text) {
    return fallbackAnswer();
  }

  if (/(next|my).*(match|fixture)|match.*(my|me)|when.*i.*play/.test(text)) {
    return answerNextMatch(message, profile);
  }

  if (/point|standing|table|rank|position|nrr/.test(text)) {
    return answerPointsTable(message);
  }

  if (/pay|payment|upi|razorpay|phonepe|advance|qr/.test(text)) {
    return answerPayment(message);
  }

  if (/fixture|schedule|time|date|when|venue|location|where/.test(text)) {
    return answerFixtures(message);
  }

  if (/register|registration|entry|slot|join|enroll|enrol/.test(text)) {
    return answerRegistration(message);
  }

  if (/rule|guideline|allowed|format|overs|shoe|bat|ball/.test(text)) {
    return answerRules(message);
  }

  if (/fee|price|cost|prize|award|winner|cash/.test(text)) {
    return answerPrizeFee(message);
  }

  if (/contact|phone|call|whatsapp|instagram|organizer|support/.test(text)) {
    return answerContact();
  }

  if (/open|tournament|badminton|tennis|football|cricket/.test(text)) {
    return answerOpenTournaments();
  }

  if (/leaderboard|top scorer|wicket|runs|stats|record/.test(text)) {
    return answerLeaderboard();
  }

  if (/share|card|forward|result/.test(text)) {
    return {
      intent: "share_cards",
      reply: "Completed results have WhatsApp-ready share cards. Open Results, choose a match, then tap WhatsApp Card or Open Image.",
      suggestions: ["Open results", "Show live scores", "Open leaderboard"],
      links: [
        { label: "Results", href: "/results" },
        { label: "Live Scores", href: "/live" }
      ]
    };
  }

  return fallbackAnswer();
}
