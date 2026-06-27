const express = require('express');
const { db, getTournament } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const tournamentIdentifier = req.query.tournament_id || req.query.tournament;
  const params = [];
  let tournamentWhere = '';

  if (tournamentIdentifier) {
    const tournament = getTournament(tournamentIdentifier);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found.' });
    tournamentWhere = 'AND t.tournament_id = ?';
    params.push(tournament.id);
  }

  const players = db.prepare(`
    SELECT p.*, t.name AS team_name
    FROM players p
    JOIN teams t ON t.id = p.team_id
    WHERE t.status = 'approved'
      ${tournamentWhere}
    ORDER BY t.name ASC, p.name ASC
  `).all(...params);
  res.json(players);
});

router.get('/team/:teamId', (req, res) => {
  const players = db.prepare(`
    SELECT p.*, t.name AS team_name
    FROM players p
    JOIN teams t ON t.id = p.team_id
    WHERE p.team_id = ?
    ORDER BY p.name ASC
  `).all(req.params.teamId);
  res.json(players);
});

module.exports = router;
