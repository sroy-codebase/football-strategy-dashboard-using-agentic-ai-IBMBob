"""
Player Browser page — port of the 'browser' page in App.jsx.

Allows filtering, sorting, searching, and viewing an individual player card.
"""

from __future__ import annotations
import streamlit as st
import pandas as pd
from typing import List, Dict, Any


POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Attacker"]

SORT_OPTIONS = {
    "Name (A → Z)":          ("name",        True),
    "Name (Z → A)":          ("name",        False),
    "Rating (high → low)":   ("form_rating", False),
    "Rating (low → high)":   ("form_rating", True),
    "Age (youngest first)":  ("age",         True),
    "Age (oldest first)":    ("age",         False),
}


def _format_rating(v) -> str:
    if v is None:
        return "—"
    try:
        return f"{float(v):.1f} / 10"
    except (TypeError, ValueError):
        return "—"


def _form_description(form_rating) -> str | None:
    if form_rating is None:
        return None
    try:
        r = float(form_rating)
    except (TypeError, ValueError):
        return None
    if r >= 8.0:
        return "in strong form"
    if r >= 6.0:
        return "showing consistent form"
    return "building form"


def _build_summary(player: Dict[str, Any]) -> str:
    parts = []
    name  = player.get("player_name") or player.get("name") or ""
    pos   = player.get("position", "")
    age   = player.get("age")
    nat   = player.get("citizenship", "")
    club  = player.get("current_club_name") or player.get("club") or ""
    form  = player.get("form_rating")

    if name:
        parts.append(name)

    descriptors = []
    if pos:
        descriptors.append(f"a {pos}")
    if age is not None:
        descriptors.append(f"{age} years old")
    if nat:
        descriptors.append(f"from {nat}")
    if descriptors:
        prefix = "is " if parts else ""
        parts.append(prefix + ", ".join(descriptors))

    if club:
        parts.append(f"currently playing for {club}")

    form_desc = _form_description(form)
    if form_desc:
        parts.append(f"and is {form_desc}")

    sentence = " ".join(parts).rstrip(".") + "." if parts else ""
    return sentence + " This profile is based on the available dataset only."


def _apply_filters(
    players: List[Dict[str, Any]],
    search: str,
    position: str,
    sort_label: str,
) -> List[Dict[str, Any]]:
    q = search.strip().lower()

    # Filter by position
    filtered = [p for p in players if not position or p.get("position") == position]

    # Filter by search query (name, club, nationality)
    if q:
        def matches(p: Dict[str, Any]) -> bool:
            return (
                q in (p.get("name") or "").lower()
                or q in (p.get("citizenship") or "").lower()
                or q in (p.get("club") or "").lower()
            )
        filtered = [p for p in filtered if matches(p)]

    # Sort
    field, ascending = SORT_OPTIONS.get(sort_label, ("name", True))
    filtered.sort(
        key=lambda p: (p.get(field) is None, p.get(field) or ""),
        reverse=not ascending,
    )

    return filtered


def _render_player_card(player: Dict[str, Any]) -> None:
    """Render a styled player card using Streamlit columns and markdown."""
    col_img, col_info = st.columns([1, 2])

    with col_img:
        photo_url = player.get("photo")
        if photo_url:
            st.image(photo_url, width=130)

    with col_info:
        st.subheader(player.get("name", "Unknown"))

        stats = [
            ("Position",    player.get("position")),
            ("Age",         player.get("age")),
            ("Nationality", player.get("citizenship")),
            ("Club",        player.get("club")),
            ("Form rating", _format_rating(player.get("rating") or player.get("form_rating"))),
        ]
        for label, value in stats:
            display = str(value) if value is not None else "—"
            st.markdown(f"**{label}:** {display}")

    st.divider()
    st.caption("Player Summary")
    st.info(_build_summary(player))
    st.caption("This summary is based only on the loaded dataset.")


def render(players: List[Dict[str, Any]]) -> None:
    """Render the Player Browser page."""
    st.title("⚽ Player Browser")

    # ── Filters ───────────────────────────────────────────────────────────────
    with st.container():
        col1, col2, col3 = st.columns(3)

        with col1:
            search = st.text_input(
                "Search",
                placeholder="Name, club or nationality…",
                key="browser_search",
            )

        with col2:
            position_choices = ["All positions"] + POSITIONS
            position_sel     = st.selectbox(
                "Filter by position",
                position_choices,
                key="browser_position",
            )
            position = "" if position_sel == "All positions" else position_sel

        with col3:
            sort_label = st.selectbox(
                "Sort by",
                list(SORT_OPTIONS.keys()),
                key="browser_sort",
            )

    # ── Filtered list ─────────────────────────────────────────────────────────
    filtered = _apply_filters(players, search, position, sort_label)

    # Reset button
    if st.button("↺ Reset filters", key="browser_reset"):
        st.session_state.pop("browser_search",   None)
        st.session_state.pop("browser_position", None)
        st.session_state.pop("browser_sort",     None)
        st.session_state.pop("browser_player",   None)
        st.rerun()

    st.caption(f"{len(filtered)} player(s) found")

    # ── Player picker ─────────────────────────────────────────────────────────
    player_names = [p["name"] for p in filtered]
    selection = st.selectbox(
        "Choose a player",
        ["— select a player —"] + player_names,
        key="browser_player",
    )

    # ── Player card ───────────────────────────────────────────────────────────
    if selection and selection != "— select a player —":
        player = next((p for p in filtered if p["name"] == selection), None)
        if player:
            st.markdown("---")
            _render_player_card(player)
