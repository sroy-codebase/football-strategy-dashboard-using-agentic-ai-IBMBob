import React from 'react';
import { Tile } from '@carbon/react';
import './_player-card.scss';

const STATS = [
  { label: 'Position',   key: 'position' },
  { label: 'Age',        key: 'age' },
  { label: 'Nationality', key: 'citizenship' },
  { label: 'Club',       key: 'club' },
];

function formatRating(rating) {
  if (rating == null) return '—';
  return `${parseFloat(rating).toFixed(1)} / 10`;
}

function getFormDescription(form_rating) {
  if (form_rating == null || form_rating === '') return null;
  const r = parseFloat(form_rating);
  if (r >= 8.0) return 'in strong form';
  if (r >= 6.0) return 'showing consistent form';
  return 'building form';
}

function buildSummary(player) {
  const { player_name, position, age, citizenship, current_club_name, form_rating } = player;
  const parts = [];

  if (player_name) parts.push(player_name);

  const descriptors = [];
  if (position) descriptors.push(`a ${position}`);
  if (age != null) descriptors.push(`${age} years old`);
  if (citizenship) descriptors.push(`from ${citizenship}`);
  if (descriptors.length > 0) {
    parts.push((parts.length > 0 ? 'is ' : '') + descriptors.join(', '));
  }

  if (current_club_name) parts.push(`currently playing for ${current_club_name}`);

  const formDesc = getFormDescription(form_rating);
  if (formDesc) parts.push(`and is ${formDesc}`);

  const sentence = parts.length > 0 ? parts.join(' ') + '.' : '';
  return sentence + ' This profile is based on the available dataset only.';
}

function PlayerCard({ player }) {
  if (!player) return null;

  const summary = buildSummary(player);

  return (
    <>
      <Tile className="player-card">
        {player.photo && (
          <div className="player-card__photo-wrap">
            <img
              className="player-card__photo"
              src={player.photo}
              alt={player.name}
            />
          </div>
        )}

        <h2 className="player-card__name">{player.name}</h2>

        <ul className="player-card__stats">
          {STATS.map(({ label, key }) => (
            <li key={key} className="player-card__stat-row">
              <span className="player-card__stat-label">{label}</span>
              <span className="player-card__stat-value">
                {player[key] != null ? player[key] : '—'}
              </span>
            </li>
          ))}
          <li className="player-card__stat-row">
            <span className="player-card__stat-label">Form rating</span>
            <span className="player-card__stat-value">{formatRating(player.rating)}</span>
          </li>
        </ul>
      </Tile>

      <div className="player-wiki">
        <p className="player-wiki__label">Player Summary</p>
        <p className="player-wiki__text">{summary}</p>
        <p className="player-wiki__source">This summary is based only on the loaded dataset.</p>
      </div>
    </>
  );
}

export default PlayerCard;
