const crypto = require('crypto');
const express = require('express');
const { createTournament, db, getTournament, getTournaments } = require('../database');

const router = express.Router();
const sessions = new Map();

function getToken(req) {
  const auth = req.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return req.get('x-admin-token') || '';
}

function requireAdmin(req, res, next) {
  const token = getToken(req);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Admin login required.' });
  }
  session.expiresAt = Date.now() + 1000 * 60 * 60 * 6;
  next();
}

function cleanMatchPayload(body, current = {}) {
  return {
    tournament_id: Number(body.tournament_id ?? body.tournamentId ?? current.tournament_id),
    team_a_id: Number(body.team_a_id ?? current.team_a_id),
    team_b_id: Number(body.team_b_id ?? current.team_b_id),
    date: String(body.date ?? current.date ?? '').trim(),
    time: String(body.time ?? current.time ?? '').trim(),
    venue: String(body.venue ?? current.venue ?? '').trim(),
    stage: String(body.stage ?? current.stage ?? 'group').trim(),
    status: String(body.status ?? current.status ?? 'upcoming').trim()
  };
}

function validateMatchPayload(payload) {
  const validStages = new Set(['group', 'quarter', 'semi', 'final']);
  const validStatuses = new Set(['upcoming', 'live', 'completed']);

  if (!payload.tournament_id) {
    return 'Choose a tournament.';
  }
  if (!payload.team_a_id || !payload.team_b_id || payload.team_a_id === payload.team_b_id) {
    return 'Choose two different teams.';
  }
  if (!payload.date || !payload.time || !payload.venue) {
    return 'Date, time, and venue are required.';
  }
  if (!validStages.has(payload.stage) || !validStatuses.has(payload.status)) {
    return 'Invalid match stage or status.';
  }

  const teams = db.prepare(`
    SELECT id, tournament_id
    FROM teams
    WHERE id IN (?, ?)
      AND status = 'approved'
  `).all(payload.team_a_id, payload.team_b_id);

  if (teams.length !== 2 || teams.some((team) => team.tournament_id !== payload.tournament_id)) {
    return 'Both teams must be approved in the selected tournament.';
  }

  return '';
}

function upsertResult(matchId, body) {
  const result = body.result || body;
  const hasResult = result.winner_id || result.team_a_score !== undefined || result.team_b_score !== undefined;
  if (!hasResult) return;

  const match = db.prepare('SELECT team_a_id, team_b_id FROM matches WHERE id = ?').get(matchId);
  const winnerId = Number(result.winner_id);
  if (!match || ![match.team_a_id, match.team_b_id].includes(winnerId)) {
    throw Object.assign(new Error('Winner must be one of the match teams.'), { status: 400 });
  }

  const values = {
    match_id: Number(matchId),
    winner_id: winnerId,
    team_a_score: Number(result.team_a_score),
    team_a_wickets: Number(result.team_a_wickets),
    team_a_overs: String(result.team_a_overs || '').trim(),
    team_b_score: Number(result.team_b_score),
    team_b_wickets: Number(result.team_b_wickets),
    team_b_overs: String(result.team_b_overs || '').trim(),
    man_of_match_player_id: result.man_of_match_player_id ? Number(result.man_of_match_player_id) : null
  };

  if (!values.winner_id || Number.isNaN(values.team_a_score) || Number.isNaN(values.team_b_score)) {
    throw Object.assign(new Error('Winner and scores are required to save a result.'), { status: 400 });
  }

  db.prepare(`
    INSERT INTO results (
      match_id, winner_id, team_a_score, team_a_wickets, team_a_overs,
      team_b_score, team_b_wickets, team_b_overs, man_of_match_player_id
    )
    VALUES (
      @match_id, @winner_id, @team_a_score, @team_a_wickets, @team_a_overs,
      @team_b_score, @team_b_wickets, @team_b_overs, @man_of_match_player_id
    )
    ON CONFLICT(match_id) DO UPDATE SET
      winner_id = excluded.winner_id,
      team_a_score = excluded.team_a_score,
      team_a_wickets = excluded.team_a_wickets,
      team_a_overs = excluded.team_a_overs,
      team_b_score = excluded.team_b_score,
      team_b_wickets = excluded.team_b_wickets,
      team_b_overs = excluded.team_b_overs,
      man_of_match_player_id = excluded.man_of_match_player_id
  `).run(values);

  if (Array.isArray(body.scorecards)) {
    db.prepare('DELETE FROM scorecards WHERE match_id = ?').run(matchId);
    const insertScorecard = db.prepare(`
      INSERT INTO scorecards (
        match_id, team_id, player_id, runs, balls, fours, sixes, dismissal,
        overs_bowled, maidens, runs_conceded, wickets
      )
      VALUES (
        @match_id, @team_id, @player_id, @runs, @balls, @fours, @sixes, @dismissal,
        @overs_bowled, @maidens, @runs_conceded, @wickets
      )
    `);

    body.scorecards.forEach((row) => {
      insertScorecard.run({
        match_id: Number(matchId),
        team_id: Number(row.team_id),
        player_id: Number(row.player_id),
        runs: Number(row.runs || 0),
        balls: Number(row.balls || 0),
        fours: Number(row.fours || 0),
        sixes: Number(row.sixes || 0),
        dismissal: String(row.dismissal || 'not out'),
        overs_bowled: String(row.overs_bowled || '0'),
        maidens: Number(row.maidens || 0),
        runs_conceded: Number(row.runs_conceded || 0),
        wickets: Number(row.wickets || 0)
      });
    });
  }

  db.prepare("UPDATE matches SET status = 'completed' WHERE id = ?").run(matchId);
}

router.post('/login', (req, res) => {
  const password = String(req.body.password || '');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + 1000 * 60 * 60 * 6 });
  res.json({ token });
});

router.get('/tournaments', requireAdmin, (req, res) => {
  res.json(getTournaments());
});

router.post('/tournaments', requireAdmin, (req, res) => {
  try {
    const tournamentId = createTournament(req.body);
    res.status(201).json({ tournamentId });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/teams', requireAdmin, (req, res) => {
  const teams = db.prepare(`
    SELECT
      t.*,
      tr.name AS tournament_name,
      tr.slug AS tournament_slug,
      tr.short_name AS tournament_short_name,
      (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS player_count
    FROM teams t
    JOIN tournaments tr ON tr.id = t.tournament_id
    ORDER BY
      CASE t.status WHEN 'pending' THEN 0 ELSE 1 END,
      tr.start_date ASC,
      t.created_at DESC
  `).all();

  res.json(teams);
});

router.get('/export', requireAdmin, (req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    tournaments: db.prepare('SELECT * FROM tournaments ORDER BY id').all(),
    teams: db.prepare('SELECT * FROM teams ORDER BY tournament_id, id').all(),
    players: db.prepare('SELECT * FROM players ORDER BY team_id, id').all(),
    matches: db.prepare('SELECT * FROM matches ORDER BY tournament_id, date, time, id').all(),
    results: db.prepare('SELECT * FROM results ORDER BY match_id').all(),
    scorecards: db.prepare('SELECT * FROM scorecards ORDER BY match_id, team_id, id').all()
  });
});

router.post('/matches', requireAdmin, (req, res) => {
  const payload = cleanMatchPayload(req.body);
  const tournament = getTournament(payload.tournament_id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found.' });

  const error = validateMatchPayload(payload);
  if (error) return res.status(400).json({ error });

  const matchId = db.prepare(`
    INSERT INTO matches (tournament_id, team_a_id, team_b_id, date, time, venue, stage, status)
    VALUES (@tournament_id, @team_a_id, @team_b_id, @date, @time, @venue, @stage, @status)
  `).run(payload).lastInsertRowid;

  res.status(201).json({ matchId });
});

router.put('/matches/:id', requireAdmin, (req, res) => {
  const current = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Match not found.' });

  const payload = cleanMatchPayload(req.body, current);
  const tournament = getTournament(payload.tournament_id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found.' });

  const error = validateMatchPayload(payload);
  if (error) return res.status(400).json({ error });

  const updateMatch = db.transaction(() => {
    db.prepare(`
      UPDATE matches
      SET tournament_id = @tournament_id,
          team_a_id = @team_a_id,
          team_b_id = @team_b_id,
          date = @date,
          time = @time,
          venue = @venue,
          stage = @stage,
          status = @status
      WHERE id = @id
    `).run({ ...payload, id: Number(req.params.id) });

    upsertResult(req.params.id, req.body);
  });

  updateMatch();
  res.json({ matchId: Number(req.params.id) });
});

router.post('/teams/:id/approve', requireAdmin, (req, res) => {
  const result = db.prepare("UPDATE teams SET status = 'approved' WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Team not found.' });
  res.json({ teamId: Number(req.params.id), status: 'approved' });
});

router.delete('/teams/:id', requireAdmin, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Team not found.' });
    res.json({ deleted: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(409).json({ error: 'This team is already attached to matches and cannot be deleted.' });
    }
    throw error;
  }
});

module.exports = router;
