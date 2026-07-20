/**
 * @typedef {{ label: string, count: number, startIndex: number }} FormationRow
 *
 * @typedef {{
 *   key:         string,
 *   label:       string,
 *   description: string,
 *   rows:        FormationRow[],
 *   shirtNumbers: number[],
 *   slots: Array<{ position: string, count: number }>
 * }} Formation
 */

/**
 * All supported tactical formations.
 * `rows`  — drives FormationBoard layout (top-to-bottom: FWD rows first, GK last).
 * `slots` — position buckets used by the team generator (same top-to-bottom order).
 * `shirtNumbers` — parallel to the flattened player array: index 0 = first FWD, etc.
 */
export const FORMATIONS = [
  {
    key: '4-4-2',
    label: '4-4-2',
    description: 'Classic flat midfield',
    rows: [
      { label: 'FWD', count: 2, startIndex: 0  },
      { label: 'MID', count: 4, startIndex: 2  },
      { label: 'DEF', count: 4, startIndex: 6  },
      { label: 'GK',  count: 1, startIndex: 10 },
    ],
    shirtNumbers: [10, 11, 6, 7, 8, 9, 2, 3, 4, 5, 1],
    slots: [
      { position: 'Attacker',   count: 2 },
      { position: 'Midfielder', count: 4 },
      { position: 'Defender',   count: 4 },
      { position: 'Goalkeeper', count: 1 },
    ],
  },
  {
    key: '4-3-3',
    label: '4-3-3',
    description: 'Attacking wide play',
    rows: [
      { label: 'FWD', count: 3, startIndex: 0  },
      { label: 'MID', count: 3, startIndex: 3  },
      { label: 'DEF', count: 4, startIndex: 6  },
      { label: 'GK',  count: 1, startIndex: 10 },
    ],
    shirtNumbers: [9, 10, 11, 6, 7, 8, 2, 3, 4, 5, 1],
    slots: [
      { position: 'Attacker',   count: 3 },
      { position: 'Midfielder', count: 3 },
      { position: 'Defender',   count: 4 },
      { position: 'Goalkeeper', count: 1 },
    ],
  },
  {
    key: '3-5-2',
    label: '3-5-2',
    description: 'Wing-backs with double pivot',
    rows: [
      { label: 'FWD', count: 2, startIndex: 0  },
      { label: 'MID', count: 5, startIndex: 2  },
      { label: 'DEF', count: 3, startIndex: 7  },
      { label: 'GK',  count: 1, startIndex: 10 },
    ],
    shirtNumbers: [10, 11, 6, 7, 8, 9, 5, 2, 3, 4, 1],
    slots: [
      { position: 'Attacker',   count: 2 },
      { position: 'Midfielder', count: 5 },
      { position: 'Defender',   count: 3 },
      { position: 'Goalkeeper', count: 1 },
    ],
  },
  {
    key: '4-2-3-1',
    label: '4-2-3-1',
    description: 'Double pivot with a number 10',
    rows: [
      { label: 'ST',  count: 1, startIndex: 0  },
      { label: 'CAM', count: 3, startIndex: 1  },
      { label: 'CDM', count: 2, startIndex: 4  },
      { label: 'DEF', count: 4, startIndex: 6  },
      { label: 'GK',  count: 1, startIndex: 10 },
    ],
    shirtNumbers: [9, 10, 7, 11, 6, 8, 2, 3, 4, 5, 1],
    slots: [
      { position: 'Attacker',   count: 1 },
      { position: 'Attacker',   count: 3 },   // attacking mids treated as attackers
      { position: 'Midfielder', count: 2 },
      { position: 'Defender',   count: 4 },
      { position: 'Goalkeeper', count: 1 },
    ],
  },
  {
    key: '3-4-3',
    label: '3-4-3',
    description: 'High press, three at the back',
    rows: [
      { label: 'FWD', count: 3, startIndex: 0  },
      { label: 'MID', count: 4, startIndex: 3  },
      { label: 'DEF', count: 3, startIndex: 7  },
      { label: 'GK',  count: 1, startIndex: 10 },
    ],
    shirtNumbers: [9, 10, 11, 6, 7, 8, 5, 2, 3, 4, 1],
    slots: [
      { position: 'Attacker',   count: 3 },
      { position: 'Midfielder', count: 4 },
      { position: 'Defender',   count: 3 },
      { position: 'Goalkeeper', count: 1 },
    ],
  },
  {
    key: '5-3-2',
    label: '5-3-2',
    description: 'Compact defensive block',
    rows: [
      { label: 'FWD', count: 2, startIndex: 0  },
      { label: 'MID', count: 3, startIndex: 2  },
      { label: 'DEF', count: 5, startIndex: 5  },
      { label: 'GK',  count: 1, startIndex: 10 },
    ],
    shirtNumbers: [10, 11, 6, 7, 8, 2, 3, 4, 5, 9, 1],
    slots: [
      { position: 'Attacker',   count: 2 },
      { position: 'Midfielder', count: 3 },
      { position: 'Defender',   count: 5 },
      { position: 'Goalkeeper', count: 1 },
    ],
  },
];

/** Default formation used when none is specified. */
export const DEFAULT_FORMATION = FORMATIONS[0];

/**
 * Builds an 11-player team for the given formation, picking random players
 * from the appropriate position pool for each slot.
 *
 * @param {import('./teamGenerator').Player[]} players
 * @param {Formation} formation
 * @returns {import('./teamGenerator').Player[]}
 */
export function generateTeamForFormation(players, formation) {
  // Pre-bucket players by position
  const byPos = {};
  for (const { position } of formation.slots) {
    if (!byPos[position]) {
      byPos[position] = shuffle(players.filter((p) => p.position === position));
    }
  }

  // Track how many we have already picked per position to avoid duplicates
  const used = {};
  const result = [];

  for (const { position, count } of formation.slots) {
    if (!used[position]) used[position] = 0;
    const pool = byPos[position];
    const slice = pool.slice(used[position], used[position] + count);
    used[position] += count;
    result.push(...slice);
  }

  return result;
}

// ─── Private ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
