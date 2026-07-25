"""
Formations data and random-team generator — port of
src/utils/formations.js + src/utils/teamGenerator.js.
"""

from __future__ import annotations
import random
from dataclasses import dataclass, field
from typing import List, Dict, Any


# ── Data types ────────────────────────────────────────────────────────────────

@dataclass
class FormationRow:
    label: str
    count: int
    start_index: int


@dataclass
class Slot:
    position: str
    count: int


@dataclass
class Formation:
    key: str
    label: str
    description: str
    rows: List[FormationRow]
    shirt_numbers: List[int]
    slots: List[Slot]


# ── Formation definitions ─────────────────────────────────────────────────────

FORMATIONS: List[Formation] = [
    Formation(
        key="4-4-2",
        label="4-4-2",
        description="Classic flat midfield",
        rows=[
            FormationRow("FWD", 2, 0),
            FormationRow("MID", 4, 2),
            FormationRow("DEF", 4, 6),
            FormationRow("GK",  1, 10),
        ],
        shirt_numbers=[10, 11, 6, 7, 8, 9, 2, 3, 4, 5, 1],
        slots=[
            Slot("Attacker",   2),
            Slot("Midfielder", 4),
            Slot("Defender",   4),
            Slot("Goalkeeper", 1),
        ],
    ),
    Formation(
        key="4-3-3",
        label="4-3-3",
        description="Attacking wide play",
        rows=[
            FormationRow("FWD", 3, 0),
            FormationRow("MID", 3, 3),
            FormationRow("DEF", 4, 6),
            FormationRow("GK",  1, 10),
        ],
        shirt_numbers=[9, 10, 11, 6, 7, 8, 2, 3, 4, 5, 1],
        slots=[
            Slot("Attacker",   3),
            Slot("Midfielder", 3),
            Slot("Defender",   4),
            Slot("Goalkeeper", 1),
        ],
    ),
    Formation(
        key="3-5-2",
        label="3-5-2",
        description="Wing-backs with double pivot",
        rows=[
            FormationRow("FWD", 2, 0),
            FormationRow("MID", 5, 2),
            FormationRow("DEF", 3, 7),
            FormationRow("GK",  1, 10),
        ],
        shirt_numbers=[10, 11, 6, 7, 8, 9, 5, 2, 3, 4, 1],
        slots=[
            Slot("Attacker",   2),
            Slot("Midfielder", 5),
            Slot("Defender",   3),
            Slot("Goalkeeper", 1),
        ],
    ),
    Formation(
        key="4-2-3-1",
        label="4-2-3-1",
        description="Double pivot with a number 10",
        rows=[
            FormationRow("ST",  1, 0),
            FormationRow("CAM", 3, 1),
            FormationRow("CDM", 2, 4),
            FormationRow("DEF", 4, 6),
            FormationRow("GK",  1, 10),
        ],
        shirt_numbers=[9, 10, 7, 11, 6, 8, 2, 3, 4, 5, 1],
        slots=[
            Slot("Attacker",   1),
            Slot("Attacker",   3),  # attacking mids treated as attackers
            Slot("Midfielder", 2),
            Slot("Defender",   4),
            Slot("Goalkeeper", 1),
        ],
    ),
    Formation(
        key="3-4-3",
        label="3-4-3",
        description="High press, three at the back",
        rows=[
            FormationRow("FWD", 3, 0),
            FormationRow("MID", 4, 3),
            FormationRow("DEF", 3, 7),
            FormationRow("GK",  1, 10),
        ],
        shirt_numbers=[9, 10, 11, 6, 7, 8, 5, 2, 3, 4, 1],
        slots=[
            Slot("Attacker",   3),
            Slot("Midfielder", 4),
            Slot("Defender",   3),
            Slot("Goalkeeper", 1),
        ],
    ),
    Formation(
        key="5-3-2",
        label="5-3-2",
        description="Compact defensive block",
        rows=[
            FormationRow("FWD", 2, 0),
            FormationRow("MID", 3, 2),
            FormationRow("DEF", 5, 5),
            FormationRow("GK",  1, 10),
        ],
        shirt_numbers=[10, 11, 6, 7, 8, 2, 3, 4, 5, 9, 1],
        slots=[
            Slot("Attacker",   2),
            Slot("Midfielder", 3),
            Slot("Defender",   5),
            Slot("Goalkeeper", 1),
        ],
    ),
]

DEFAULT_FORMATION: Formation = FORMATIONS[0]

FORMATION_MAP: Dict[str, Formation] = {f.key: f for f in FORMATIONS}


# ── Team generator ────────────────────────────────────────────────────────────

def generate_random_team(
    players: List[Dict[str, Any]],
    slots: List[Slot],
) -> List[Dict[str, Any]]:
    """
    Build an 11-player team for the given formation slots, picking random
    players from the appropriate position pool for each slot.
    """
    # Pre-bucket and shuffle each position pool once
    by_position: Dict[str, List[Dict[str, Any]]] = {}
    for slot in slots:
        if slot.position not in by_position:
            pool = [p for p in players if p.get("position") == slot.position]
            random.shuffle(pool)
            by_position[slot.position] = pool

    used: Dict[str, int] = {}
    result: List[Dict[str, Any]] = []

    for slot in slots:
        pos = slot.position
        used.setdefault(pos, 0)
        pool = by_position[pos]
        result.extend(pool[used[pos]: used[pos] + slot.count])
        used[pos] += slot.count

    return result
