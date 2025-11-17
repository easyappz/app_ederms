from django.urls import path
from .views import (
    HelloView,
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    MyGamesView,
    LeaderboardView,
    CreateGameView,
    OpenGamesView,
    GameDetailView,
    JoinGameView,
    MoveView,
    CloseGameView,
    RematchView,
)

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),

    # Profile & stats
    path("me", MeView.as_view(), name="me"),
    path("my/games", MyGamesView.as_view(), name="my-games"),
    path("leaderboard", LeaderboardView.as_view(), name="leaderboard"),

    # Games
    path("games", CreateGameView.as_view(), name="games-create"),
    path("games/open", OpenGamesView.as_view(), name="games-open"),
    path("games/<int:game_id>", GameDetailView.as_view(), name="games-detail"),
    path("games/<int:game_id>/join", JoinGameView.as_view(), name="games-join"),
    path("games/<int:game_id>/move", MoveView.as_view(), name="games-move"),
    path("games/<int:game_id>/close", CloseGameView.as_view(), name="games-close"),
    path("games/<int:game_id>/rematch", RematchView.as_view(), name="games-rematch"),
]
