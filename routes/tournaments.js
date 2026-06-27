const express = require('express');
const { getTournament, getTournaments, getTournamentSummary } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getTournaments());
});

router.get('/featured', (req, res) => {
  const tournament = getTournament();
  if (!tournament) return res.status(404).json({ error: 'Tournament not found.' });
  res.json(tournament);
});

router.get('/:identifier', (req, res) => {
  const summary = getTournamentSummary(req.params.identifier);
  if (!summary) return res.status(404).json({ error: 'Tournament not found.' });
  res.json(summary);
});

module.exports = router;
