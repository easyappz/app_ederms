from django.db import models
from django.contrib.auth.hashers import make_password, check_password


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

    def __str__(self) -> str:
        return self.display_name or self.username

    def set_password(self, raw_password: str) -> None:
        """Hash and set the password for the member."""
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Verify the provided password against the stored hash."""
        return check_password(raw_password, self.password_hash)
