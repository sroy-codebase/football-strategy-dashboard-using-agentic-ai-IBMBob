"""
Compare Players page — port of PlayerCompare.jsx.

Side-by-side stat comparison with win/lose highlighting.
"""

from __future__ import annotations
import streamlit as st
from typing import List, Dict, Any, Optional

COMPARE_STATS = [
    {"label": "Position",    "key": "position",    "numeric": False},
    {"label": "Age",         "key": "age",         "numeric": True,  "higher_is_better": False},
    {"label": "Nationality", "key": "citizenship", "numeric": False},
    {"label": "Club",        "key": "club",        "numeric": False},
    {"label": "Height (cm)", "key": "height",      "numeric": True,  "higher_is_better": True},
    {"label": "Form rating", "key": "form_rating", "numeric": True,  "higher_is_better": True},
]


def _fmt(value, key: str) -> str:
    if value is None:
        return "—"
    if key == "form_rating":
        try:
            return f"{float(value):.2f}"
        except (TypeError, ValueError):
            return "—"
    return str(value)


def _diff_result(a, b, higher_is_better: bool) -> Optional[str]:
    """Returns 'better', 'worse', 'equal', or None."""
    if a is None or b is None:
        return None
    try:
        a_n, b_n = float(a), float(b)
    except (TypeError, ValueError):
        return None
    if a_n == b_n:
        return "equal"
    left_wins = (a_n > b_n) if higher_is_better else (a_n < b_n)
    return "better" if left_wins else "worse"


def _player_card_mini(player: Optional[Dict[str, Any]], slot: str) -> None:
    """Render a compact header card for one player column."""
    if player is None:
        st.caption(f"*Player {slot} — no player selected*")
        return

    photo = player.get("photo")
    if photo:
        st.image(photo, width=90)
    st.markdown(f"**{player.get('name', '—')}**")


def render(players: List[Dict[str, Any]]) -> None:
    """Render the Compare Players page."""
    st.title("📊 Compare Players")

    player_names = [p["name"] for p in players]

    col_a, col_vs, col_b = st.columns([5, 1, 5])

    with col_a:
        name_a = st.selectbox(
            "Player A",
            ["— select —"] + player_names,
            key="compare_player_a",
        )

    with col_vs:
        st.markdown("<br><br><h3 style='text-align:center'>VS</h3>", unsafe_allow_html=True)

    with col_b:
        name_b = st.selectbox(
            "Player B",
            ["— select —"] + player_names,
            key="compare_player_b",
        )

    player_a = next((p for p in players if p["name"] == name_a), None)
    player_b = next((p for p in players if p["name"] == name_b), None)

    if player_a is None and player_b is None:
        st.info("Select two players to compare their stats.")
        return

    # ── Player header cards ───────────────────────────────────────────────────
    st.markdown("---")
    hdr_a, hdr_vs, hdr_b = st.columns([5, 1, 5])
    with hdr_a:
        _player_card_mini(player_a, "A")
    with hdr_vs:
        st.write("")
    with hdr_b:
        _player_card_mini(player_b, "B")

    # ── Stat comparison table ─────────────────────────────────────────────────
    st.markdown("---")
    st.markdown("### Stat Comparison")

    # Build header
    header = st.columns([3, 2, 3])
    header[0].markdown(f"**{player_a['name'] if player_a else '—'}**")
    header[1].markdown("**Stat**")
    header[2].markdown(f"**{player_b['name'] if player_b else '—'}**")

    st.markdown("---")

    WIN_STYLE  = "background-color:#d1fae5;padding:4px 8px;border-radius:4px;font-weight:600;"
    LOSE_STYLE = "background-color:#fee2e2;padding:4px 8px;border-radius:4px;"
    BASE_STYLE = "padding:4px 8px;"

    for stat in COMPARE_STATS:
        key  = stat["key"]
        lv   = player_a.get(key) if player_a else None
        rv   = player_b.get(key) if player_b else None
        diff = _diff_result(lv, rv, stat.get("higher_is_better", True)) if stat["numeric"] else None

        l_style = WIN_STYLE  if diff == "better" else (LOSE_STYLE if diff == "worse" else BASE_STYLE)
        r_style = WIN_STYLE  if diff == "worse"  else (LOSE_STYLE if diff == "better" else BASE_STYLE)

        row = st.columns([3, 2, 3])
        row[0].markdown(f'<div style="{l_style}">{_fmt(lv, key)}</div>', unsafe_allow_html=True)
        row[1].markdown(f'<div style="text-align:center;padding:4px 8px;color:#555;font-size:0.85em">{stat["label"]}</div>', unsafe_allow_html=True)
        row[2].markdown(f'<div style="{r_style}">{_fmt(rv, key)}</div>', unsafe_allow_html=True)

    # Legend
    st.markdown("---")
    st.caption("🟢 Green = better stat &nbsp;|&nbsp; 🔴 Red = worse stat &nbsp;|&nbsp; (numeric stats only)")
