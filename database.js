const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'platform.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const VALID_ROLES = new Set(['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Singles Player', 'Doubles Player', 'Captain']);
const VALID_TOURNAMENT_STATUSES = new Set(['open', 'upcoming', 'live', 'completed']);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      sport TEXT NOT NULL DEFAULT 'Cricket',
      format TEXT NOT NULL,
      description TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      registration_deadline TEXT,
      venue TEXT NOT NULL,
      city TEXT NOT NULL,
      reporting_time TEXT,
      registration_fee INTEGER DEFAULT 0,
      min_players INTEGER NOT NULL DEFAULT 8,
      max_players INTEGER NOT NULL DEFAULT 11,
      max_teams INTEGER,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'upcoming', 'live', 'completed')),
      banner_url TEXT,
      accent_color TEXT DEFAULT '#f4a261',
      rules_json TEXT NOT NULL DEFAULT '[]',
      prizes_json TEXT NOT NULL DEFAULT '[]',
      is_featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER,
      name TEXT NOT NULL,
      captain_name TEXT NOT NULL,
      captain_phone TEXT NOT NULL,
      captain_email TEXT NOT NULL,
      city TEXT NOT NULL,
      logo_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      UNIQUE (tournament_id, name)
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Singles Player', 'Doubles Player', 'Captain')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER,
      team_a_id INTEGER NOT NULL,
      team_b_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'group' CHECK (stage IN ('group', 'quarter', 'semi', 'final')),
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (team_a_id) REFERENCES teams(id),
      FOREIGN KEY (team_b_id) REFERENCES teams(id),
      CHECK (team_a_id != team_b_id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL UNIQUE,
      winner_id INTEGER NOT NULL,
      team_a_score INTEGER NOT NULL,
      team_a_wickets INTEGER NOT NULL,
      team_a_overs TEXT NOT NULL,
      team_b_score INTEGER NOT NULL,
      team_b_wickets INTEGER NOT NULL,
      team_b_overs TEXT NOT NULL,
      man_of_match_player_id INTEGER,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (winner_id) REFERENCES teams(id),
      FOREIGN KEY (man_of_match_player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      runs INTEGER DEFAULT 0,
      balls INTEGER DEFAULT 0,
      fours INTEGER DEFAULT 0,
      sixes INTEGER DEFAULT 0,
      dismissal TEXT DEFAULT 'not out',
      overs_bowled TEXT DEFAULT '0',
      maidens INTEGER DEFAULT 0,
      runs_conceded INTEGER DEFAULT 0,
      wickets INTEGER DEFAULT 0,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE INDEX IF NOT EXISTS idx_teams_tournament_status ON teams(tournament_id, status);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_status ON matches(tournament_id, status);
  `);

  ensureColumn('teams', 'tournament_id', 'tournament_id INTEGER');
  ensureColumn('matches', 'tournament_id', 'tournament_id INTEGER');
  migratePlayerRoleConstraint();
  seedDb();
}

function ensureColumn(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === column);
  if (!exists) db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run();
}

function migratePlayerRoleConstraint() {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'players'").get();
  if (!row?.sql || row.sql.includes('Singles Player')) return;

  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE players_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Singles Player', 'Doubles Player', 'Captain')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
    INSERT INTO players_new (id, team_id, name, age, role)
    SELECT id, team_id, name, age, role FROM players;
    DROP TABLE players;
    ALTER TABLE players_new RENAME TO players;
    PRAGMA foreign_keys = ON;
  `);
}

function asJson(value) {
  return JSON.stringify(value || []);
}

function parseJson(value) {
  try {
    return JSON.parse(value || '[]');
  } catch (error) {
    return [];
  }
}

function decorateTournament(row) {
  if (!row) return null;
  return {
    ...row,
    rules: parseJson(row.rules_json),
    prizes: parseJson(row.prizes_json),
    is_featured: Boolean(row.is_featured)
  };
}

function tournamentPayload(overrides) {
  return {
    slug: overrides.slug,
    name: overrides.name,
    short_name: overrides.short_name,
    sport: overrides.sport || 'Cricket',
    format: overrides.format,
    description: overrides.description,
    start_date: overrides.start_date,
    end_date: overrides.end_date || overrides.start_date,
    registration_deadline: overrides.registration_deadline || overrides.start_date,
    venue: overrides.venue,
    city: overrides.city,
    reporting_time: overrides.reporting_time || '',
    registration_fee: Number(overrides.registration_fee || 0),
    min_players: Number(overrides.min_players || 8),
    max_players: Number(overrides.max_players || 11),
    max_teams: overrides.max_teams ? Number(overrides.max_teams) : null,
    status: overrides.status || 'open',
    banner_url: overrides.banner_url || '',
    accent_color: overrides.accent_color || '#f4a261',
    rules_json: asJson(overrides.rules),
    prizes_json: asJson(overrides.prizes),
    is_featured: overrides.is_featured ? 1 : 0
  };
}

function upsertTournament(payload) {
  db.prepare(`
    INSERT INTO tournaments (
      slug, name, short_name, sport, format, description, start_date, end_date,
      registration_deadline, venue, city, reporting_time, registration_fee,
      min_players, max_players, max_teams, status, banner_url, accent_color,
      rules_json, prizes_json, is_featured
    )
    VALUES (
      @slug, @name, @short_name, @sport, @format, @description, @start_date, @end_date,
      @registration_deadline, @venue, @city, @reporting_time, @registration_fee,
      @min_players, @max_players, @max_teams, @status, @banner_url, @accent_color,
      @rules_json, @prizes_json, @is_featured
    )
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name,
      sport = excluded.sport,
      format = excluded.format,
      description = excluded.description,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      registration_deadline = excluded.registration_deadline,
      venue = excluded.venue,
      city = excluded.city,
      reporting_time = excluded.reporting_time,
      registration_fee = excluded.registration_fee,
      min_players = excluded.min_players,
      max_players = excluded.max_players,
      max_teams = excluded.max_teams,
      status = excluded.status,
      banner_url = excluded.banner_url,
      accent_color = excluded.accent_color,
      rules_json = excluded.rules_json,
      prizes_json = excluded.prizes_json,
      is_featured = excluded.is_featured
  `).run(payload);

  return db.prepare('SELECT id FROM tournaments WHERE slug = ?').get(payload.slug).id;
}

function seedTournaments() {
  const venue = 'Crescent Park Road near Lord Krishna Swimming Pool, Jindal Public School, Lalkuan, NH024 Ghaziabad';
  const tournaments = {
    tpl: upsertTournament(tournamentPayload({
      slug: 'tpl-2026',
      name: 'Turf Premier League (TPL) Tournament 2026',
      short_name: 'TPL 2026',
      format: 'T10',
      description: 'An exclusive evening turf cricket tournament with eliminator-style matchups, 8-player squads, and fast 10-over innings.',
      start_date: '2026-06-28',
      end_date: '2026-06-28',
      registration_deadline: '2026-06-28',
      venue,
      city: 'Ghaziabad',
      reporting_time: '06:00 PM sharp',
      registration_fee: 2400,
      min_players: 8,
      max_players: 11,
      max_teams: 16,
      status: 'open',
      banner_url: '/assets/tpl-poster.png',
      accent_color: '#f4a261',
      is_featured: true,
      rules: [
        'Tennis ball used for all matches',
        'Plastic bats allowed',
        'Turf-friendly footwear only; no spikes',
        'A maximum of 1 bowler can deliver up to 3 overs'
      ],
      prizes: [
        { title: 'Winning Team', award: 'Trophy + medals + Rs 400 cash prize' },
        { title: 'Man of the Match', award: 'Trophy + Rs 200' },
        { title: 'Fighter of the Match', award: 'Trophy + Rs 100' }
      ]
    })),
    weekend: upsertTournament(tournamentPayload({
      slug: 'weekend-warriors-t10',
      name: 'Weekend Warriors T10 League',
      short_name: 'Warriors T10',
      format: 'T10',
      description: 'A Saturday night turf cricket league for local squads that want a compact, high-energy knockout bracket.',
      start_date: '2026-07-12',
      end_date: '2026-07-12',
      registration_deadline: '2026-07-10',
      venue: 'Global Sports Turf, Indirapuram, Ghaziabad',
      city: 'Ghaziabad',
      reporting_time: '05:30 PM',
      registration_fee: 2200,
      min_players: 8,
      max_players: 11,
      max_teams: 12,
      status: 'open',
      accent_color: '#52b788',
      rules: [
        'Tennis ball tournament',
        '8 players on field',
        'Powerplay first 2 overs',
        'Knockout matches after group qualifiers'
      ],
      prizes: [
        { title: 'Champion', award: 'Trophy + medals' },
        { title: 'Best Batter', award: 'Trophy' },
        { title: 'Best Bowler', award: 'Trophy' }
      ]
    })),
    corporate: upsertTournament(tournamentPayload({
      slug: 'corporate-turf-cup',
      name: 'Corporate Turf Cup',
      short_name: 'Corporate Cup',
      format: 'T8',
      description: 'A compact office-team cricket cup designed for companies, founders, and weekend community teams.',
      start_date: '2026-08-02',
      end_date: '2026-08-02',
      registration_deadline: '2026-07-28',
      venue: 'Crescent Corporate Turf, Noida Extension',
      city: 'Noida Extension',
      reporting_time: '04:30 PM',
      registration_fee: 3000,
      min_players: 8,
      max_players: 11,
      max_teams: 10,
      status: 'upcoming',
      accent_color: '#8ea0b8',
      rules: [
        'Company and mixed-community teams allowed',
        'Soft tennis ball matches',
        'Each innings capped at 8 overs'
      ],
      prizes: [
        { title: 'Winning Team', award: 'Corporate cup + medals' },
        { title: 'Player of the Tournament', award: 'Trophy' }
      ]
    })),
    badminton: upsertTournament(tournamentPayload({
      slug: 'smash-court-badminton-open',
      name: 'Smash Court Badminton Open',
      short_name: 'Smash Court Open',
      sport: 'Badminton',
      format: 'Singles + Doubles',
      description: 'A community badminton tournament with singles and doubles brackets, fast match scheduling, and open enrollment for local players.',
      start_date: '2026-07-19',
      end_date: '2026-07-19',
      registration_deadline: '2026-07-17',
      venue: 'Crescent Indoor Sports Arena, Ghaziabad',
      city: 'Ghaziabad',
      reporting_time: '09:00 AM',
      registration_fee: 800,
      min_players: 1,
      max_players: 2,
      max_teams: 32,
      status: 'open',
      accent_color: '#7dd3fc',
      rules: [
        'Singles and doubles entries are accepted',
        'Yonex Mavis 350 shuttle used for standard matches',
        'Best of 3 games to 15 points until semi finals',
        'Non-marking court shoes required'
      ],
      prizes: [
        { title: 'Singles Winner', award: 'Trophy + Rs 1000' },
        { title: 'Doubles Winner', award: 'Trophy + Rs 1500' },
        { title: 'Player of the Tournament', award: 'Medal + sports voucher' }
      ]
    }))
  };

  return tournaments;
}

function insertTeam(team) {
  return db.prepare(`
    INSERT INTO teams (tournament_id, name, captain_name, captain_phone, captain_email, city, logo_url, status)
    VALUES (@tournament_id, @name, @captain_name, @captain_phone, @captain_email, @city, @logo_url, @status)
  `).run(team).lastInsertRowid;
}

function insertPlayer(teamId, player) {
  return db.prepare(`
    INSERT INTO players (team_id, name, age, role)
    VALUES (?, ?, ?, ?)
  `).run(teamId, player.name, player.age, player.role).lastInsertRowid;
}

function seedSupplementalTeams(tournaments) {
  const teamExists = db.prepare('SELECT id FROM teams WHERE name = ? COLLATE NOCASE').get('Weekend Warriors');
  if (!teamExists) {
    const warriorsId = insertTeam({
      tournament_id: tournaments.weekend,
      name: 'Weekend Warriors',
      captain_name: 'Sahil Juneja',
      captain_phone: '9898989898',
      captain_email: 'sahil@weekendwarriors.test',
      city: 'Indirapuram',
      logo_url: '',
      status: 'approved'
    });
    const strikersId = insertTeam({
      tournament_id: tournaments.weekend,
      name: 'Night Strikers',
      captain_name: 'Ritvik Anand',
      captain_phone: '9787878787',
      captain_email: 'ritvik@nightstrikers.test',
      city: 'Vaishali',
      logo_url: '',
      status: 'approved'
    });

    [
      ['Sahil Juneja', 28, 'All-rounder'],
      ['Abhay Rathi', 25, 'Batsman'],
      ['Keshav Garg', 24, 'Bowler'],
      ['Pulkit Sood', 26, 'Wicket-keeper'],
      ['Samar Khurana', 27, 'Batsman'],
      ['Tejas Bahl', 23, 'Bowler'],
      ['Viren Mehta', 29, 'All-rounder'],
      ['Zaid Khan', 22, 'Batsman']
    ].forEach(([name, age, role]) => insertPlayer(warriorsId, { name, age, role }));

    [
      ['Ritvik Anand', 27, 'Batsman'],
      ['Aman Grewal', 24, 'Bowler'],
      ['Bhavya Jain', 28, 'All-rounder'],
      ['Chirag Bhatia', 23, 'Wicket-keeper'],
      ['Danish Ali', 25, 'Batsman'],
      ['Eshan Suri', 26, 'Bowler'],
      ['Farhan Qureshi', 29, 'All-rounder'],
      ['Gaurav Seth', 24, 'Batsman']
    ].forEach(([name, age, role]) => insertPlayer(strikersId, { name, age, role }));

    db.prepare(`
      INSERT INTO matches (tournament_id, team_a_id, team_b_id, date, time, venue, stage, status)
      VALUES (?, ?, ?, ?, ?, ?, 'group', 'upcoming')
    `).run(tournaments.weekend, warriorsId, strikersId, '2026-07-12', '19:00', 'Global Sports Turf, Indirapuram, Ghaziabad');
  }

  const corporateExists = db.prepare('SELECT id FROM teams WHERE name = ? COLLATE NOCASE').get('Office Smashers');
  if (!corporateExists) {
    const officeId = insertTeam({
      tournament_id: tournaments.corporate,
      name: 'Office Smashers',
      captain_name: 'Mehul Sikka',
      captain_phone: '9676767676',
      captain_email: 'mehul@officesmashers.test',
      city: 'Noida',
      logo_url: '',
      status: 'pending'
    });

    [
      ['Mehul Sikka', 31, 'All-rounder'],
      ['Nikhil Talwar', 29, 'Batsman'],
      ['Om Prakash', 30, 'Bowler'],
      ['Prateek Rao', 27, 'Wicket-keeper'],
      ['Rahul Kohli', 32, 'Batsman'],
      ['Siddharth Jain', 26, 'Bowler'],
      ['Tarun Grover', 28, 'All-rounder'],
      ['Utkarsh Mathur', 25, 'Batsman']
    ].forEach(([name, age, role]) => insertPlayer(officeId, { name, age, role }));
  }

  const badmintonExists = db.prepare('SELECT id FROM teams WHERE name = ? COLLATE NOCASE').get('Rally Kings');
  if (!badmintonExists) {
    const rallyKingsId = insertTeam({
      tournament_id: tournaments.badminton,
      name: 'Rally Kings',
      captain_name: 'Ira Sharma',
      captain_phone: '9565656565',
      captain_email: 'ira@rallykings.test',
      city: 'Ghaziabad',
      logo_url: '',
      status: 'approved'
    });
    const netNinjasId = insertTeam({
      tournament_id: tournaments.badminton,
      name: 'Net Ninjas',
      captain_name: 'Arnav Kapoor',
      captain_phone: '9454545454',
      captain_email: 'arnav@netninjas.test',
      city: 'Indirapuram',
      logo_url: '',
      status: 'approved'
    });
    const smashSistersId = insertTeam({
      tournament_id: tournaments.badminton,
      name: 'Smash Sisters',
      captain_name: 'Meera Gulati',
      captain_phone: '9343434343',
      captain_email: 'meera@smashsisters.test',
      city: 'Noida Extension',
      logo_url: '',
      status: 'pending'
    });

    [
      ['Ira Sharma', 24, 'Captain'],
      ['Rhea Bansal', 23, 'Doubles Player']
    ].forEach(([name, age, role]) => insertPlayer(rallyKingsId, { name, age, role }));

    [
      ['Arnav Kapoor', 26, 'Captain'],
      ['Neil Verma', 25, 'Doubles Player']
    ].forEach(([name, age, role]) => insertPlayer(netNinjasId, { name, age, role }));

    [
      ['Meera Gulati', 22, 'Captain'],
      ['Sara Kohli', 24, 'Doubles Player']
    ].forEach(([name, age, role]) => insertPlayer(smashSistersId, { name, age, role }));

    db.prepare(`
      INSERT INTO matches (tournament_id, team_a_id, team_b_id, date, time, venue, stage, status)
      VALUES (?, ?, ?, ?, ?, ?, 'group', 'upcoming')
    `).run(tournaments.badminton, rallyKingsId, netNinjasId, '2026-07-19', '10:00', 'Crescent Indoor Sports Arena, Ghaziabad');
  }
}

function seedDb() {
  const tournaments = seedTournaments();
  db.prepare('UPDATE teams SET tournament_id = ? WHERE tournament_id IS NULL').run(tournaments.tpl);
  db.prepare('UPDATE matches SET tournament_id = ? WHERE tournament_id IS NULL').run(tournaments.tpl);

  const teamCount = db.prepare('SELECT COUNT(*) AS count FROM teams').get().count;
  if (teamCount === 0) {
    const seed = db.transaction(() => {
      const venue = 'Crescent Park Road near Lord Krishna Swimming Pool, Jindal Public School, Lalkuan, NH024 Ghaziabad';

      const titansId = insertTeam({
        tournament_id: tournaments.tpl,
        name: 'TPL Titans',
        captain_name: 'Arjun Mehra',
        captain_phone: '9876543210',
        captain_email: 'arjun@tpltitans.test',
        city: 'Ghaziabad',
        logo_url: '',
        status: 'approved'
      });

      const heroesId = insertTeam({
        tournament_id: tournaments.tpl,
        name: 'Turf Heroes',
        captain_name: 'Kabir Saini',
        captain_phone: '9876501234',
        captain_email: 'kabir@turfheroes.test',
        city: 'Lalkuan',
        logo_url: '',
        status: 'approved'
      });

      const pendingId = insertTeam({
        tournament_id: tournaments.tpl,
        name: 'Crescent Challengers',
        captain_name: 'Rohit Bansal',
        captain_phone: '9811112233',
        captain_email: 'rohit@crescentchallengers.test',
        city: 'Noida Extension',
        logo_url: '',
        status: 'pending'
      });

      const titansPlayers = [
        ['Vihaan Rana', 24, 'Batsman'],
        ['Arjun Mehra', 29, 'All-rounder'],
        ['Dev Malik', 22, 'Bowler'],
        ['Ishaan Verma', 25, 'Wicket-keeper'],
        ['Manav Chauhan', 27, 'Batsman'],
        ['Neel Kapoor', 23, 'Bowler'],
        ['Raghav Tiwari', 28, 'All-rounder'],
        ['Yash Bedi', 21, 'Batsman']
      ].map(([name, age, role]) => ({ name, age, role }));

      const heroesPlayers = [
        ['Kabir Saini', 30, 'All-rounder'],
        ['Ayaan Khanna', 26, 'Batsman'],
        ['Lakshay Gaur', 24, 'Bowler'],
        ['Naman Joshi', 22, 'Wicket-keeper'],
        ['Parth Yadav', 28, 'Batsman'],
        ['Shaurya Gill', 23, 'Bowler'],
        ['Tanish Rawat', 25, 'All-rounder'],
        ['Zoravar Singh', 27, 'Batsman']
      ].map(([name, age, role]) => ({ name, age, role }));

      const pendingPlayers = [
        ['Aarav Batra', 23, 'Batsman'],
        ['Dhruv Madaan', 24, 'Bowler'],
        ['Kunal Dahiya', 26, 'All-rounder'],
        ['Mohit Narang', 25, 'Wicket-keeper'],
        ['Pranay Sethi', 22, 'Batsman'],
        ['Samar Arora', 28, 'Bowler'],
        ['Uday Nair', 21, 'Batsman'],
        ['Vivaan Anand', 27, 'All-rounder']
      ].map(([name, age, role]) => ({ name, age, role }));

      const playerIds = { titans: [], heroes: [], pending: [] };
      titansPlayers.forEach((player) => playerIds.titans.push(insertPlayer(titansId, player)));
      heroesPlayers.forEach((player) => playerIds.heroes.push(insertPlayer(heroesId, player)));
      pendingPlayers.forEach((player) => playerIds.pending.push(insertPlayer(pendingId, player)));

      const matchStmt = db.prepare(`
        INSERT INTO matches (tournament_id, team_a_id, team_b_id, date, time, venue, stage, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const completedMatchId = matchStmt.run(tournaments.tpl, titansId, heroesId, '2026-06-21', '19:00', venue, 'group', 'completed').lastInsertRowid;
      matchStmt.run(tournaments.tpl, titansId, heroesId, '2026-06-28', '18:30', venue, 'group', 'upcoming');
      matchStmt.run(tournaments.tpl, heroesId, titansId, '2026-06-28', '20:00', venue, 'semi', 'upcoming');
      matchStmt.run(tournaments.tpl, titansId, heroesId, '2026-06-28', '21:30', venue, 'final', 'upcoming');

      db.prepare(`
        INSERT INTO results (
          match_id, winner_id, team_a_score, team_a_wickets, team_a_overs,
          team_b_score, team_b_wickets, team_b_overs, man_of_match_player_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(completedMatchId, titansId, 96, 5, '10.0', 88, 7, '10.0', playerIds.titans[1]);

      const scorecardStmt = db.prepare(`
        INSERT INTO scorecards (
          match_id, team_id, player_id, runs, balls, fours, sixes, dismissal,
          overs_bowled, maidens, runs_conceded, wickets
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      [
        [titansId, playerIds.titans[0], 28, 17, 3, 1, 'c Naman b Lakshay', '0', 0, 0, 0],
        [titansId, playerIds.titans[1], 34, 20, 4, 1, 'not out', '3.0', 0, 24, 2],
        [titansId, playerIds.titans[2], 6, 5, 1, 0, 'b Shaurya', '3.0', 0, 21, 3],
        [titansId, playerIds.titans[3], 12, 8, 1, 0, 'run out', '0', 0, 0, 0],
        [titansId, playerIds.titans[4], 9, 6, 0, 1, 'c Parth b Kabir', '0', 0, 0, 0],
        [titansId, playerIds.titans[5], 2, 3, 0, 0, 'b Lakshay', '2.0', 0, 18, 1],
        [titansId, playerIds.titans[6], 3, 2, 0, 0, 'not out', '2.0', 0, 22, 1],
        [titansId, playerIds.titans[7], 0, 0, 0, 0, 'did not bat', '0', 0, 0, 0],
        [heroesId, playerIds.heroes[0], 30, 19, 3, 1, 'c Ishaan b Arjun', '3.0', 0, 25, 1],
        [heroesId, playerIds.heroes[1], 18, 13, 2, 0, 'b Dev', '0', 0, 0, 0],
        [heroesId, playerIds.heroes[2], 4, 5, 0, 0, 'c Manav b Arjun', '3.0', 0, 29, 2],
        [heroesId, playerIds.heroes[3], 11, 8, 1, 0, 'run out', '0', 0, 0, 0],
        [heroesId, playerIds.heroes[4], 15, 10, 1, 1, 'b Neel', '0', 0, 0, 0],
        [heroesId, playerIds.heroes[5], 5, 4, 1, 0, 'c Vihaan b Dev', '2.0', 0, 20, 1],
        [heroesId, playerIds.heroes[6], 3, 2, 0, 0, 'b Raghav', '2.0', 0, 18, 1],
        [heroesId, playerIds.heroes[7], 1, 1, 0, 0, 'not out', '0', 0, 0, 0]
      ].forEach((row) => scorecardStmt.run(completedMatchId, ...row));
    });

    seed();
  }

  seedSupplementalTeams(tournaments);
}

function oversToBalls(overs) {
  if (overs === null || overs === undefined || overs === '') return 0;
  const [whole = '0', balls = '0'] = String(overs).split('.');
  return (Number.parseInt(whole, 10) || 0) * 6 + (Number.parseInt(balls, 10) || 0);
}

function ballsToOvers(balls) {
  const completeOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return Number(`${completeOvers}.${remainingBalls}`);
}

function getTournaments() {
  return db.prepare(`
    SELECT
      tr.*,
      (SELECT COUNT(*) FROM teams t WHERE t.tournament_id = tr.id AND t.status = 'approved') AS approved_team_count,
      (SELECT COUNT(*) FROM teams t WHERE t.tournament_id = tr.id AND t.status = 'pending') AS pending_team_count,
      (SELECT COUNT(*) FROM matches m WHERE m.tournament_id = tr.id) AS match_count,
      (SELECT COUNT(*) FROM matches m WHERE m.tournament_id = tr.id AND m.status = 'completed') AS completed_match_count
    FROM tournaments tr
    ORDER BY tr.is_featured DESC, tr.start_date ASC, tr.id ASC
  `).all().map(decorateTournament);
}

function getTournament(identifier) {
  let row;
  if (!identifier) {
    row = db.prepare(`
      SELECT * FROM tournaments
      ORDER BY is_featured DESC, start_date ASC, id ASC
      LIMIT 1
    `).get();
  } else if (/^\d+$/.test(String(identifier))) {
    row = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(Number(identifier));
  } else {
    row = db.prepare('SELECT * FROM tournaments WHERE slug = ? COLLATE NOCASE').get(String(identifier));
  }
  return decorateTournament(row);
}

function createTournament(input) {
  const required = ['slug', 'name', 'short_name', 'format', 'description', 'start_date', 'venue', 'city'];
  const missing = required.find((key) => !String(input[key] || '').trim());
  if (missing) {
    throw Object.assign(new Error('Tournament slug, name, format, date, venue, and city are required.'), { status: 400 });
  }
  if (!VALID_TOURNAMENT_STATUSES.has(input.status || 'open')) {
    throw Object.assign(new Error('Invalid tournament status.'), { status: 400 });
  }
  return upsertTournament(tournamentPayload(input));
}

function getTournamentSummary(tournamentId) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return null;
  return {
    tournament,
    stats: {
      approvedTeams: db.prepare("SELECT COUNT(*) AS count FROM teams WHERE tournament_id = ? AND status = 'approved'").get(tournament.id).count,
      pendingTeams: db.prepare("SELECT COUNT(*) AS count FROM teams WHERE tournament_id = ? AND status = 'pending'").get(tournament.id).count,
      matches: db.prepare('SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ?').get(tournament.id).count,
      completedMatches: db.prepare("SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ? AND status = 'completed'").get(tournament.id).count
    }
  };
}

function getStandings(tournamentId) {
  const resolvedTournament = getTournament(tournamentId);
  if (!resolvedTournament) return [];

  const teams = db.prepare(`
    SELECT id, name, city
    FROM teams
    WHERE status = 'approved' AND tournament_id = ?
    ORDER BY name ASC
  `).all(resolvedTournament.id);

  const table = new Map();
  teams.forEach((team) => {
    table.set(team.id, {
      rank: 0,
      team_id: team.id,
      team: team.name,
      city: team.city,
      tournament_id: resolvedTournament.id,
      played: 0,
      won: 0,
      lost: 0,
      nr: 0,
      points: 0,
      runs_for: 0,
      balls_faced: 0,
      runs_against: 0,
      balls_bowled: 0,
      nrr: 0,
      eliminated: false
    });
  });

  const results = db.prepare(`
    SELECT
      m.team_a_id, m.team_b_id,
      r.winner_id,
      r.team_a_score, r.team_a_overs,
      r.team_b_score, r.team_b_overs
    FROM results r
    JOIN matches m ON m.id = r.match_id
    WHERE m.status = 'completed'
      AND m.tournament_id = ?
  `).all(resolvedTournament.id);

  results.forEach((result) => {
    const teamA = table.get(result.team_a_id);
    const teamB = table.get(result.team_b_id);
    if (!teamA || !teamB) return;

    const teamABalls = oversToBalls(result.team_a_overs);
    const teamBBalls = oversToBalls(result.team_b_overs);

    teamA.played += 1;
    teamB.played += 1;

    teamA.runs_for += result.team_a_score;
    teamA.balls_faced += teamABalls;
    teamA.runs_against += result.team_b_score;
    teamA.balls_bowled += teamBBalls;

    teamB.runs_for += result.team_b_score;
    teamB.balls_faced += teamBBalls;
    teamB.runs_against += result.team_a_score;
    teamB.balls_bowled += teamABalls;

    if (result.winner_id === result.team_a_id) {
      teamA.won += 1;
      teamB.lost += 1;
    } else if (result.winner_id === result.team_b_id) {
      teamB.won += 1;
      teamA.lost += 1;
    } else {
      teamA.nr += 1;
      teamB.nr += 1;
    }
  });

  const standings = Array.from(table.values()).map((team) => {
    team.points = team.won * 2 + team.nr;
    const runRateFor = team.balls_faced > 0 ? team.runs_for / (team.balls_faced / 6) : 0;
    const runRateAgainst = team.balls_bowled > 0 ? team.runs_against / (team.balls_bowled / 6) : 0;
    team.nrr = Number((runRateFor - runRateAgainst).toFixed(3));
    team.overs_faced = ballsToOvers(team.balls_faced);
    team.overs_bowled = ballsToOvers(team.balls_bowled);
    return team;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    if (b.won !== a.won) return b.won - a.won;
    return a.team.localeCompare(b.team);
  });

  standings.forEach((team, index) => {
    team.rank = index + 1;
    team.eliminated = index >= 4;
  });

  return standings;
}

module.exports = {
  createTournament,
  db,
  getStandings,
  getTournament,
  getTournamentSummary,
  getTournaments,
  initDb,
  VALID_ROLES,
  VALID_TOURNAMENT_STATUSES
};
