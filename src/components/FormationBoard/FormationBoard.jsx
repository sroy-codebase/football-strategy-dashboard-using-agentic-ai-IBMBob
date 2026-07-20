import React, { useState, useCallback } from 'react';
import { DEFAULT_FORMATION } from '../../utils/formations';

/**
 * @typedef {{ name: string, photo: string, position: string }} FormationPlayer
 * @param {{
 *   players:        FormationPlayer[],
 *   rows?:          import('../../utils/formations').FormationRow[],
 *   shirtNumbers?:  number[],
 *   onPlayerClick?: (player: FormationPlayer) => void,
 *   selectedName?:  string
 * }} props
 */

// ─── SVG pitch constants ──────────────────────────────────────────────────────
const W  = 520;   // SVG canvas width
const H  = 780;   // SVG canvas height  (≈ 2:3 vertical portrait)

// Field boundary (white border inset from canvas edge)
const FX = 20,  FY = 20;                      // top-left corner
const FW = W - FX * 2;                        // 480
const FH = H - FY * 2;                        // 740

const CX = W / 2;                             // 260 — horizontal centre
const CY = H / 2;                             // 390 — vertical centre

// Centre circle
const CC_R = 58;

// Penalty box  (FIFA ≈ 40.32m deep on 105m pitch → ~38% of FH → 118px; widened to ~65% of FW)
const PB_W  = 312;                             // penalty box width
const PB_H  = 120;                             // penalty box depth
const PB_X  = CX - PB_W / 2;                  // 104

// Goal area (six-yard box) nested inside penalty box
const GA_W  = 156;                             // goal area width
const GA_H  = 50;                              // goal area depth
const GA_X  = CX - GA_W / 2;                  // 182

// Penalty spot: 78px from the end line (inside the box)
const PS_OFFSET = 78;

// Penalty arc radius (same as centre circle radius, clipped outside the box)
const PA_R = CC_R;

// Corner arc radius
const CR_R = 10;

// Goal rectangles (outside field boundary, centred)
const GOAL_W  = 100;
const GOAL_H  = 18;
const GOAL_X  = CX - GOAL_W / 2;             // 210

// ─── Inline styles ────────────────────────────────────────────────────────────
const S = {
  // Outer wrapper — flat, portrait, subtle shadow
  wrapper: {
    position: 'relative',
    width:  `${W}px`,
    height: `${H + GOAL_H * 2}px`,   // extra space for goals top & bottom
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: [
      '0 4px 24px rgba(0,0,0,0.32)',
      'inset 0 0 60px rgba(0,0,0,0.18)',
    ].join(', '),
    background: [
      'linear-gradient(180deg,',
      '  #3a9e5c 0%, #43a85f 12.5%, #3a9e5c 12.5%,',
      '  #3a9e5c 25%,  #43a85f 25%,  #43a85f 37.5%,',
      '  #3a9e5c 37.5%,#3a9e5c 50%,  #43a85f 50%,',
      '  #43a85f 62.5%,#3a9e5c 62.5%,#3a9e5c 75%,',
      '  #43a85f 75%,  #43a85f 87.5%,#3a9e5c 87.5%,',
      '  #3a9e5c 100%)',
    ].join(''),
    fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
    userSelect: 'none',
  },

  // SVG fills the wrapper exactly (goals add GOAL_H top and bottom)
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },

  // Empty-state overlay
  empty: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.95rem',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    textAlign: 'center',
    padding: '2rem',
  },

  // Player rows container (inset by goal height so players don't overlap goals)
  rows: {
    position: 'absolute',
    top:    `${FY + GOAL_H}px`,
    bottom: `${FY + GOAL_H}px`,
    left:   `${FX}px`,
    right:  `${FX}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    paddingTop:    '10px',
    paddingBottom: '10px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  // Player token — base button reset
  token: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    width: '56px',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  photoWrap: {
    position: 'relative',
    width: '44px',
    height: '44px',
  },
  photo: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.9)',
    background: 'rgba(0,0,0,0.25)',
    display: 'block',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  photoSelected: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2.5px solid #f0b429',
    background: 'rgba(0,0,0,0.25)',
    display: 'block',
    transform: 'scale(1.12)',
    boxShadow: '0 0 0 3px rgba(240,180,41,0.45)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  badge: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: '#f0b429',
    border: '1.5px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 1,
  },
  name: {
    color: '#fff',
    fontSize: '9px',
    fontWeight: '600',
    textAlign: 'center',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    lineHeight: 1.25,
    maxWidth: '56px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  nameSelected: {
    color: '#f0b429',
    fontSize: '9px',
    fontWeight: '700',
    textAlign: 'center',
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    lineHeight: 1.25,
    maxWidth: '56px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },

  // ── Tooltip ──
  tooltip: {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
    background: 'rgba(15,20,25,0.93)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '170px',
    maxWidth: '220px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
  },
  tooltipPhoto: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  tooltipBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  tooltipName: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tooltipMeta: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '10px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tooltipRating: {
    marginTop: '4px',
    display: 'inline-block',
    background: 'rgba(240,180,41,0.18)',
    border: '1px solid rgba(240,180,41,0.45)',
    borderRadius: '4px',
    padding: '1px 5px',
    color: '#f0b429',
    fontSize: '10px',
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
};

// ─── SVG pitch markings ───────────────────────────────────────────────────────
function PitchMarkings() {
  // All y-coordinates are offset by GOAL_H so the field rect sits below the top goal
  const oy = GOAL_H;   // y offset
  const mk = 'rgba(255,255,255,0.92)';
  const sw = 1.6;

  // Derived positions with offset
  const fy  = FY + oy;             // top of field rect
  const fby = fy + FH;             // bottom of field rect
  const cy  = CY + oy;             // vertical centre of field

  // Penalty box top
  const pbt_y  = fy;               // top of top penalty box
  const pbt_by = fy + PB_H;        // bottom of top penalty box
  // Penalty box bottom
  const pbb_by = fby;              // bottom of bottom penalty box
  const pbb_y  = fby - PB_H;       // top of bottom penalty box

  // Goal area top
  const gat_y  = fy;
  const gat_by = fy + GA_H;
  // Goal area bottom
  const gab_by = fby;
  const gab_y  = fby - GA_H;

  // Penalty spots
  const ps_top = fy  + PS_OFFSET;
  const ps_bot = fby - PS_OFFSET;

  // Goal boxes (outside field, flush against end lines)
  const goal_top_y  = oy - GOAL_H;   // GOAL_H above the field top edge (canvas top)
  const goal_bot_y  = fby;            // flush with field bottom edge

  return (
    <svg
      style={S.svg}
      viewBox={`0 0 ${W} ${H + GOAL_H * 2}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Diagonal-stripe net pattern for goal rectangles */}
        <pattern id="net" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="rgba(255,255,255,0.12)" />
          <line x1="0" y1="6" x2="6" y2="0" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        </pattern>

        {/* Clip for top penalty arc — only shows the part OUTSIDE the penalty box */}
        <clipPath id="arc-top-clip">
          <rect x="0" y={pbt_by} width={W} height={H} />
        </clipPath>
        {/* Clip for bottom penalty arc — only shows part OUTSIDE (above) the penalty box */}
        <clipPath id="arc-bot-clip">
          <rect x="0" y="0" width={W} height={pbb_y} />
        </clipPath>
      </defs>

      {/* ── Goals (outside field, centered) ─────────────────────────────── */}
      <rect x={GOAL_X} y={goal_top_y} width={GOAL_W} height={GOAL_H}
            fill="url(#net)" stroke={mk} strokeWidth={sw} />
      <rect x={GOAL_X} y={goal_bot_y} width={GOAL_W} height={GOAL_H}
            fill="url(#net)" stroke={mk} strokeWidth={sw} />

      {/* ── Outer field border ───────────────────────────────────────────── */}
      <rect x={FX} y={fy} width={FW} height={FH}
            fill="none" stroke={mk} strokeWidth={sw} />

      {/* ── Halfway line ─────────────────────────────────────────────────── */}
      <line x1={FX} y1={cy} x2={FX + FW} y2={cy}
            stroke={mk} strokeWidth={sw} />

      {/* ── Centre circle & spot ─────────────────────────────────────────── */}
      <circle cx={CX} cy={cy} r={CC_R}
              fill="none" stroke={mk} strokeWidth={sw} />
      <circle cx={CX} cy={cy} r={3} fill={mk} />

      {/* ── Corner arcs ──────────────────────────────────────────────────── */}
      {/* top-left */}
      <path d={`M ${FX} ${fy + CR_R} A ${CR_R} ${CR_R} 0 0 1 ${FX + CR_R} ${fy}`}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* top-right */}
      <path d={`M ${FX + FW - CR_R} ${fy} A ${CR_R} ${CR_R} 0 0 1 ${FX + FW} ${fy + CR_R}`}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* bottom-left */}
      <path d={`M ${FX} ${fby - CR_R} A ${CR_R} ${CR_R} 0 0 0 ${FX + CR_R} ${fby}`}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* bottom-right */}
      <path d={`M ${FX + FW - CR_R} ${fby} A ${CR_R} ${CR_R} 0 0 0 ${FX + FW} ${fby - CR_R}`}
            fill="none" stroke={mk} strokeWidth={sw} />

      {/* ── TOP penalty area ─────────────────────────────────────────────── */}
      <rect x={PB_X} y={pbt_y} width={PB_W} height={PB_H}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* top goal area */}
      <rect x={GA_X} y={gat_y} width={GA_W} height={GA_H}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* top penalty spot */}
      <circle cx={CX} cy={ps_top} r={3} fill={mk} />
      {/* top penalty arc — D curves away from goal (downward), clipped outside box */}
      <circle cx={CX} cy={ps_top} r={PA_R}
              fill="none" stroke={mk} strokeWidth={sw}
              clipPath="url(#arc-top-clip)" />

      {/* ── BOTTOM penalty area ──────────────────────────────────────────── */}
      <rect x={PB_X} y={pbb_y} width={PB_W} height={PB_H}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* bottom goal area */}
      <rect x={GA_X} y={gab_y} width={GA_W} height={GA_H}
            fill="none" stroke={mk} strokeWidth={sw} />
      {/* bottom penalty spot */}
      <circle cx={CX} cy={ps_bot} r={3} fill={mk} />
      {/* bottom penalty arc — D curves away from goal (upward), clipped outside box */}
      <circle cx={CX} cy={ps_bot} r={PA_R}
              fill="none" stroke={mk} strokeWidth={sw}
              clipPath="url(#arc-bot-clip)" />
    </svg>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function PlayerTooltip({ player, anchorRect }) {
  if (!anchorRect) return null;

  // Position above the token, centred horizontally; flip below if too close to top
  const OFFSET = 8;
  const TIP_H  = 70; // approx tooltip height
  const top    = anchorRect.top - TIP_H - OFFSET < 0
    ? anchorRect.bottom + OFFSET
    : anchorRect.top   - TIP_H - OFFSET;
  const left   = anchorRect.left + anchorRect.width / 2;

  const rating = player.form_rating ?? player.rating ?? null;
  const ratingLabel = rating != null
    ? parseFloat(rating).toFixed(1)
    : null;

  return (
    <div style={{ ...S.tooltip, top, left, transform: 'translateX(-50%)' }}>
      {player.photo && (
        <img
          style={S.tooltipPhoto}
          src={player.photo}
          alt={player.name}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div style={S.tooltipBody}>
        <span style={S.tooltipName}>{player.name}</span>
        {player.position && (
          <span style={S.tooltipMeta}>{player.position}</span>
        )}
        {player.club && (
          <span style={S.tooltipMeta}>{player.club}</span>
        )}
        {ratingLabel && (
          <span style={S.tooltipRating}>★ {ratingLabel}</span>
        )}
      </div>
    </div>
  );
}

// ─── Single player token ──────────────────────────────────────────────────────
function PlayerToken({ player, shirtNumber, isSelected, onClick }) {
  const isActive = isSelected;
  const [anchorRect, setAnchorRect] = useState(null);

  const handleMouseEnter = useCallback((e) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
  }, []);

  const handleMouseLeave = useCallback(() => {
    setAnchorRect(null);
  }, []);

  return (
    <>
      <button
        style={S.token}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-pressed={isActive}
      >
        <div style={S.photoWrap}>
          <img
            style={isActive ? S.photoSelected : S.photo}
            src={player.photo}
            alt={player.name}
            onError={(e) => { e.currentTarget.src = ''; }}
          />
          <span style={S.badge}>{shirtNumber}</span>
        </div>
        <span style={isActive ? S.nameSelected : S.name}>{player.name}</span>
      </button>
      <PlayerTooltip player={player} anchorRect={anchorRect} />
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function FormationBoard({
  players      = [],
  rows         = DEFAULT_FORMATION.rows,
  shirtNumbers = DEFAULT_FORMATION.shirtNumbers,
  onPlayerClick,
  selectedName,
}) {
  const hasPlayers = players.length >= 11;

  return (
    <div style={S.wrapper}>
      <PitchMarkings />

      {!hasPlayers ? (
        <div style={S.empty}>
          Click &ldquo;Generate Random Team&rdquo; to see the formation
        </div>
      ) : (
        <div style={S.rows}>
          {rows.map((row) => {
            const slice = players.slice(row.startIndex, row.startIndex + row.count);
            return (
              <div key={row.label} style={S.row}>
                {slice.map((player, i) => {
                  const globalIndex = row.startIndex + i;
                  return (
                    <PlayerToken
                      key={player.name}
                      player={player}
                      shirtNumber={shirtNumbers[globalIndex]}
                      isSelected={selectedName === player.name}
                      onClick={() => onPlayerClick && onPlayerClick(player)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FormationBoard;
