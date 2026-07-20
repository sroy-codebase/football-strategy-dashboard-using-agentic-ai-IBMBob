require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;
const SEASON = 2023;
const PREMIER_LEAGUE_ID = 39;
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'players.json');

// Top Premier League teams with their API-Football team IDs
const TEAMS = [
  { id: 50,  name: 'Manchester City' },
  { id: 33,  name: 'Manchester United' },
  { id: 40,  name: 'Liverpool' },
  { id: 42,  name: 'Arsenal' },
  { id: 49,  name: 'Chelsea' },
  { id: 47,  name: 'Tottenham' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchTeamPlayers(team) {
  const url = `${API_BASE}/players?team=${team.id}&season=${SEASON}`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching team ${team.name}`);
  }

  const data = await response.json();

  if (!data.response || !Array.isArray(data.response)) {
    throw new Error(`Unexpected response shape for team ${team.name}`);
  }

  return data.response;
}

function extractPlayer(entry) {
  const { player, statistics } = entry;

  if (!statistics || statistics.length === 0) return null;

  // Filter for Premier League stats only
  const plStats = statistics.find((s) => s.league && s.league.id === PREMIER_LEAGUE_ID);
  if (!plStats) return null;

  const rating = plStats.games && plStats.games.rating
    ? parseFloat(plStats.games.rating)
    : null;

  const heightRaw = player.height || '';
  const height = parseInt(heightRaw.replace(/\D/g, ''), 10) || null;

 /*  return {
    name: player.name,
    photo: player.photo,
    position: plStats.games.position || null,
    age: player.age,
    citizenship: player.nationality,
    height,
    club: plStats.team ? plStats.team.name : null,
    rating,
  }; */


  return {
  player_name: player.name,
  name: player.name,

  photo: player.photo,
  position: plStats.games.position || null,
  age: player.age,
  citizenship: player.nationality,
  height,

  current_club_name: plStats.team ? plStats.team.name : null,
  club: plStats.team ? plStats.team.name : null,

  form_rating: rating,
  rating,
};
}

async function main() {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    console.error('ERROR: API_FOOTBALL_KEY is not set in your .env file.');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  const allPlayers = [];

  for (const team of TEAMS) {
    console.log(`Fetching players for ${team.name} (team ID ${team.id})...`);
    const entries = await fetchTeamPlayers(team);
    console.log(`  → ${entries.length} players received`);
    allPlayers.push(...entries);
    await delay(500);
  }

  console.log(`\nTotal players fetched (with duplicates): ${allPlayers.length}`);

  // Extract + filter players without PL stats
  const extracted = allPlayers
    .map(extractPlayer)
    .filter(Boolean);

  // Remove duplicates by player name (keep first occurrence)
  const seen = new Set();
  const unique = extracted.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  console.log(`After removing duplicates: ${unique.length} players`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2));
  console.log(`\n✓ Saved ${unique.length} players to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
