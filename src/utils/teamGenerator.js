/**
 * @typedef {{ name: string, photo: string, position: string, [key: string]: any }} Player
 */

export { FORMATIONS, DEFAULT_FORMATION, generateTeamForFormation } from './formations';

/**
 * Shuffles an array copy using the Fisher-Yates algorithm.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks `n` random players from `pool` (without replacement).
 * @param {Player[]} pool
 * @param {number} n
 * @returns {Player[]}
 */
function pickRandom(pool, n) {
  return shuffle(pool).slice(0, n);
}

/**
 * Builds an 11-player team for the given formation slots, picking random
 * players from the appropriate position pool for each slot.
 *
 * @param {Player[]} players - Full list of available players.
 * @param {Array<{ position: string, count: number }>} [slots] - Formation slots.
 *        Defaults to a 4-4-2 layout when omitted.
 * @returns {Player[]} Ordered array matching the formation's row layout.
 */
export function generateRandomTeam(players, slots) {
  const resolvedSlots = slots ?? [
    { position: 'Attacker',   count: 2 },
    { position: 'Midfielder', count: 4 },
    { position: 'Defender',   count: 4 },
    { position: 'Goalkeeper', count: 1 },
  ];

  // Pre-bucket and shuffle each position pool once
  const byPosition = {};
  for (const { position } of resolvedSlots) {
    if (!byPosition[position]) {
      byPosition[position] = shuffle(
        players.filter((p) => p.position === position)
      );
    }
  }

  // Track how many we've consumed per position to avoid duplicates across slots
  const used = {};
  const result = [];
  for (const { position, count } of resolvedSlots) {
    if (!used[position]) used[position] = 0;
    const pool = byPosition[position];
    result.push(...pool.slice(used[position], used[position] + count));
    used[position] += count;
  }

  return result;
}
