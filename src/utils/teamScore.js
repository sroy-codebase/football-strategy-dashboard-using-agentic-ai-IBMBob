/**
 * @typedef {{ position: string, form_rating: number|null, rating: number|null }} ScoredPlayer
 *
 * @typedef {{
 *   finalScore:    number,
 *   averageForm:   number,
 *   balanceBonus:  number,
 *   stars:         number,
 *   label:         string,
 *   color:         'green' | 'blue' | 'yellow' | 'red',
 * }} TeamScoreResult
 */

// ─── Step 1: average form rating ─────────────────────────────────────────────
/**
 * @param {ScoredPlayer[]} players
 * @returns {number}  0–10
 */
function calcAverageForm(players) {
  const rated = players.filter((p) => {
    const v = p.form_rating ?? p.rating;
    return v != null && !isNaN(Number(v));
  });
  if (rated.length === 0) return 0;
  const sum = rated.reduce((acc, p) => acc + Number(p.form_rating ?? p.rating), 0);
  return sum / rated.length;
}

// ─── Step 2: formation balance bonus ─────────────────────────────────────────
/**
 * @param {ScoredPlayer[]} players
 * @returns {number}  0–40
 */
function calcBalanceBonus(players) {
  const counts = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Attacker: 0 };
  for (const p of players) {
    if (p.position in counts) counts[p.position]++;
  }

  const gkBonus  = counts.Goalkeeper === 1                               ? 10 : 4;
  const defBonus = counts.Defender   >= 3 && counts.Defender   <= 5     ? 10 : 4;
  const midBonus = counts.Midfielder >= 3 && counts.Midfielder <= 5     ? 10 : 4;
  const fwdBonus = counts.Attacker   >= 1 && counts.Attacker   <= 3     ? 10 : 4;

  return gkBonus + defBonus + midBonus + fwdBonus;   // max 40
}

// ─── Step 3: final score ──────────────────────────────────────────────────────
/**
 * @param {number} averageForm   0–10
 * @param {number} balanceBonus  0–40
 * @returns {number}  0–100 (integer)
 */
function calcFinalScore(averageForm, balanceBonus) {
  const raw = Math.round(averageForm * 10) * 0.6 + balanceBonus;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ─── Label ────────────────────────────────────────────────────────────────────
/**
 * @param {number} score  0–100
 * @returns {string}
 */
function scoreLabel(score) {
  if (score >= 90) return 'Elite squad with excellent balance.';
  if (score >= 80) return 'Strong chance of success based on the selected squad.';
  if (score >= 70) return 'Competitive team with good potential.';
  if (score >= 60) return 'Average performance expected.';
  return 'Needs improvement.';
}

// ─── Color ────────────────────────────────────────────────────────────────────
/**
 * @param {number} score
 * @returns {'green'|'blue'|'yellow'|'red'}
 */
function scoreColor(score) {
  if (score >= 90) return 'green';
  if (score >= 80) return 'blue';
  if (score >= 70) return 'yellow';
  return 'red';
}

// ─── Stars ────────────────────────────────────────────────────────────────────
/**
 * @param {number} score  0–100
 * @returns {number}  1–5
 */
function scoreStars(score) {
  return Math.max(1, Math.round(score / 20));
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Calculates the Team Success Score for the given 11-player array.
 * Uses only `form_rating` / `rating` and `position` from the dataset.
 *
 * @param {ScoredPlayer[]} players
 * @returns {TeamScoreResult}
 */
export function calcTeamScore(players) {
  const averageForm  = calcAverageForm(players);
  const balanceBonus = calcBalanceBonus(players);
  const finalScore   = calcFinalScore(averageForm, balanceBonus);

  return {
    finalScore,
    averageForm,
    balanceBonus,
    stars:  scoreStars(finalScore),
    label:  scoreLabel(finalScore),
    color:  scoreColor(finalScore),
  };
}
