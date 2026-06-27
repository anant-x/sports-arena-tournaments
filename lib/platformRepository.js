import crypto from "crypto";
import { databaseLabel, ensureSchema, hasDatabase, getSql } from "./db";
import { hashPassword, verifyPassword } from "./security";
import { tournaments } from "./tournament";

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
        details = EXCLUDED.details,
        updated_at = NOW()
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
      currency, status, updated_at
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
  const selected = tournamentSlug ? tournaments.filter((item) => item.slug === tournamentSlug) : tournaments;
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
    teams: tournament.teams || [],
    matches: matches.filter((row) => row.tournament_slug === tournament.slug).map(matchFromRow),
    standings: standings.filter((row) => row.tournament_slug === tournament.slug).map(standingFromRow)
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
