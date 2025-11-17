from __future__ import annotations

from typing import Tuple

from .models import Member


def _expected_score(rating_a: int, rating_b: int) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))


def increment_win(member: Member) -> None:
    member.wins += 1


def increment_loss(member: Member) -> None:
    member.losses += 1


def increment_draw(member: Member) -> None:
    member.draws += 1


def increment_games_played(member: Member) -> None:
    member.games_played += 1


def elo_update(member_a: Member, member_b: Member, score_a: float, score_b: float, k: int = 32) -> Tuple[int, int]:
    """Update Elo ratings for two members in place and persist them.

    Args:
        member_a: First player (A).
        member_b: Second player (B).
        score_a: Actual score for A (1.0 win, 0.5 draw, 0.0 loss).
        score_b: Actual score for B (1.0 win, 0.5 draw, 0.0 loss).
        k: K-factor.

    Returns:
        Tuple of new integer ratings (rating_a, rating_b).
    """
    ra = member_a.rating
    rb = member_b.rating

    ea = _expected_score(ra, rb)
    eb = _expected_score(rb, ra)

    new_ra = round(ra + k * (score_a - ea))
    new_rb = round(rb + k * (score_b - eb))

    member_a.rating = int(new_ra)
    member_b.rating = int(new_rb)

    # Update counters
    increment_games_played(member_a)
    increment_games_played(member_b)

    if score_a > score_b:
        increment_win(member_a)
        increment_loss(member_b)
    elif score_b > score_a:
        increment_win(member_b)
        increment_loss(member_a)
    else:
        increment_draw(member_a)
        increment_draw(member_b)

    # Persist changes
    member_a.save(update_fields=[
        "rating", "games_played", "wins", "losses", "draws", "updated_at"
    ])
    member_b.save(update_fields=[
        "rating", "games_played", "wins", "losses", "draws", "updated_at"
    ])

    return member_a.rating, member_b.rating
