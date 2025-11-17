from __future__ import annotations

from typing import List, Optional

from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class Member(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=128)
    display_name = models.CharField(max_length=150, blank=True)
    rating = models.IntegerField(default=1200)
    games_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-rating", "username"]

    def __str__(self) -> str:  # pragma: no cover - simple representation
        return self.display_name or self.username

    def set_password(self, raw_password: str) -> None:
        """Hash and set the password for the member."""
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Verify the provided password against the stored hash."""
        return check_password(raw_password, self.password_hash)


def default_board() -> List[str]:
    """Return a fresh empty tic-tac-toe board."""
    return ["", "", "", "", "", "", "", "", ""]


class Game(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "open"
        IN_PROGRESS = "in_progress", "in_progress"
        FINISHED = "finished", "finished"
        CLOSED = "closed", "closed"

    class Result(models.TextChoices):
        X_WIN = "x_win", "x_win"
        O_WIN = "o_win", "o_win"
        DRAW = "draw", "draw"

    class Symbol(models.TextChoices):
        X = "X", "X"
        O = "O", "O"

    creator = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name="created_games",
    )
    opponent = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="joined_games",
    )

    x_player = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="x_games",
    )
    o_player = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="o_games",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )

    board = models.JSONField(default=default_board)
    next_turn = models.CharField(
        max_length=1,
        choices=Symbol.choices,
        null=True,
    )
    result = models.CharField(
        max_length=10,
        choices=Result.choices,
        null=True,
        blank=True,
    )
    moves = models.JSONField(default=list)

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    rating_processed = models.BooleanField(default=False)

    def is_open(self) -> bool:
        return self.status == Game.Status.OPEN

    def is_player(self, member: Optional[Member]) -> bool:
        if member is None:
            return False
        return member == self.x_player or member == self.o_player

    def winner_symbol(self) -> Optional[str]:
        if self.result == Game.Result.X_WIN:
            return Game.Symbol.X
        if self.result == Game.Result.O_WIN:
            return Game.Symbol.O
        # Fallback: infer from current board
        return Game.check_winner(self.board)

    @staticmethod
    def check_winner(board: List[str]) -> Optional[str]:
        """Return 'X' or 'O' if there is a winner on the board, else None.

        The board is a list of 9 strings: "X", "O" or "".
        Indexes:
        0 1 2
        3 4 5
        6 7 8
        """
        lines = [
            (0, 1, 2), (3, 4, 5), (6, 7, 8),  # rows
            (0, 3, 6), (1, 4, 7), (2, 5, 8),  # cols
            (0, 4, 8), (2, 4, 6),            # diagonals
        ]
        for a, b, c in lines:
            s = board[a]
            if s != "" and s == board[b] and s == board[c]:
                return s
        return None

    def __str__(self) -> str:  # pragma: no cover - representation only
        return f"Game #{self.pk} ({self.status})"
