"""
Football Player Dashboard — Streamlit entry point.

Replaces the React/Carbon application with a Python-native Streamlit UI.

Run:
    cd streamlit_app
    streamlit run app.py
"""

from __future__ import annotations
import json
import os
import sys
import streamlit as st

# ── Make sure sibling packages are importable ─────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from pages import player_browser, team_formation, compare_players


# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Football Player Dashboard",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Hide Streamlit's default sidebar page-nav list ────────────────────────────
st.markdown(
    """
    <style>
    [data-testid="stSidebarNav"] {display: none;}
    </style>
    """,
    unsafe_allow_html=True,
)


# ── Load data (cached so it is read only once) ────────────────────────────────
@st.cache_data
def load_players():
    data_path = os.path.join(os.path.dirname(__file__), "players.json")
    with open(data_path, encoding="utf-8") as fh:
        return json.load(fh)


players = load_players()


# ── Sidebar navigation ────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## ⚽ Football")
    st.markdown("### Player Dashboard")
    st.markdown("---")

    page = st.radio(
        "Navigate",
        ["Player Browser", "Team Formation", "Compare Players"],
        key="nav_page",
        label_visibility="collapsed",
    )

    st.markdown("---")
    st.caption(f"📋 {len(players)} players loaded")
    st.caption("Data source: players.json")


# ── Page dispatch ─────────────────────────────────────────────────────────────
if page == "Player Browser":
    player_browser.render(players)
elif page == "Team Formation":
    team_formation.render(players)
elif page == "Compare Players":
    compare_players.render(players)
