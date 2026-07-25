"""
Team score calculation — port of src/utils/teamScore.js.

calcTeamScore(players) -> dict with keys:
    finalScore, averageForm, balanceBonus, stars, label, color
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class TeamScoreResult:
    finalScore: int
    averageForm: float
    balanceBonus: int
    stars: int
    label: str
    color: str  # 'green' | 'blue' | 'yellow' | 'red'


def _calc_average_form(players: List[dict]) -> float:
    rated = [p for p in players if (p.get("form_rating") or p.get("rating")) is not None]
    rated = [p for p in rated if _as_num(p.get("form_rating") or p.get("rating")) is not None]
    if not rated:
        return 0.0
    total = sum(_as_num(p.get("form_rating") or p.get("rating")) for p in rated)
    return total / len(rated)


def _calc_balance_bonus(players: List[dict]) -> int:
    counts = {"Goalkeeper": 0, "Defender": 0, "Midfielder": 0, "Attacker": 0}
    for p in players:
        pos = p.get("position", "")
        if pos in counts:
            counts[pos] += 1

    gk_bonus  = 10 if counts["Goalkeeper"] == 1 else 4
    def_bonus = 10 if 3 <= counts["Defender"] <= 5 else 4
    mid_bonus = 10 if 3 <= counts["Midfielder"] <= 5 else 4
    fwd_bonus = 10 if 1 <= counts["Attacker"] <= 3 else 4

    return gk_bonus + def_bonus + mid_bonus + fwd_bonus  # max 40


def _calc_final_score(average_form: float, balance_bonus: int) -> int:
    raw = round(average_form * 10) * 0.6 + balance_bonus
    return int(min(100, max(0, round(raw))))


def _score_label(score: int) -> str:
    if score >= 90:
        return "Elite squad with excellent balance."
    if score >= 80:
        return "Strong chance of success based on the selected squad."
    if score >= 70:
        return "Competitive team with good potential."
    if score >= 60:
        return "Average performance expected."
    return "Needs improvement."


def _score_color(score: int) -> str:
    if score >= 90:
        return "green"
    if score >= 80:
        return "blue"
    if score >= 70:
        return "yellow"
    return "red"


def _score_stars(score: int) -> int:
    return max(1, round(score / 20))


def _as_num(v) -> Optional[float]:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def calc_team_score(players: List[dict]) -> TeamScoreResult:
    """Calculate the Team Success Score for an 11-player list."""
    average_form  = _calc_average_form(players)
    balance_bonus = _calc_balance_bonus(players)
    final_score   = _calc_final_score(average_form, balance_bonus)

    return TeamScoreResult(
        finalScore=final_score,
        averageForm=average_form,
        balanceBonus=balance_bonus,
        stars=_score_stars(final_score),
        label=_score_label(final_score),
        color=_score_color(final_score),
    )
