"""
Team Formation page — Plotly-powered pitch visualizer.

Player nodes are rendered as Plotly scatter markers with:
  • Position-coloured circles (marker symbol="circle").
  • Player photos overlaid via fig.add_layout_image(), clipped to each node.
  • Rich hover tooltips (hovertemplate HTML) showing all available stats.
  • Dark hoverlabel background for clear contrast against the green pitch.
  • Name labels via text= on the scatter trace, displayed below each node.
  • The right panel uses Streamlit buttons (one per player) to select a player
    and show a detailed card — Plotly click events are not used so no extra
    component dependencies are needed.
"""

from __future__ import annotations
import streamlit as st
import plotly.graph_objects as go
from typing import List, Dict, Any, Optional

from utils.formations import FORMATIONS, DEFAULT_FORMATION, generate_random_team, Formation
from utils.team_score import calc_team_score


# ── Pitch coordinate system ───────────────────────────────────────────────────
# We work in a normalised [0, 100] × [0, 150] space (width × height).
# (0,0) = top-left, y increases downward.
# Standard pitch proportions: 105 m × 68 m → we use 150 × 100 with axes flipped
# so the pitch renders portrait (tall).

PW   = 100.0   # pitch width  (x-axis)
PH   = 150.0   # pitch height (y-axis, 0 = top, 150 = bottom)
CX   = PW / 2  # 50
CY   = PH / 2  # 75

# Penalty box (bottom — GK end)
PB_W, PB_H = 57.0, 18.0
# Goal area (bottom)
GA_W, GA_H = 29.0, 6.0
# Centre circle radius (in coord units)
CC_R = 9.15

# Goal dimensions
GOAL_W, GOAL_H = 7.32, 2.4

# Position colours (hex, same as previous SVG version)
POS_COLORS: Dict[str, str] = {
    "Goalkeeper": "#f97316",
    "Defender":   "#3b82f6",
    "Midfielder": "#22c55e",
    "Attacker":   "#ef4444",
}
DEFAULT_COLOR = "#6366f1"


# ── Name truncation (unchanged from SVG version) ─────────────────────────────

def _truncate_name(name: str, max_chars: int = 13) -> str:
    """Shorten a player name to fit below the node label."""
    if len(name) <= max_chars:
        return name
    parts = name.split()
    if len(parts) == 1:
        return name[: max_chars - 1] + "."
    first, *rest = parts
    last = " ".join(rest)
    candidate = f"{first} {last}" if len(first) <= 2 else f"{first[0]}. {last}"
    if len(candidate) <= max_chars:
        return candidate
    surplus = len(candidate) - max_chars + 1
    initial = candidate.split()[0]
    surname = candidate[len(initial) + 1:]
    trimmed = surname[: len(surname) - surplus]
    return f"{initial} {trimmed}."


# ── Hover tooltip builder ─────────────────────────────────────────────────────

def _hover_text(player: Dict[str, Any], shirt_number: int) -> str:
    """
    Build an HTML hover string for a player node.
    Uses <b> tags and <br> line breaks; Plotly renders these natively.
    Only fields that are actually present and non-null are included.
    """
    name     = player.get("name") or player.get("player_name") or "Unknown"
    pos      = player.get("position", "—")
    age      = player.get("age")
    nat      = player.get("citizenship") or player.get("nationality")
    club     = player.get("current_club_name") or player.get("club")
    height   = player.get("height")
    rating   = player.get("form_rating") or player.get("rating")

    def _r(v) -> str:
        """Format a nullable float to 2 dp."""
        if v is None:
            return "—"
        try:
            return f"{float(v):.2f}"
        except (TypeError, ValueError):
            return "—"

    def _s(v) -> str:
        return str(v) if v is not None else "—"

    lines = [
        f"<b>{name}</b>",
        f"<b>#{shirt_number}</b>  {pos}",
        "─" * 22,
    ]

    if club:
        lines.append(f"🏟  {club}")
    if nat:
        lines.append(f"🌍  {nat}")

    lines.append("")   # blank separator

    stats = []
    if age is not None:
        stats.append(f"<b>Age:</b> {_s(age)}")
    if height is not None:
        stats.append(f"<b>Height:</b> {_s(height)} cm")
    if rating is not None:
        stars = "★" * min(5, max(1, round(float(rating) / 2)))
        stats.append(f"<b>Form rating:</b> {_r(rating)} / 10  {stars}")

    lines.extend(stats)

    # Any extra numeric keys in the data beyond the standard set
    known = {"player_name", "name", "photo", "position", "age", "citizenship",
             "nationality", "height", "current_club_name", "club",
             "form_rating", "rating"}
    extras = [
        (k, v) for k, v in player.items()
        if k not in known and v is not None
        and isinstance(v, (int, float, str))
    ]
    if extras:
        lines.append("")
        for k, v in extras:
            label = k.replace("_", " ").title()
            lines.append(f"<b>{label}:</b> {v}")

    return "<br>".join(lines)


# ── Pitch shapes (Plotly layout.shapes) ──────────────────────────────────────

def _pitch_shapes() -> List[Dict]:
    """
    Return a list of Plotly shape dicts that draw the pitch markings.
    Coordinate system: x ∈ [0, PW], y ∈ [0, PH] (y increases downward).
    All shapes use yref/xref='x'/'y' (data coordinates).
    """
    S = []   # accumulator

    def rect(x0, y0, x1, y1, *, fill="rgba(0,0,0,0)", lw=1.5):
        S.append(dict(type="rect", x0=x0, y0=y0, x1=x1, y1=y1,
                      line=dict(color="rgba(255,255,255,0.75)", width=lw),
                      fillcolor=fill,
                      layer="below"))

    def circle(cx, cy, r, *, fill="rgba(0,0,0,0)", lw=1.5):
        S.append(dict(type="circle", x0=cx - r, y0=cy - r, x1=cx + r, y1=cy + r,
                      line=dict(color="rgba(255,255,255,0.75)", width=lw),
                      fillcolor=fill,
                      layer="below"))

    def line(x0, y0, x1, y1):
        S.append(dict(type="line", x0=x0, y0=y0, x1=x1, y1=y1,
                      line=dict(color="rgba(255,255,255,0.75)", width=1.5),
                      layer="below"))

    # Outer pitch boundary
    rect(0, 0, PW, PH, fill="#2d7a2d", lw=2)

    # Halfway line
    line(0, CY, PW, CY)

    # Centre circle + spot
    circle(CX, CY, CC_R)
    circle(CX, CY, 0.5, fill="white")

    # ── Bottom penalty area (GK end, y near PH) ───────────────────────────────
    pb_x0 = (PW - PB_W) / 2
    rect(pb_x0, PH - PB_H, pb_x0 + PB_W, PH)

    ga_x0 = (PW - GA_W) / 2
    rect(ga_x0, PH - GA_H, ga_x0 + GA_W, PH)

    # Penalty spot (bottom)
    circle(CX, PH - 11.0, 0.5, fill="white")

    # Penalty arc (bottom) — approximate with a partial circle shape
    # Plotly doesn't have arc; we use a full circle at penalty spot radius
    # and rely on the box to visually clip it — draw it below the box:
    circle(CX, PH - 11.0, CC_R)

    # Goal (bottom)
    goal_x0 = (PW - GOAL_W) / 2
    rect(goal_x0, PH, goal_x0 + GOAL_W, PH + GOAL_H, lw=1.5)

    # ── Top penalty area (ATK end, y near 0) ─────────────────────────────────
    rect(pb_x0, 0, pb_x0 + PB_W, PB_H)
    rect(ga_x0, 0, ga_x0 + GA_W, GA_H)

    # Penalty spot (top)
    circle(CX, 11.0, 0.5, fill="white")
    circle(CX, 11.0, CC_R)

    # Goal (top)
    rect(goal_x0, -GOAL_H, goal_x0 + GOAL_W, 0, lw=1.5)

    # Corner arcs — tiny quarter-circles approximated as small circles at corners
    for cx_c, cy_c in [(0, 0), (PW, 0), (0, PH), (PW, PH)]:
        circle(cx_c, cy_c, 1.0)

    return S


# ── Player position layout ────────────────────────────────────────────────────

def _player_positions(
    team_players: List[Dict[str, Any]],
    formation: Formation,
) -> List[Dict[str, Any]]:
    """
    Compute (x, y, player, shirt_number) for each player in the formation.
    Returns a list of dicts with keys: x, y, player, shirt_number.
    """
    total_rows  = len(formation.rows)
    # Vertical margins so tokens aren't clipped by the pitch boundary
    top_margin    = 8.0
    bottom_margin = 8.0
    usable_h      = PH - top_margin - bottom_margin

    result = []
    for row in formation.rows:
        row_players = team_players[row.start_index: row.start_index + row.count]
        n           = len(row_players)
        if n == 0:
            continue

        row_idx = formation.rows.index(row)
        y_frac  = (row_idx + 0.5) / total_rows
        y       = top_margin + y_frac * usable_h

        for i, player in enumerate(row_players):
            x_frac = (i + 1) / (n + 1)
            x      = x_frac * PW

            global_idx   = row.start_index + i
            shirt_number = (
                formation.shirt_numbers[global_idx]
                if global_idx < len(formation.shirt_numbers)
                else global_idx + 1
            )
            result.append(dict(x=x, y=y, player=player, shirt_number=shirt_number))

    return result


# ── Plotly figure builder ─────────────────────────────────────────────────────

def _build_figure(
    team_players: List[Dict[str, Any]],
    formation: Formation,
    selected_name: Optional[str] = None,
) -> go.Figure:
    """
    Build the full Plotly figure: green pitch + player nodes + hover tooltips
    + player photo images overlaid on each node.
    """
    fig = go.Figure()

    # ── Pitch background via layout shapes ────────────────────────────────────
    shapes = _pitch_shapes()

    # ── Collect node data grouped by position for one trace per group ─────────
    # (Allows each group to have its own marker colour in the legend.)
    pos_order = ["Goalkeeper", "Defender", "Midfielder", "Attacker"]
    groups: Dict[str, List[Dict]] = {p: [] for p in pos_order}
    others: List[Dict] = []

    placements = _player_positions(team_players, formation)

    for item in placements:
        p   = item["player"]
        pos = p.get("position", "")
        if pos in groups:
            groups[pos].append(item)
        else:
            others.append(item)

    def _add_trace(items: List[Dict], color: str, group_name: str) -> None:
        if not items:
            return

        xs, ys, texts, hovers, sizes, colors, line_colors, line_widths = [], [], [], [], [], [], [], []

        for item in items:
            p        = item["player"]
            sn       = item["shirt_number"]
            sel      = p.get("name") == selected_name
            has_photo = bool(p.get("photo"))

            xs.append(item["x"])
            ys.append(item["y"])
            texts.append(_truncate_name(p.get("name", "")))
            hovers.append(_hover_text(p, sn))
            sizes.append(32)
            # When a photo exists the circle becomes a transparent ring so the
            # photo (drawn below) shows through. Without a photo keep solid fill.
            colors.append("rgba(0,0,0,0)" if has_photo else color)
            line_colors.append("#fbbf24" if sel else (color if has_photo else "white"))
            line_widths.append(4 if sel else 3)

        fig.add_trace(go.Scatter(
            x=xs, y=ys,
            mode="markers+text",
            name=group_name,
            marker=dict(
                symbol="circle",
                size=sizes,
                color=colors,
                line=dict(color=line_colors, width=line_widths),
            ),
            text=texts,
            textposition="bottom center",
            textfont=dict(
                family="system-ui, sans-serif",
                size=9,
                color="white",
            ),
            hovertemplate="%{customdata}<extra></extra>",
            customdata=hovers,
            hoverlabel=dict(
                bgcolor="#1a1a2e",
                bordercolor="#4a4a6a",
                font=dict(family="system-ui, sans-serif", size=12, color="white"),
                align="left",
                namelength=0,
            ),
        ))

    for pos in pos_order:
        _add_trace(groups[pos], POS_COLORS.get(pos, DEFAULT_COLOR), pos)
    _add_trace(others, DEFAULT_COLOR, "Other")

    # ── Overlay player photos via layout images ───────────────────────────────
    # layer="below" keeps photos under the scatter trace so the markers stay on
    # top and receive mouse-hover events. The coloured circle uses opacity=0.15
    # so the photo shows through clearly while the marker still intercepts hover.
    layout_images = []
    IMG_HALF = 4.5   # half-size in data coords (keeps photo inside the 32px marker)

    for item in placements:
        photo_url = item["player"].get("photo", "")
        if not photo_url:
            continue
        layout_images.append(dict(
            source=photo_url,
            xref="x", yref="y",
            x=item["x"] - IMG_HALF,
            y=item["y"] - IMG_HALF,
            sizex=IMG_HALF * 2,
            sizey=IMG_HALF * 2,
            sizing="stretch",
            opacity=0.92,
            layer="below",
        ))

    # ── Legend colour key for positions ───────────────────────────────────────
    legend_traces = []
    for pos in pos_order:
        legend_traces.append(go.Scatter(
            x=[None], y=[None],
            mode="markers",
            name=pos,
            marker=dict(symbol="circle", size=10, color=POS_COLORS[pos]),
            showlegend=True,
        ))

    # ── Layout ────────────────────────────────────────────────────────────────
    fig.update_layout(
        shapes=shapes,
        images=layout_images,
        plot_bgcolor="#2d7a2d",
        paper_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(
            range=[-2, PW + 2],
            showgrid=False, zeroline=False,
            showticklabels=False, fixedrange=True,
        ),
        yaxis=dict(
            range=[PH + GOAL_H + 2, -GOAL_H - 2],   # y=0 at top
            showgrid=False, zeroline=False,
            showticklabels=False, fixedrange=True,
            scaleanchor="x", scaleratio=1,
        ),
        margin=dict(l=0, r=0, t=10, b=10),
        height=700,
        showlegend=False,
        hovermode="closest",
        dragmode=False,
    )

    return fig


# ── Team score display ────────────────────────────────────────────────────────

_COLOR_CSS = {
    "green":  ("#1a7f37", "#dafbe1"),
    "blue":   ("#0f62fe", "#dbeafe"),
    "yellow": ("#b45309", "#fef9c3"),
    "red":    ("#cf222e", "#fff0f0"),
}


def _render_team_score(players: List[Dict[str, Any]]) -> None:
    if len(players) < 11:
        return

    score  = calc_team_score(players)
    fg, bg = _COLOR_CSS.get(score.color, ("#333", "#f0f0f0"))
    stars  = "⭐" * score.stars + "☆" * (5 - score.stars)

    st.markdown("### Team Success Score")
    st.markdown(stars)
    st.markdown(
        f'<span style="font-size:2rem;font-weight:700;color:{fg}">'
        f'{score.finalScore}'
        f'<span style="font-size:1rem;color:#555"> / 100</span></span>',
        unsafe_allow_html=True,
    )
    st.progress(score.finalScore / 100)
    st.markdown(
        f'<div style="background:{bg};color:{fg};padding:0.5rem 1rem;'
        f'border-radius:6px;font-weight:600;display:inline-block;margin-top:4px;">'
        f'{score.label}</div>',
        unsafe_allow_html=True,
    )
    with st.expander("Score breakdown"):
        st.markdown(f"**Avg. form rating:** {score.averageForm:.2f} / 10")
        st.markdown(f"**Form contribution:** {(round(score.averageForm * 10) * 0.6):.1f} pts")
        st.markdown(f"**Balance bonus:** {score.balanceBonus} / 40 pts")


# ── Page renderer ─────────────────────────────────────────────────────────────

def render(players: List[Dict[str, Any]]) -> None:
    """Render the Team Formation Visualizer page."""
    st.title("🏟️ Team Formation Visualizer")

    # ── Formation + Generate controls ─────────────────────────────────────────
    formation_labels = [f.label for f in FORMATIONS]
    col1, col2 = st.columns([3, 1])

    with col1:
        chosen_label = st.radio(
            "Formation",
            formation_labels,
            horizontal=True,
            key="formation_radio",
        )

    formation = next((f for f in FORMATIONS if f.label == chosen_label), DEFAULT_FORMATION)
    st.caption(f"_{formation.description}_")

    with col2:
        generate_clicked = st.button("🎲 Generate Random Team", key="gen_team_btn")

    # ── Session state ──────────────────────────────────────────────────────────
    if (
        "team_players" not in st.session_state
        or generate_clicked
        or st.session_state.get("last_formation") != formation.key
    ):
        st.session_state["team_players"]   = generate_random_team(players, formation.slots)
        st.session_state["last_formation"] = formation.key
        st.session_state["pitch_player"]   = None

    team_players = st.session_state["team_players"]
    pitch_player = st.session_state.get("pitch_player")

    # ── Pitch figure + right panel ─────────────────────────────────────────────
    pitch_col, panel_col = st.columns([3, 2])

    with pitch_col:
        fig = _build_figure(
            team_players,
            formation,
            selected_name=pitch_player.get("name") if pitch_player else None,
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

        # Position colour legend (manual, since showlegend=False keeps the chart clean)
        legend_html = " &nbsp; ".join(
            f'<span style="display:inline-flex;align-items:center;gap:4px;">'
            f'<span style="width:10px;height:10px;border-radius:50%;'
            f'background:{col};display:inline-block;"></span>{pos}</span>'
            for pos, col in POS_COLORS.items()
        )
        st.markdown(
            f'<div style="font-size:0.8rem;color:#555;margin-top:-8px;">{legend_html}</div>',
            unsafe_allow_html=True,
        )

    with panel_col:
        st.markdown("**Select a player to view their card:**")

        # Row-by-row buttons
        if team_players:
            for row in formation.rows:
                row_players = team_players[row.start_index: row.start_index + row.count]
                if not row_players:
                    continue
                st.markdown(f"*{row.label}*")
                cols = st.columns(len(row_players))
                for idx, p in enumerate(row_players):
                    with cols[idx]:
                        is_active = (
                            pitch_player is not None
                            and pitch_player.get("name") == p.get("name")
                        )
                        btn_label = f"{'✅ ' if is_active else ''}{p.get('name', '?')}"
                        if st.button(btn_label, key=f"pitch_btn_{p.get('name')}"):
                            st.session_state["pitch_player"] = None if is_active else p
                            st.rerun()

        # Player detail card
        pitch_player = st.session_state.get("pitch_player")
        if pitch_player:
            st.markdown("---")
            photo_url = pitch_player.get("photo")
            if photo_url:
                st.image(photo_url, width=100)
            st.subheader(pitch_player.get("name", ""))
            st.markdown(f"**Position:** {pitch_player.get('position', '—')}")
            st.markdown(f"**Age:** {pitch_player.get('age', '—')}")
            st.markdown(f"**Nationality:** {pitch_player.get('citizenship', '—')}")
            st.markdown(f"**Club:** {pitch_player.get('club', '—')}")
            height = pitch_player.get("height")
            if height:
                st.markdown(f"**Height:** {height} cm")
            rating = pitch_player.get("form_rating") or pitch_player.get("rating")
            rating_str = f"{float(rating):.2f} / 10" if rating is not None else "—"
            st.markdown(f"**Form rating:** {rating_str}")
            if st.button("✕ Close", key="close_pitch_panel"):
                st.session_state["pitch_player"] = None
                st.rerun()

    # ── Team score ─────────────────────────────────────────────────────────────
    if len(team_players) >= 11:
        st.markdown("---")
        _render_team_score(team_players)
