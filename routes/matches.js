const express = require('express');
const { db, getTournament } = require('../database');

const router = express.Router();

const matchSelect = `
  SELECT
    m.*,
    tr.name AS tournament_name,
    tr.slug AS tournament_slug,
    tr.short_name AS tournament_short_name,
    tr.sport AS tournament_sport,
    tr.format AS tournament_format,
    ta.name AS team_a_name,
    tb.name AS team_b_name,
    r.winner_id,
    winner.name AS winner_name,
    r.team_a_score,
    r.team_a_wickets,
    r.team_a_overs,
    r.team_b_score,
    r.team_b_wickets,
    r.team_b_overs,
    r.man_of_match_player_id,
    mom.name AS man_of_match
  FROM matches m
  JOIN tournaments tr ON tr.id = m.tournament_id
  JOIN teams ta ON ta.id = m.team_a_id
  JOIN teams tb ON tb.id = m.team_b_id
  LEFT JOIN results r ON r.match_id = m.id
  LEFT JOIN teams winner ON winner.id = r.winner_id
  LEFT JOIN players mom ON mom.id = r.man_of_match_player_id
`;

function tournamentFilter(req) {
  const tournamentIdentifier = req.query.tournament_id || req.query.tournament;
  if (!tournamentIdentifier) return { clause: '', params: [] };
  const tournament = getTournament(tournamentIdentifier);
  if (!tournament) {
    throw Object.assign(new Error('Tournament not found.'), { status: 404 });
  }
  return { clause: 'm.tournament_id = ?', params: [tournament.id] };
}

function listMatches(req, baseClause, sort = 'm.date ASC, m.time ASC, m.id ASC') {
  const filter = tournamentFilter(req);
  const clauses = [baseClause, filter.clause].filter(Boolean);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.prepare(`${matchSelect} ${where} ORDER BY ${sort}`).all(...filter.params);
}

router.get('/', (req, res) => {
  try {
    res.json(listMatches(req));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/upcoming', (req, res) => {
  try {
    res.json(listMatches(req, "m.status IN ('upcoming', 'live')"));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/results', (req, res) => {
  try {
    res.json(listMatches(req, "m.status = 'completed'", 'm.date DESC, m.time DESC, m.id DESC'));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  const match = db.prepare(`${matchSelect} WHERE m.id = ?`).get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found.' });

  match.scorecards = db.prepare(`
    SELECT
      sc.*,
      t.name AS team_name,
      p.name AS player_name,
      p.role AS player_role
    FROM scorecards sc
    JOIN teams t ON t.id = sc.team_id
    JOIN players p ON p.id = sc.player_id
    WHERE sc.match_id = ?
    ORDER BY sc.team_id ASC, sc.id ASC
  `).all(match.id);

  res.json(match);
});

module.exports = router;
