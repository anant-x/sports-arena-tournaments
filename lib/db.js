import postgres from "postgres";

let client;
let schemaPromise;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function databaseLabel() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return "Not configured";
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "Configured";
  }
}

export function getSql() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!client) {
    const url = process.env.DATABASE_URL;
    const isLocal = /localhost|127\.0\.0\.1/.test(url);

    client = postgres(url, {
      max: 1,
      ssl: isLocal ? false : "require",
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }

  return client;
}

export async function ensureSchema() {
  if (!hasDatabase()) {
    return false;
  }

  if (!schemaPromise) {
    schemaPromise = createSchema();
  }

  await schemaPromise;
  return true;
}

async function createSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      sport TEXT NOT NULL,
      format TEXT,
      city TEXT,
      venue TEXT,
      starts_on TEXT,
      registration_deadline TEXT,
      registration_fee INTEGER NOT NULL DEFAULT 0,
      advance_amount INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'open',
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      city TEXT,
      primary_sport TEXT,
      password_hash TEXT,
      password_salt TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      tournament_slug TEXT NOT NULL,
      tournament_name TEXT NOT NULL,
      sport TEXT NOT NULL,
      player_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      category TEXT,
      team_name TEXT,
      players JSONB NOT NULL DEFAULT '[]'::jsonb,
      age TEXT,
      gender TEXT,
      emergency_contact TEXT,
      preferred_payment TEXT,
      terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
      extras JSONB NOT NULL DEFAULT '{}'::jsonb,
      notes TEXT,
      fee INTEGER NOT NULL DEFAULT 0,
      advance_amount INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'Advance pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      registration_id TEXT REFERENCES registrations(id) ON DELETE SET NULL,
      tournament_slug TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      provider TEXT NOT NULL DEFAULT 'razorpay',
      provider_order_id TEXT,
      provider_payment_id TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      mode TEXT NOT NULL DEFAULT 'live',
      raw JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS match_updates (
      id TEXT PRIMARY KEY,
      tournament_slug TEXT NOT NULL,
      match_id TEXT NOT NULL,
      team1 TEXT NOT NULL,
      team2 TEXT NOT NULL,
      date TEXT,
      time TEXT,
      venue TEXT,
      status TEXT NOT NULL DEFAULT 'upcoming',
      result TEXT,
      scorecard JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tournament_slug, match_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS standing_updates (
      id TEXT PRIMARY KEY,
      tournament_slug TEXT NOT NULL,
      team TEXT NOT NULL,
      played INTEGER NOT NULL DEFAULT 0,
      won INTEGER NOT NULL DEFAULT 0,
      lost INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      nrr TEXT NOT NULL DEFAULT '0.000',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tournament_slug, team)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations (LOWER(email))`;
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON registrations (tournament_slug, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_registration ON payments (registration_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_match_updates_tournament ON match_updates (tournament_slug, date, time)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_standing_updates_tournament ON standing_updates (tournament_slug, points DESC)`;

  await addColumnIfMissing("registrations", "age", "TEXT");
  await addColumnIfMissing("registrations", "gender", "TEXT");
  await addColumnIfMissing("registrations", "emergency_contact", "TEXT");
  await addColumnIfMissing("registrations", "preferred_payment", "TEXT");
  await addColumnIfMissing("registrations", "terms_accepted", "BOOLEAN NOT NULL DEFAULT FALSE");
  await addColumnIfMissing("registrations", "extras", "JSONB NOT NULL DEFAULT '{}'::jsonb");
}

async function addColumnIfMissing(table, column, definition) {
  const sql = getSql();
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${table}
      AND column_name = ${column}
  `;

  if (!rows.length) {
    await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
