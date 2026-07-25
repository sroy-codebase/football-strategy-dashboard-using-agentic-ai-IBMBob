# Football Player Dashboard — Streamlit

A Python/Streamlit conversion of the original React + IBM Carbon application.

> **Note:** Streamlit uses a fundamentally different rendering model from React.
> The layout and interaction patterns differ accordingly:
> - Navigation is a sidebar radio instead of a top header nav bar.
> - State is managed via `st.session_state` instead of React `useState`.
> - The pitch SVG is rendered as inline HTML; player selection uses buttons
>   below the pitch rather than click-on-SVG (Streamlit cannot handle SVG click events).

---

## Project structure

```
streamlit_app/
├── app.py                  # Entry point — sidebar nav + page dispatch
├── players.json            # Player data (copied from src/data/players.json)
├── requirements.txt
├── utils/
│   ├── __init__.py
│   ├── formations.py       # Formation definitions + random team generator
│   └── team_score.py       # Team success score calculator
└── pages/
    ├── __init__.py
    ├── player_browser.py   # Player Browser page
    ├── team_formation.py   # Team Formation Visualizer page
    └── compare_players.py  # Compare Players page
```

---

## Requirements

- Python 3.9+
- [Streamlit](https://streamlit.io) 1.35+

---

## Quick start

```bash
# 1. Create and activate a virtual environment (optional but recommended)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r streamlit_app/requirements.txt

# 3. Run the app
streamlit run streamlit_app/app.py
```

The app opens at **http://localhost:8501** by default.

---

## Pages

| Page | Description |
|------|-------------|
| **Player Browser** | Search, filter by position, sort, and view a detailed player card. |
| **Team Formation** | Pick a formation (4-4-2, 4-3-3, 3-5-2, 4-2-3-1, 3-4-3, 5-3-2), generate a random XI, view an SVG pitch, click a player name to see their card, and get a Team Success Score. |
| **Compare Players** | Select two players side-by-side and view a colour-coded stat comparison table. |

---

## Differences from the React version

| Feature | React (Carbon) | Streamlit |
|---------|---------------|-----------|
| Navigation | Top header bar | Sidebar radio buttons |
| Search | ComboBox with auto-suggest | `st.text_input` with live filtering |
| Pitch interaction | SVG click on token | Buttons below the pitch |
| Animations | CSS/JS progress bar | `st.progress` |
| Styling | IBM Carbon Design System | Streamlit default theme |
