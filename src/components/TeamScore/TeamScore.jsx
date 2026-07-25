import React, { useEffect, useState } from 'react';
import './_team-score.scss';

const STAR_FILLED = '⭐';
const STAR_EMPTY  = '☆';

/** @type {Record<string, string>} color → CSS custom-property value */
const COLOR_MAP = {
  green:  '#1a7f37',
  blue:   '#0f62fe',
  yellow: '#b45309',
  red:    '#cf222e',
};

const BG_MAP = {
  green:  '#dafbe1',
  blue:   '#dbeafe',
  yellow: '#fef9c3',
  red:    '#fff0f0',
};

/**
 * @param {{
 *   score: import('../../utils/teamScore').TeamScoreResult
 * }} props
 */
function TeamScore({ score }) {
  // Animate progress bar from 0 → finalScore
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDisplayed(0);
    const target   = score.finalScore;
    const duration = 900; // ms
    const fps      = 60;
    const steps    = Math.round(duration / (1000 / fps));
    let   step     = 0;

    const id = setInterval(() => {
      step++;
      // Ease-out: decelerate toward target
      const progress = 1 - Math.pow(1 - step / steps, 3);
      setDisplayed(Math.round(progress * target));
      if (step >= steps) {
        setDisplayed(target);
        clearInterval(id);
      }
    }, 1000 / fps);

    return () => clearInterval(id);
  }, [score.finalScore, score]);          // re-run whenever a new score arrives

  const fg = COLOR_MAP[score.color];
  const bg = BG_MAP[score.color];

  return (
    <div className="ts">
      <h3 className="ts__heading">Team Success Score</h3>

      {/* Stars */}
      <div className="ts__stars" aria-label={`${score.stars} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) =>
          i < score.stars
            ? <span key={i} className="ts__star ts__star--filled">{STAR_FILLED}</span>
            : <span key={i} className="ts__star ts__star--empty">{STAR_EMPTY}</span>
        )}
      </div>

      {/* Numeric score */}
      <div className="ts__number" style={{ color: fg }}>
        {score.finalScore} <span className="ts__denom">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="ts__bar-track" role="progressbar"
           aria-valuenow={displayed} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="ts__bar-fill"
          style={{ width: `${displayed}%`, background: fg }}
        />
      </div>
      <div className="ts__bar-pct" style={{ color: fg }}>{displayed}%</div>

      {/* Label */}
      <p className="ts__label" style={{ background: bg, color: fg }}>
        {score.label}
      </p>

      {/* Breakdown (collapsed detail) */}
      <details className="ts__breakdown">
        <summary className="ts__breakdown-toggle">Score breakdown</summary>
        <ul className="ts__breakdown-list">
          <li>
            <span className="ts__breakdown-key">Avg. form rating</span>
            <span className="ts__breakdown-val">{score.averageForm.toFixed(2)} / 10</span>
          </li>
          <li>
            <span className="ts__breakdown-key">Form contribution</span>
            <span className="ts__breakdown-val">
              {(Math.round(score.averageForm * 10) * 0.6).toFixed(1)} pts
            </span>
          </li>
          <li>
            <span className="ts__breakdown-key">Balance bonus</span>
            <span className="ts__breakdown-val">{score.balanceBonus} / 40 pts</span>
          </li>
        </ul>
      </details>
    </div>
  );
}

export default TeamScore;
