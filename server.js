require('dotenv').config();

const path = require('path');
const express = require('express');
const { getStandings, getTournament, getTournaments, initDb } = require('./database');

const tournamentsRouter = require('./routes/tournaments');
const teamsRouter = require('./routes/teams');
const matchesRouter = require('./routes/matches');
const playersRouter = require('./routes/players');
const adminRouter = require('./routes/admin');

initDb();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  const featuredTournament = getTournament();
  res.json({
    platformName: process.env.PLATFORM_NAME || 'Sports Arena Tournaments',
    platformTagline: 'Discover, enroll, and follow local turf cricket and badminton tournaments.',
    tournamentName: featuredTournament?.name || process.env.TOURNAMENT_NAME || 'Turf Premier League (TPL) Tournament 2026',
    tournamentStartDate: featuredTournament?.start_date || process.env.TOURNAMENT_START_DATE || '2026-06-28',
    venue: featuredTournament?.venue || process.env.TOURNAMENT_VENUE || 'Crescent Park Road near Lord Krishna Swimming Pool, Jindal Public School, Lalkuan, NH024 Ghaziabad',
    reportingTime: featuredTournament?.reporting_time || process.env.TOURNAMENT_REPORTING_TIME || '06:00 PM sharp',
    registrationFee: featuredTournament?.registration_fee || Number(process.env.REGISTRATION_FEE) || 2400,
    featuredTournament,
    tournaments: getTournaments()
  });
});

app.use('/api/tournaments', tournamentsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/players', playersRouter);
app.get('/api/standings', (req, res) => {
  res.json(getStandings(req.query.tournament_id || req.query.tournament));
});
app.use('/api/admin', adminRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(port, () => {
  console.log(`Tournament platform running at http://localhost:${port}`);
});
