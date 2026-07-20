import React, { useState, useMemo } from 'react';
import { Select, SelectItem, Tile } from '@carbon/react';
import './_player-compare.scss';

// ── Comparable stat rows ──────────────────────────────────────────────────────
// Each entry has a label, the player field key, and whether higher is "better"
const COMPARE_STATS = [
  { label: 'Position',    key: 'position',    numeric: false },
  { label: 'Age',         key: 'age',         numeric: true,  higherIsBetter: false },
  { label: 'Nationality', key: 'citizenship', numeric: false },
  { label: 'Club',        key: 'club',        numeric: false },
  { label: 'Height (cm)', key: 'height',      numeric: true,  higherIsBetter: true  },
  { label: 'Form rating', key: 'form_rating', numeric: true,  higherIsBetter: true  },
];

function fmt(value, key) {
  if (value == null) return '—';
  if (key === 'form_rating') return parseFloat(value).toFixed(2);
  return String(value);
}

/**
 * Returns 'better' | 'worse' | 'equal' | null for a numeric stat.
 * @param {number|null} a  left player value
 * @param {number|null} b  right player value
 * @param {boolean} higherIsBetter
 */
function diffResult(a, b, higherIsBetter) {
  if (a == null || b == null) return null;
  if (a === b) return 'equal';
  const leftWins = higherIsBetter ? a > b : a < b;
  return leftWins ? 'better' : 'worse';
}

// ── Single column: selector + card ───────────────────────────────────────────
function PlayerColumn({ slot, players, selected, onSelect }) {
  return (
    <div className="pc-column">
      <Select
        id={`compare-select-${slot}`}
        labelText={`Player ${slot}`}
        value={selected?.name ?? ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <SelectItem value="" text="Select a player…" />
        {players.map((p) => (
          <SelectItem key={p.name} value={p.name} text={p.name} />
        ))}
      </Select>

      {selected ? (
        <Tile className="pc-card">
          {selected.photo && (
            <div className="pc-card__photo-wrap">
              <img
                className="pc-card__photo"
                src={selected.photo}
                alt={selected.name}
              />
            </div>
          )}
          <h2 className="pc-card__name">{selected.name}</h2>
        </Tile>
      ) : (
        <div className="pc-card pc-card--empty">
          <span>No player selected</span>
        </div>
      )}
    </div>
  );
}

// ── Stat comparison table ─────────────────────────────────────────────────────
function CompareTable({ left, right }) {
  if (!left && !right) return null;

  return (
    <table className="pc-table">
      <thead>
        <tr>
          <th className="pc-table__cell pc-table__cell--left">
            {left?.name ?? '—'}
          </th>
          <th className="pc-table__cell pc-table__cell--mid">Stat</th>
          <th className="pc-table__cell pc-table__cell--right">
            {right?.name ?? '—'}
          </th>
        </tr>
      </thead>
      <tbody>
        {COMPARE_STATS.map(({ label, key, numeric, higherIsBetter }) => {
          const lv = left?.[key] ?? null;
          const rv = right?.[key] ?? null;
          const diff = numeric ? diffResult(lv, rv, higherIsBetter) : null;

          return (
            <tr key={key} className="pc-table__row">
              <td className={`pc-table__cell pc-table__cell--left pc-table__cell--val ${diff === 'better'  ? 'pc-table__cell--win'  : ''} ${diff === 'worse' ? 'pc-table__cell--lose' : ''}`}>
                {fmt(lv, key)}
              </td>
              <td className="pc-table__cell pc-table__cell--mid pc-table__cell--stat">
                {label}
              </td>
              <td className={`pc-table__cell pc-table__cell--right pc-table__cell--val ${diff === 'worse'  ? 'pc-table__cell--win'  : ''} ${diff === 'better' ? 'pc-table__cell--lose' : ''}`}>
                {fmt(rv, key)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * @param {{ players: Array<Object> }} props
 */
function PlayerCompare({ players }) {
  const [leftName,  setLeftName]  = useState('');
  const [rightName, setRightName] = useState('');

  const leftPlayer  = useMemo(() => players.find((p) => p.name === leftName)  || null, [players, leftName]);
  const rightPlayer = useMemo(() => players.find((p) => p.name === rightName) || null, [players, rightName]);

  return (
    <div className="pc">
      <div className="pc__columns">
        <PlayerColumn
          slot="A"
          players={players}
          selected={leftPlayer}
          onSelect={setLeftName}
        />

        <div className="pc__divider" aria-hidden="true">VS</div>

        <PlayerColumn
          slot="B"
          players={players}
          selected={rightPlayer}
          onSelect={setRightName}
        />
      </div>

      <CompareTable left={leftPlayer} right={rightPlayer} />
    </div>
  );
}

export default PlayerCompare;
