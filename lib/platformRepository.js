import crypto from "crypto";
import { databaseLabel, ensureSchema, hasDatabase, getSql } from "./db";
import { hashPassword, verifyPassword } from "./security";
import { tournaments } from "./tournament";
import { leaderboardData } from "./socialFeatures";

const placeholderMatchers = [
  /^$/i,
  /^TBD$/i,
  /^Team\s+\d+$/i,
  /^Finalist\s+/i,
  /^Winner Match\s+/i,
  /^Court\s+/i,
  /^Semi\s+/i,
  /^Doubles\s+[A-Z]$/i,
  /^Corp\s+[A-Z]$/i
];

function isPlaceholderTeam(value) {
  return placeholderMatchers.some((matcher) => matcher.test(String(value || "").trim()));
}

function mergeMatchWithFallback(row, tournament) {
  const match = matchFromRow(row);
  const fallback = tournament?.matches?.find((item) => item.id === match.id) || {};

  return {
    ...fallback,
    ...match,
    team1: isPlaceholderTeam(match.team1) && fallback.team1 ? fallback.team1 : match.team1,
    team2: isPlaceholderTeam(match.team2) && fallback.team2 ? fallback.team2 : match.team2,
    result: match.result || fallback.result || "",
    scorecard: {
      ...(fallback.scorecard || {}),
      ...(match.scorecard || {})
    }
  };
}

function sessionTokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function publicUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    primarySport: row.primary_sport,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function registrationFromRow(row) {
  return {
    id: row.id,
    tournamentSlug: row.tournament_slug,
    tournamentName: row.tournament_name,
    sport: row.sport,
    playerName: row.player_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    category: row.category,
    teamName: row.team_name,
    players: row.players || [],
    age: row.age,
    gender: row.gender,
    emergencyContact: row.emergency_contact,
    preferredPayment: row.preferred_payment,
    termsAccepted: row.terms_accepted,
    extras: row.extras || {},
    notes: row.notes,
    approvalStatus: row.approval_status || "Pending",
    paymentStatus: row.payment_status || row.status || "Pending",
    paidAmount: row.paid_amount || 0,
    paidAt: row.paid_at || "",
    fee: row.fee,
    advanceAmount: row.advance_amount,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function matchFromRow(row) {
  return {
    id: row.match_id || row.id,
    dbId: row.id,
    tournamentSlug: row.tournament_slug,
    team1: row.team1,
    team2: row.team2,
    date: row.date,
    time: row.time,
    venue: row.venue,
    status: row.status,
    result: row.result || "",
    scorecard: row.scorecard || {}
  };
}

function standingFromRow(row) {
  return {
    id: row.id,
    tournamentSlug: row.tournament_slug,
    team: row.team,
    played: row.played,
    won: row.won,
    lost: row.lost,
    points: row.points,
    nrr: row.nrr,
    updatedAt: row.updated_at
  };
}

function paymentFromRow(row) {
  return {
    id: row.id,
    registrationId: row.registration_id,
    tournamentSlug: row.tournament_slug,
    amount: row.amount,
    currency: row.currency,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    providerPaymentId: row.provider_payment_id,
    status: row.status,
    mode: row.mode,
    raw: row.raw || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function playerStatFromRow(row) {
  return {
    id: row.id,
    playerName: row.player_name,
    team: row.team,
    tournamentSlug: row.tournament_slug,
    role: row.role,
    runs: row.runs,
    wickets: row.wickets,
    catches: row.catches,
    matchesPlayed: row.matches_played,
    details: row.details || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function notificationFromRow(row) {
  return {
    id: row.id,
    recipient: row.recipient,
    phone: row.phone,
    message: row.message,
    type: row.type,
    target: row.target,
    createdAt: row.created_at
  };
}

function actionLogFromRow(row) {
  return {
    id: row.id,
    action: row.action,
    message: row.message,
    metadata: row.metadata || {},
    createdAt: row.created_at
  };
}

function tournamentFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sport: row.sport,
    format: row.format,
    city: row.city,
    venue: row.venue,
    startDate: row.starts_on,
    registrationDeadline: row.registration_deadline,
    registrationFee: row.registration_fee,
    advanceAmount: row.advance_amount,
    currency: row.currency,
    status: row.status,
    details: row.details || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function databaseStatus() {
  return {
    configured: hasDatabase(),
    host: databaseLabel()
  };
}

export async function syncTournamentCatalog() {
  if (!hasDatabase()) {
    return false;
  }

  await ensureSchema();
  const sql = getSql();

  for (const tournament of tournaments) {
    await sql`
      INSERT INTO tournaments (
        id, slug, name, sport, format, city, venue, starts_on,
        registration_deadline, registration_fee, advance_amount, currency,
        status, details, updated_at
      )
      VALUES (
        ${tournament.slug}, ${tournament.slug}, ${tournament.name}, ${tournament.sport},
        ${tournament.format}, ${tournament.city}, ${tournament.venue},
        ${tournament.startDate}, ${tournament.registrationDeadline},
        ${Number(tournament.registrationFee || 0)}, ${Number(tournament.advanceAmount || 0)},
        ${tournament.currency || "INR"}, ${tournament.status || "Open"},
        ${sql.json(tournament)}, NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `;

    for (const match of tournament.matches || []) {
      await sql`
        INSERT INTO match_updates (
          id, tournament_slug, match_id, team1, team2, date, time, venue,
          status, result, scorecard
        )
        VALUES (
          ${`${tournament.slug}_${match.id}`},
          ${tournament.slug},
          ${match.id},
          ${match.team1},
          ${match.team2},
          ${match.date || ""},
          ${match.time || ""},
          ${match.venue || ""},
          ${match.status || "upcoming"},
          ${match.result || ""},
          ${sql.json(match.scorecard || {})}
        )
        ON CONFLICT (tournament_slug, match_id) DO NOTHING
      `;
    }

    for (const row of tournament.standings || []) {
      await sql`
        INSERT INTO standing_updates (
          id, tournament_slug, team, played, won, lost, points, nrr
        )
        VALUES (
          ${`${tournament.slug}_${row.team}`},
          ${tournament.slug},
          ${row.team},
          ${Number(row.played || 0)},
          ${Number(row.won || 0)},
          ${Number(row.lost || 0)},
          ${Number(row.points || 0)},
          ${row.nrr || "0.000"}
        )
        ON CONFLICT (tournament_slug, team) DO NOTHING
      `;
    }
  }

  return true;
}

export async function upsertUser(payload, { setPassword = false } = {}) {
  if (!hasDatabase()) {
    return publicUser({
      id: payload.id || crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      city: payload.city,
      primary_sport: payload.primarySport,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  await ensureSchema();
  const sql = getSql();
  const password = setPassword && payload.password ? hashPassword(payload.password) : null;

  const rows = await sql`
    INSERT INTO users (
      id, name, email, phone, city, primary_sport, password_hash, password_salt, updated_at
    )
    VALUES (
      ${payload.id || crypto.randomUUID()},
      ${payload.name},
      ${payload.email.toLowerCase()},
      ${payload.phone || ""},
      ${payload.city || ""},
      ${payload.primarySport || ""},
      ${password?.hash || null},
      ${password?.salt || null},
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      city = EXCLUDED.city,
      primary_sport = EXCLUDED.primary_sport,
      password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
      password_salt = COALESCE(EXCLUDED.password_salt, users.password_salt),
      updated_at = NOW()
    RETURNING *
  `;

  return publicUser(rows[0]);
}

export async function authenticateUser(email, password) {
  if (!hasDatabase()) {
    return { databaseConfigured: false, user: null };
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return { databaseConfigured: true, user: null };
  }

  return { databaseConfigured: true, user: publicUser(user) };
}

export async function createUserSession(userId) {
  if (!hasDatabase() || !userId) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sessionTokenHash(token);

  await sql`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, updated_at)
    VALUES (
      ${crypto.randomUUID()},
      ${userId},
      ${tokenHash},
      NOW() + INTERVAL '30 days',
      NOW()
    )
  `;

  return token;
}

export async function getUserBySessionToken(token) {
  if (!hasDatabase() || !token) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT users.*
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ${sessionTokenHash(token)}
      AND sessions.expires_at > NOW()
    LIMIT 1
  `;

  return publicUser(rows[0]);
}

export async function deleteUserSession(token) {
  if (!hasDatabase() || !token) {
    return false;
  }

  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM sessions WHERE token_hash = ${sessionTokenHash(token)}`;
  return true;
}

export async function updateUserProfile(userId, payload) {
  if (!hasDatabase() || !userId) {
    return publicUser({
      id: userId || payload.id || crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      city: payload.city,
      primary_sport: payload.primarySport,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE users
    SET
      name = ${payload.name},
      phone = ${payload.phone || ""},
      city = ${payload.city || ""},
      primary_sport = ${payload.primarySport || ""},
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING *
  `;

  return publicUser(rows[0]);
}

export async function createRegistration(payload) {
  if (!hasDatabase()) {
    return registrationFromRow({
      ...payload,
      id: payload.id || crypto.randomUUID(),
      tournament_slug: payload.tournamentSlug,
      tournament_name: payload.tournamentName,
      player_name: payload.playerName,
      team_name: payload.teamName,
      advance_amount: payload.advanceAmount,
      emergency_contact: payload.emergencyContact,
      preferred_payment: payload.preferredPayment,
      terms_accepted: payload.termsAccepted,
      approval_status: payload.approvalStatus || "Pending",
      payment_status: payload.paymentStatus || payload.status || "Advance pending",
      paid_amount: payload.paidAmount || 0,
      paid_at: payload.paidAt || "",
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  await syncTournamentCatalog();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO registrations (
      id, tournament_slug, tournament_name, sport, player_name, email, phone,
      city, category, team_name, players, age, gender, emergency_contact,
      preferred_payment, terms_accepted, extras, notes, fee, advance_amount,
      currency, status, approval_status, payment_status, paid_amount, paid_at, updated_at
    )
    VALUES (
      ${payload.id || crypto.randomUUID()},
      ${payload.tournamentSlug},
      ${payload.tournamentName},
      ${payload.sport},
      ${payload.playerName},
      ${payload.email.toLowerCase()},
      ${payload.phone || ""},
      ${payload.city || ""},
      ${payload.category || ""},
      ${payload.teamName || ""},
      ${sql.json(payload.players || [])},
      ${payload.age || ""},
      ${payload.gender || ""},
      ${payload.emergencyContact || ""},
      ${payload.preferredPayment || ""},
      ${Boolean(payload.termsAccepted)},
      ${sql.json(payload.extras || {})},
      ${payload.notes || ""},
      ${Number(payload.fee || 0)},
      ${Number(payload.advanceAmount || 0)},
      ${payload.currency || "INR"},
      ${payload.status || "Advance pending"},
      ${payload.approvalStatus || "Pending"},
      ${payload.paymentStatus || payload.status || "Advance pending"},
      ${Number(payload.paidAmount || 0)},
      ${payload.paidAt || ""},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      tournament_slug = EXCLUDED.tournament_slug,
      tournament_name = EXCLUDED.tournament_name,
      sport = EXCLUDED.sport,
      player_name = EXCLUDED.player_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      city = EXCLUDED.city,
      category = EXCLUDED.category,
      team_name = EXCLUDED.team_name,
      players = EXCLUDED.players,
      age = EXCLUDED.age,
      gender = EXCLUDED.gender,
      emergency_contact = EXCLUDED.emergency_contact,
      preferred_payment = EXCLUDED.preferred_payment,
      terms_accepted = EXCLUDED.terms_accepted,
      extras = EXCLUDED.extras,
      notes = EXCLUDED.notes,
      fee = EXCLUDED.fee,
      advance_amount = EXCLUDED.advance_amount,
      currency = EXCLUDED.currency,
      status = EXCLUDED.status,
      approval_status = EXCLUDED.approval_status,
      payment_status = EXCLUDED.payment_status,
      paid_amount = EXCLUDED.paid_amount,
      paid_at = EXCLUDED.paid_at,
      updated_at = NOW()
    RETURNING *
  `;

  return registrationFromRow(rows[0]);
}

export async function updateRegistrationStatus(registrationId, status) {
  if (!hasDatabase() || !registrationId) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE registrations
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${registrationId}
    RETURNING *
  `;

  return rows[0] ? registrationFromRow(rows[0]) : null;
}

export async function listRegistrations({ email } = {}) {
  if (!hasDatabase()) {
    return [];
  }

  await ensureSchema();
  const sql = getSql();
  const rows = email
    ? await sql`
        SELECT *
        FROM registrations
        WHERE LOWER(email) = ${email.toLowerCase()}
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT *
        FROM registrations
        ORDER BY created_at DESC
      `;

  return rows.map(registrationFromRow);
}

export async function findPublicRegistrationsForPlayer(query) {
  const value = String(query || "").trim();

  if (!hasDatabase() || value.length < 2) {
    return [];
  }

  await ensureSchema();
  const sql = getSql();
  const pattern = `%${value}%`;
  const rows = await sql`
    SELECT
      id, tournament_slug, tournament_name, sport, player_name, category,
      team_name, status, created_at, updated_at
    FROM registrations
    WHERE player_name ILIKE ${pattern}
      OR team_name ILIKE ${pattern}
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(players) AS player(value)
        WHERE player.value ILIKE ${pattern}
      )
    ORDER BY created_at DESC
    LIMIT 30
  `;

  return rows.map((row) => ({
    id: row.id,
    tournamentSlug: row.tournament_slug,
    tournamentName: row.tournament_name,
    sport: row.sport,
    playerName: row.player_name,
    category: row.category,
    teamName: row.team_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function createPayment(payload) {
  if (!hasDatabase()) {
    return paymentFromRow({
      ...payload,
      id: payload.id || crypto.randomUUID(),
      registration_id: payload.registrationId,
      tournament_slug: payload.tournamentSlug,
      provider_order_id: payload.providerOrderId,
      provider_payment_id: payload.providerPaymentId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  await ensureSchema();
  const sql = getSql();
  const paymentId = payload.id || crypto.randomUUID();
  const rows = await sql`
    INSERT INTO payments (
      id, registration_id, tournament_slug, amount, currency, provider,
      provider_order_id, provider_payment_id, status, mode, raw, updated_at
    )
    VALUES (
      ${paymentId},
      ${payload.registrationId || null},
      ${payload.tournamentSlug},
      ${Number(payload.amount || 0)},
      ${payload.currency || "INR"},
      ${payload.provider || "razorpay"},
      ${payload.providerOrderId || null},
      ${payload.providerPaymentId || null},
      ${payload.status || "created"},
      ${payload.mode || "live"},
      ${sql.json(payload.raw || {})},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      registration_id = EXCLUDED.registration_id,
      tournament_slug = EXCLUDED.tournament_slug,
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      provider = EXCLUDED.provider,
      provider_order_id = EXCLUDED.provider_order_id,
      provider_payment_id = EXCLUDED.provider_payment_id,
      status = EXCLUDED.status,
      mode = EXCLUDED.mode,
      raw = EXCLUDED.raw,
      updated_at = NOW()
    RETURNING *
  `;

  if (payload.registrationId && ["paid", "demo_paid"].includes(payload.status)) {
    await updateRegistrationStatus(payload.registrationId, "Advance paid");
  }

  return paymentFromRow(rows[0]);
}

export async function listScoreboard(tournamentSlug) {
  if (!hasDatabase()) {
    const selected = tournamentSlug ? tournaments.filter((item) => item.slug === tournamentSlug) : tournaments;
    return selected.map((tournament) => ({
      tournamentSlug: tournament.slug,
      tournamentName: tournament.name,
      sport: tournament.sport,
      teams: tournament.teams || [],
      matches: tournament.matches || [],
      standings: tournament.standings || []
    }));
  }

  await syncTournamentCatalog();
  const sql = getSql();
  const tournamentRows = tournamentSlug
    ? await sql`SELECT * FROM tournaments WHERE slug = ${tournamentSlug} ORDER BY starts_on ASC, name ASC`
    : await sql`SELECT * FROM tournaments ORDER BY starts_on ASC, name ASC`;
  const selected = tournamentRows.map((row) => {
    const dbTournament = tournamentFromRow(row);
    const fallback = tournaments.find((item) => item.slug === dbTournament.slug) || {};
    const details = dbTournament.details || {};

    return {
      ...fallback,
      ...details,
      ...dbTournament,
      teams: details.teams || fallback.teams || [],
      matches: details.matches || fallback.matches || [],
      standings: details.standings || fallback.standings || []
    };
  });
  const slugs = selected.map((item) => item.slug);

  const [matches, standings] = slugs.length
    ? await Promise.all([
        sql`
          SELECT *
          FROM match_updates
          WHERE tournament_slug IN ${sql(slugs)}
          ORDER BY tournament_slug, date, time, match_id
        `,
        sql`
          SELECT *
          FROM standing_updates
          WHERE tournament_slug IN ${sql(slugs)}
          ORDER BY tournament_slug, points DESC, nrr DESC, team ASC
        `
      ])
    : [[], []];

  return selected.map((tournament) => ({
    tournamentSlug: tournament.slug,
    tournamentName: tournament.name,
    sport: tournament.sport,
    format: tournament.format,
    city: tournament.city,
    venue: tournament.venue,
    status: tournament.status,
    startDate: tournament.startDate,
    registrationDeadline: tournament.registrationDeadline,
    registrationFee: tournament.registrationFee,
    advanceAmount: tournament.advanceAmount,
    currency: tournament.currency,
    teams: tournament.teams || [],
    matches: matches.filter((row) => row.tournament_slug === tournament.slug).map((row) => mergeMatchWithFallback(row, tournament)),
    standings: standings.filter((row) => row.tournament_slug === tournament.slug).map(standingFromRow)
  })).map((event, index) => ({
    ...event,
    matches: event.matches.length ? event.matches : selected[index].matches || [],
    standings: event.standings.length ? event.standings : selected[index].standings || []
  }));
}

export async function updateMatchScore(payload) {
  if (!hasDatabase()) {
    return null;
  }

  await syncTournamentCatalog();
  const sql = getSql();
  const tournament = tournaments.find((item) => item.slug === payload.tournamentSlug);
  const fallback = tournament?.matches?.find((match) => match.id === payload.matchId) || {};
  const scorecard = {
    team1Score: payload.team1Score || payload.scorecard?.team1Score || fallback.scorecard?.team1Score || "",
    team2Score: payload.team2Score || payload.scorecard?.team2Score || fallback.scorecard?.team2Score || "",
    playerOfMatch: payload.playerOfMatch || payload.scorecard?.playerOfMatch || fallback.scorecard?.playerOfMatch || "",
    highlights: String(payload.highlights || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  };

  const rows = await sql`
    INSERT INTO match_updates (
      id, tournament_slug, match_id, team1, team2, date, time, venue,
      status, result, scorecard, updated_at
    )
    VALUES (
      ${`${payload.tournamentSlug}_${payload.matchId}`},
      ${payload.tournamentSlug},
      ${payload.matchId},
      ${payload.team1 || fallback.team1 || ""},
      ${payload.team2 || fallback.team2 || ""},
      ${payload.date || fallback.date || ""},
      ${payload.time || fallback.time || ""},
      ${payload.venue || fallback.venue || ""},
      ${payload.status || fallback.status || "upcoming"},
      ${payload.result || fallback.result || ""},
      ${sql.json(scorecard)},
      NOW()
    )
    ON CONFLICT (tournament_slug, match_id) DO UPDATE SET
      team1 = EXCLUDED.team1,
      team2 = EXCLUDED.team2,
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      venue = EXCLUDED.venue,
      status = EXCLUDED.status,
      result = EXCLUDED.result,
      scorecard = EXCLUDED.scorecard,
      updated_at = NOW()
    RETURNING *
  `;

  return matchFromRow(rows[0]);
}

export async function updateStanding(payload) {
  if (!hasDatabase()) {
    return null;
  }

  await syncTournamentCatalog();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO standing_updates (
      id, tournament_slug, team, played, won, lost, points, nrr, updated_at
    )
    VALUES (
      ${`${payload.tournamentSlug}_${payload.team}`},
      ${payload.tournamentSlug},
      ${payload.team},
      ${Number(payload.played || 0)},
      ${Number(payload.won || 0)},
      ${Number(payload.lost || 0)},
      ${Number(payload.points || 0)},
      ${payload.nrr || "0.000"},
      NOW()
    )
    ON CONFLICT (tournament_slug, team) DO UPDATE SET
      played = EXCLUDED.played,
      won = EXCLUDED.won,
      lost = EXCLUDED.lost,
      points = EXCLUDED.points,
      nrr = EXCLUDED.nrr,
      updated_at = NOW()
    RETURNING *
  `;

  return standingFromRow(rows[0]);
}

export async function getStandingUpdates(tournamentSlug) {
  if (!hasDatabase() || !tournamentSlug) {
    return [];
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT *
      FROM standing_updates
      WHERE tournament_slug = ${tournamentSlug}
      ORDER BY points DESC, nrr DESC, team ASC
    `;

    return rows.map(standingFromRow);
  } catch {
    return [];
  }
}

export async function getMatchUpdate(tournamentSlug, matchId) {
  if (!hasDatabase() || !tournamentSlug || !matchId) {
    return null;
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT *
      FROM match_updates
      WHERE tournament_slug = ${tournamentSlug}
        AND match_id = ${matchId}
      LIMIT 1
    `;

    return rows[0] ? matchFromRow(rows[0]) : null;
  } catch {
    return null;
  }
}

function defaultContent() {
  return {
    announcement: "",
    announcementPublished: false,
    gallery: [],
    contact: {
      phone: "+91 98765 43210",
      email: "organizers@sportsarenatournaments.in",
      whatsapp: "+91 98765 43210"
    },
    socials: {
      instagram: "https://www.instagram.com/turfpremier_league/",
      facebook: ""
    }
  };
}

function parseScore(score) {
  const value = String(score || "");
  const match = value.match(/(\d+)\s*\/\s*(\d+).*?\(?(\d+(?:\.\d+)?)\s*ov/i);
  const simple = value.match(/(\d+)\s*\/\s*(\d+)/);
  return {
    runs: Number(match?.[1] || simple?.[1] || 0),
    wickets: Number(match?.[2] || simple?.[2] || 0),
    overs: Number(match?.[3] || 10)
  };
}

async function writeActionLog(sql, action, message, metadata = {}) {
  await sql`
    INSERT INTO admin_action_logs (id, action, message, metadata)
    VALUES (${crypto.randomUUID()}, ${action}, ${message}, ${sql.json(metadata)})
  `;
}

async function readSiteContent(sql) {
  const rows = await sql`SELECT * FROM site_content WHERE id = 'main' LIMIT 1`;
  return rows[0]?.data || defaultContent();
}

export async function getSiteContent() {
  if (!hasDatabase()) {
    return defaultContent();
  }

  await ensureSchema();
  const sql = getSql();
  return readSiteContent(sql);
}

async function recalculateStandings(tournamentSlug) {
  if (!hasDatabase()) {
    return [];
  }

  const tournament = tournaments.find((item) => item.slug === tournamentSlug);
  if (!tournament) {
    return [];
  }

  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM match_updates
    WHERE tournament_slug = ${tournamentSlug}
    ORDER BY date, time, match_id
  `;
  const matches = rows.map((row) => mergeMatchWithFallback(row, tournament));
  const teams = new Map();

  function ensure(team) {
    if (!teams.has(team)) {
      teams.set(team, {
        tournamentSlug,
        team,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        runsFor: 0,
        runsAgainst: 0,
        oversFor: 0,
        oversAgainst: 0
      });
    }
    return teams.get(team);
  }

  for (const team of tournament.teams || []) {
    ensure(team.shortName);
  }

  for (const match of matches) {
    if (match.status !== "completed") {
      continue;
    }

    const team1 = ensure(match.team1);
    const team2 = ensure(match.team2);
    const s1 = parseScore(match.scorecard?.team1Score);
    const s2 = parseScore(match.scorecard?.team2Score);

    team1.played += 1;
    team2.played += 1;
    team1.runsFor += s1.runs;
    team1.runsAgainst += s2.runs;
    team1.oversFor += s1.overs;
    team1.oversAgainst += s2.overs;
    team2.runsFor += s2.runs;
    team2.runsAgainst += s1.runs;
    team2.oversFor += s2.overs;
    team2.oversAgainst += s1.overs;

    if (s1.runs > s2.runs) {
      team1.won += 1;
      team1.points += 2;
      team2.lost += 1;
    } else if (s2.runs > s1.runs) {
      team2.won += 1;
      team2.points += 2;
      team1.lost += 1;
    }
  }

  const standings = [...teams.values()].map((row) => ({
    ...row,
    nrr: row.played
      ? ((row.runsFor / Math.max(row.oversFor, 1)) - (row.runsAgainst / Math.max(row.oversAgainst, 1))).toFixed(3)
      : "0.000"
  }));

  for (const row of standings) {
    await updateStanding(row);
  }

  return standings;
}

async function seedPlayerStats(sql) {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM player_stats`;
  if (rows[0]?.count) {
    return;
  }

  const { topScorers, topWicketTakers } = leaderboardData();
  const players = new Map();
  for (const row of [...topScorers, ...topWicketTakers]) {
    const key = `${row.player}-${row.team || ""}`;
    players.set(key, {
      playerName: row.player,
      team: row.team || row.teamName || "",
      tournamentSlug: tournaments.find((item) => row.tournaments?.includes(item.name))?.slug || "tpl-2026",
      role: row.wickets > row.runs ? "Bowler" : "All-rounder",
      runs: row.runs || 0,
      wickets: row.wickets || 0,
      catches: 0,
      matchesPlayed: row.matches || 1
    });
  }

  for (const row of players.values()) {
    await sql`
      INSERT INTO player_stats (
        id, player_name, team, tournament_slug, role, runs, wickets, catches, matches_played, updated_at
      )
      VALUES (
        ${crypto.randomUUID()}, ${row.playerName}, ${row.team}, ${row.tournamentSlug},
        ${row.role}, ${row.runs}, ${row.wickets}, ${row.catches}, ${row.matchesPlayed}, NOW()
      )
    `;
  }
}

export async function dashboardSummary() {
  const status = await databaseStatus();

  if (!status.configured) {
    return {
      database: status,
      stats: {
        tournaments: tournaments.length,
        users: 0,
        registrations: 0,
        payments: 0,
        paidRegistrations: 0
      },
      tournaments,
      users: [],
      registrations: [],
      payments: []
    };
  }

  await syncTournamentCatalog();
  const sql = getSql();
  const [tournamentRows, userRows, registrationRows, paymentRows, statRows] = await Promise.all([
    sql`SELECT * FROM tournaments ORDER BY starts_on ASC, name ASC`,
    sql`SELECT * FROM users ORDER BY created_at DESC`,
    sql`SELECT * FROM registrations ORDER BY created_at DESC`,
    sql`SELECT * FROM payments ORDER BY created_at DESC`,
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM tournaments) AS tournaments,
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM registrations) AS registrations,
        (SELECT COUNT(*)::int FROM payments) AS payments,
        (SELECT COUNT(*)::int FROM registrations WHERE status = 'Advance paid') AS paid_registrations
    `
  ]);

  return {
    database: status,
    stats: {
      tournaments: statRows[0].tournaments,
      users: statRows[0].users,
      registrations: statRows[0].registrations,
      payments: statRows[0].payments,
      paidRegistrations: statRows[0].paid_registrations
    },
    tournaments: tournamentRows.map(tournamentFromRow),
    users: userRows.map(publicUser),
    registrations: registrationRows.map(registrationFromRow),
    payments: paymentRows.map(paymentFromRow)
  };
}

export async function adminConsoleData() {
  const summary = await dashboardSummary();

  if (!hasDatabase()) {
    return {
      ...summary,
      scoreboard: await listScoreboard(),
      players: [],
      content: defaultContent(),
      notifications: [],
      logs: []
    };
  }

  await ensureSchema();
  const sql = getSql();
  await seedPlayerStats(sql);
  const [scoreboard, playerRows, notificationRows, logRows, content] = await Promise.all([
    listScoreboard(),
    sql`SELECT * FROM player_stats ORDER BY runs DESC, wickets DESC, player_name ASC`,
    sql`SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 150`,
    readSiteContent(sql)
  ]);

  const paymentsReceived = summary.registrations.reduce((total, row) => total + Number(row.paidAmount || 0), 0);
  const paymentsPending = summary.registrations.reduce((total, row) => total + Math.max(Number(row.advanceAmount || 0) - Number(row.paidAmount || 0), 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const allMatches = scoreboard.flatMap((event) => event.matches.map((match) => ({ ...match, tournamentSlug: event.tournamentSlug, tournamentName: event.tournamentName })));
  const todayMatches = allMatches.filter((match) => match.date === today);
  const topScorer = playerRows.sort((a, b) => b.runs - a.runs)[0];
  const topWicketTaker = playerRows.sort((a, b) => b.wickets - a.wickets)[0];

  return {
    ...summary,
    stats: {
      ...summary.stats,
      activeTournaments: summary.tournaments.filter((tournament) => tournament.status === "Open" || tournament.status === "Ongoing").length,
      completedTournaments: summary.tournaments.filter((tournament) => tournament.status === "Completed").length,
      upcomingTournaments: summary.tournaments.filter((tournament) => tournament.status === "Upcoming").length,
      teamsRegistered: summary.registrations.length || (tournaments[0]?.teams?.length ?? 0),
      paymentsReceived,
      paymentsPending,
      matchesPlayedToday: todayMatches.filter((match) => match.status === "completed").length,
      matchesRemainingToday: todayMatches.filter((match) => match.status !== "completed").length,
      topScorer: topScorer ? { name: topScorer.player_name, stat: `${topScorer.runs} runs` } : null,
      topWicketTaker: topWicketTaker ? { name: topWicketTaker.player_name, stat: `${topWicketTaker.wickets} wickets` } : null
    },
    scoreboard,
    players: playerRows.map(playerStatFromRow),
    content,
    notifications: notificationRows.map(notificationFromRow),
    logs: logRows.map(actionLogFromRow)
  };
}

export async function adminMutate(action, payload = {}) {
  if (!hasDatabase()) {
    throw new Error("Database is not configured.");
  }

  await syncTournamentCatalog();
  const sql = getSql();

  if (action === "saveTournament") {
    const slug = payload.slug || String(payload.name || "tournament").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || crypto.randomUUID();
    const details = {
      maxTeams: Number(payload.maxTeams || payload.slots || 0),
      prizeMoney: payload.prizeMoney || "",
      description: payload.description || "",
      endDate: payload.endDate || "",
      publishedFromAdmin: true
    };
    const rows = await sql`
      INSERT INTO tournaments (
        id, slug, name, sport, format, city, venue, starts_on,
        registration_deadline, registration_fee, advance_amount, currency, status, details, updated_at
      )
      VALUES (
        ${slug}, ${slug}, ${payload.name}, ${payload.sport || "Cricket"}, ${payload.format || "T10"},
        ${payload.city || ""}, ${payload.venue || ""}, ${payload.startDate || ""},
        ${payload.endDate || payload.startDate || ""}, ${Number(payload.registrationFee || payload.entryFee || 0)},
        ${Number(payload.advanceAmount || 0)}, ${payload.currency || "INR"}, ${payload.status || "Upcoming"},
        ${sql.json(details)}, NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        sport = EXCLUDED.sport,
        format = EXCLUDED.format,
        city = EXCLUDED.city,
        venue = EXCLUDED.venue,
        starts_on = EXCLUDED.starts_on,
        registration_deadline = EXCLUDED.registration_deadline,
        registration_fee = EXCLUDED.registration_fee,
        advance_amount = EXCLUDED.advance_amount,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        details = COALESCE(tournaments.details, '{}'::jsonb) || EXCLUDED.details,
        updated_at = NOW()
      RETURNING *
    `;
    await writeActionLog(sql, "saveTournament", `Tournament saved: ${payload.name}`, { slug });
    return { tournament: tournamentFromRow(rows[0]) };
  }

  if (action === "deleteTournament") {
    await sql`DELETE FROM match_updates WHERE tournament_slug = ${payload.slug}`;
    await sql`DELETE FROM standing_updates WHERE tournament_slug = ${payload.slug}`;
    await sql`DELETE FROM registrations WHERE tournament_slug = ${payload.slug}`;
    await sql`DELETE FROM tournaments WHERE slug = ${payload.slug}`;
    await writeActionLog(sql, "deleteTournament", `Tournament deleted: ${payload.name || payload.slug}`, payload);
    return { ok: true };
  }

  if (action === "toggleRegistration" || action === "setTournamentStatus") {
    const status = payload.status || (payload.currentStatus === "Open" ? "Closed" : "Open");
    const rows = await sql`
      UPDATE tournaments
      SET status = ${status}, updated_at = NOW()
      WHERE slug = ${payload.slug}
      RETURNING *
    `;
    await writeActionLog(sql, action, `Tournament status changed: ${payload.slug} — ${status}`, payload);
    return { tournament: tournamentFromRow(rows[0]) };
  }

  if (action === "updateRegistration") {
    const rows = await sql`
      UPDATE registrations
      SET
        team_name = COALESCE(${payload.teamName || null}, team_name),
        player_name = COALESCE(${payload.playerName || null}, player_name),
        phone = COALESCE(${payload.phone || null}, phone),
        status = COALESCE(${payload.status || null}, status),
        approval_status = COALESCE(${payload.approvalStatus || null}, approval_status),
        payment_status = COALESCE(${payload.paymentStatus || null}, payment_status),
        paid_amount = COALESCE(${payload.paidAmount === undefined ? null : Number(payload.paidAmount)}, paid_amount),
        paid_at = COALESCE(${payload.paidAt || null}, paid_at),
        updated_at = NOW()
      WHERE id = ${payload.id}
      RETURNING *
    `;
    await writeActionLog(sql, "updateRegistration", `Registration updated: ${payload.teamName || payload.id}`, payload);
    return { registration: registrationFromRow(rows[0]) };
  }

  if (action === "deleteRegistration") {
    await sql`DELETE FROM payments WHERE registration_id = ${payload.id}`;
    await sql`DELETE FROM registrations WHERE id = ${payload.id}`;
    await writeActionLog(sql, "deleteRegistration", `Registration deleted: ${payload.teamName || payload.id}`, payload);
    return { ok: true };
  }

  if (action === "saveMatch") {
    const match = await updateMatchScore(payload);
    if (payload.status === "completed") {
      await recalculateStandings(payload.tournamentSlug);
    }
    await writeActionLog(sql, "saveMatch", `Match updated: ${payload.team1} vs ${payload.team2}`, payload);
    return { match };
  }

  if (action === "deleteMatch") {
    await sql`DELETE FROM match_updates WHERE tournament_slug = ${payload.tournamentSlug} AND match_id = ${payload.matchId}`;
    await writeActionLog(sql, "deleteMatch", `Fixture deleted: ${payload.matchId}`, payload);
    return { ok: true };
  }

  if (action === "saveStanding") {
    const standing = await updateStanding(payload);
    await writeActionLog(sql, "saveStanding", `Points table updated: ${payload.team}`, payload);
    return { standing };
  }

  if (action === "recalculateStandings") {
    const standings = await recalculateStandings(payload.tournamentSlug);
    await writeActionLog(sql, "recalculateStandings", `Points recalculated: ${payload.tournamentSlug}`, payload);
    return { standings };
  }

  if (action === "savePlayer") {
    const id = payload.id || crypto.randomUUID();
    const rows = await sql`
      INSERT INTO player_stats (
        id, player_name, team, tournament_slug, role, runs, wickets, catches, matches_played, details, updated_at
      )
      VALUES (
        ${id}, ${payload.playerName}, ${payload.team || ""}, ${payload.tournamentSlug || ""},
        ${payload.role || "All-rounder"}, ${Number(payload.runs || 0)}, ${Number(payload.wickets || 0)},
        ${Number(payload.catches || 0)}, ${Number(payload.matchesPlayed || 0)}, ${sql.json(payload.details || {})}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        player_name = EXCLUDED.player_name,
        team = EXCLUDED.team,
        tournament_slug = EXCLUDED.tournament_slug,
        role = EXCLUDED.role,
        runs = EXCLUDED.runs,
        wickets = EXCLUDED.wickets,
        catches = EXCLUDED.catches,
        matches_played = EXCLUDED.matches_played,
        details = EXCLUDED.details,
        updated_at = NOW()
      RETURNING *
    `;
    await writeActionLog(sql, "savePlayer", `Player stats saved: ${payload.playerName}`, payload);
    return { player: playerStatFromRow(rows[0]) };
  }

  if (action === "deletePlayer") {
    await sql`DELETE FROM player_stats WHERE id = ${payload.id}`;
    await writeActionLog(sql, "deletePlayer", `Player deleted: ${payload.playerName || payload.id}`, payload);
    return { ok: true };
  }

  if (action === "saveContent") {
    await sql`
      INSERT INTO site_content (id, data, updated_at)
      VALUES ('main', ${sql.json(payload.content || defaultContent())}, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `;
    await writeActionLog(sql, "saveContent", "Site content updated", payload.content || {});
    return { content: payload.content };
  }

  if (action === "sendNotification") {
    const rows = await sql`
      INSERT INTO admin_notifications (id, recipient, phone, message, type, target)
      VALUES (${crypto.randomUUID()}, ${payload.recipient || "Broadcast"}, ${payload.phone || ""}, ${payload.message}, ${payload.type || "custom"}, ${payload.target || ""})
      RETURNING *
    `;
    await writeActionLog(sql, "sendNotification", `Notification prepared: ${payload.recipient || "Broadcast"}`, payload);
    return { notification: notificationFromRow(rows[0]) };
  }

  throw new Error(`Unsupported admin action: ${action}`);
}
