const express = require('express');
const { db, getTournament, VALID_ROLES } = require('../database');

const router = express.Router();

function resolveTournament(req) {
  const identifier = req.body.tournamentId || req.body.tournament_id || req.body.tournamentSlug || req.query.tournament_id || req.query.tournament;
  const tournament = getTournament(identifier);
  if (!tournament) {
    throw Object.assign(new Error('Tournament not found.'), { status: 404 });
  }
  return tournament;
}

function publicTeamSelect(whereClause = "t.status = 'approved'") {
  return `
    SELECT
      t.*,
      tr.name AS tournament_name,
      tr.slug AS tournament_slug,
      tr.short_name AS tournament_short_name,
      tr.sport AS tournament_sport,
      tr.format AS tournament_format,
      (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS player_count,
      (
        SELECT COUNT(*)
        FROM results r
        JOIN matches m ON m.id = r.match_id
        WHERE r.winner_id = t.id
          AND m.tournament_id = t.tournament_id
      ) AS wins,
      (
        SELECT COUNT(*)
        FROM results r
        JOIN matches m ON m.id = r.match_id
        WHERE (m.team_a_id = t.id OR m.team_b_id = t.id)
          AND r.winner_id != t.id
          AND m.tournament_id = t.tournament_id
      ) AS losses
    FROM teams t
    JOIN tournaments tr ON tr.id = t.tournament_id
    WHERE ${whereClause}
  `;
}

router.get('/', (req, res) => {
  const tournamentIdentifier = req.query.tournament_id || req.query.tournament;
  const params = [];
  let whereClause = "t.status = 'approved'";

  if (tournamentIdentifier) {
    const tournament = getTournament(tournamentIdentifier);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found.' });
    whereClause += ' AND t.tournament_id = ?';
    params.push(tournament.id);
  }

  const teams = db.prepare(`${publicTeamSelect(whereClause)} ORDER BY tr.start_date ASC, t.name ASC`).all(...params);
  res.json(teams);
});

router.post('/register', (req, res) => {
  const {
    teamName,
    captainName,
    captainPhone,
    captainEmail,
    city,
    logoUrl = '',
    players = []
  } = req.body;

  let tournament;
  try {
    tournament = resolveTournament(req);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  if (!['open', 'upcoming', 'live'].includes(tournament.status)) {
    return res.status(400).json({ error: 'Enrollment is closed for this tournament.' });
  }

  if (!teamName || !captainName || !captainPhone || !captainEmail || !city) {
    return res.status(400).json({ error: 'Team and captain details are required.' });
  }

  if (!Array.isArray(players) || players.length < tournament.min_players || players.length > tournament.max_players) {
    return res.status(400).json({ error: `Register between ${tournament.min_players} and ${tournament.max_players} players.` });
  }

  const normalizedPlayers = players.map((player) => ({
    name: String(player.name || '').trim(),
    age: Number(player.age),
    role: String(player.role || '').trim()
  }));

  const invalidPlayer = normalizedPlayers.find((player) => (
    !player.name || !Number.isInteger(player.age) || player.age < 12 || player.age > 70 || !VALID_ROLES.has(player.role)
  ));

  if (invalidPlayer) {
    return res.status(400).json({ error: 'Every player needs a valid name, age, and role.' });
  }

  const duplicate = db.prepare(`
    SELECT id
    FROM teams
    WHERE tournament_id = ?
      AND name = ? COLLATE NOCASE
  `).get(tournament.id, teamName.trim());

  if (duplicate) {
    return res.status(409).json({ error: 'A team with this name is already registered for this tournament.' });
  }

  const registerTeam = db.transaction(() => {
    const teamId = db.prepare(`
      INSERT INTO teams (tournament_id, name, captain_name, captain_phone, captain_email, city, logo_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      tournament.id,
      teamName.trim(),
      captainName.trim(),
      captainPhone.trim(),
      captainEmail.trim(),
      city.trim(),
      String(logoUrl || '').trim()
    ).lastInsertRowid;

    const insertPlayer = db.prepare(`
      INSERT INTO players (team_id, name, age, role)
      VALUES (?, ?, ?, ?)
    `);

    normalizedPlayers.forEach((player) => {
      insertPlayer.run(teamId, player.name, player.age, player.role);
    });

    return teamId;
  });

  try {
    const teamId = registerTeam();
    res.status(201).json({ teamId, tournamentId: tournament.id, tournament: tournament.short_name, status: 'pending' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'A team with this name is already registered.' });
    }
    throw error;
  }
});

router.get('/:id', (req, res) => {
  const team = db.prepare(`${publicTeamSelect("t.id = ? AND t.status = 'approved'")}`).get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found.' });

  team.players = db.prepare(`
    SELECT id, name, age, role
    FROM players
    WHERE team_id = ?
    ORDER BY id ASC
  `).all(team.id);

  res.json(team);
});

module.exports = router;
