from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema

from .models import Member, Game
from .serializers import (
    MessageSerializer,
    MemberSerializer,
    RegisterSerializer,
    LoginSerializer,
    GameSerializer,
    CreateGameSerializer,
    MoveSerializer,
)
from .utils import elo_update


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: MessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(data)
        return Response(serializer.data)


def _get_or_create_auth_user_for_member(member: Member) -> User:
    """Create or retrieve a Django auth.User used only for Token auth mapping.
    We do not link Member with FK; username is deterministic: 'member_<id>'.
    """
    auth_username = f"member_{member.id}"
    user, created = User.objects.get_or_create(
        username=auth_username,
        defaults={"is_active": True},
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])
    return user


def _member_from_request(request) -> Member:
    """Resolve Member from authenticated request.user.

    By convention, auth.User.username == 'member_<id>'. If not resolvable, raise 403.
    """
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None  # type: ignore[return-value]
    username = str(user.username)
    member = None
    if username.startswith("member_"):
        try:
            member_id = int(username.split("_", 1)[1])
            member = Member.objects.filter(id=member_id).first()
        except Exception:  # pragma: no cover - safe guard
            member = None
    if member is None:
        # Fallback: try to map by same username (useful for admin/testing)
        member = Member.objects.filter(username=username).first()
    return member  # type: ignore[return-value]


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=RegisterSerializer,
        responses={200: MemberSerializer},
        description="Register a new member and return token and member info.",
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            member = Member(
                username=data["username"],
                display_name=data.get("display_name", ""),
            )
            member.set_password(data["password"])
            member.save()

            auth_user = _get_or_create_auth_user_for_member(member)
            token, _ = Token.objects.get_or_create(user=auth_user)

        member_payload = MemberSerializer(member).data
        return Response({"token": token.key, "member": member_payload}, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: MemberSerializer},
        description="Login with username and password. Returns token and member info.",
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            member = Member.objects.get(username=data["username"])
        except Member.DoesNotExist:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

        if not member.check_password(data["password"]):
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

        auth_user = _get_or_create_auth_user_for_member(member)
        token, _ = Token.objects.get_or_create(user=auth_user)

        member_payload = MemberSerializer(member).data
        return Response({"token": token.key, "member": member_payload}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={204: None},
        description="Logout by deleting current auth token.",
    )
    def post(self, request):
        token = getattr(request, "auth", None)
        if token is not None:
            # request.auth is a Token instance for TokenAuthentication
            if hasattr(token, "delete"):
                token.delete()
            else:
                # Fallback: if it's a key string
                Token.objects.filter(key=str(token)).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CreateGameView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=CreateGameSerializer, responses={201: GameSerializer})
    def post(self, request):
        member = _member_from_request(request)
        if member is None:
            return Response({"detail": "Member not found for authenticated user."}, status=status.HTTP_403_FORBIDDEN)
        game = Game.objects.create(
            creator=member,
            x_player=member,
            status=Game.Status.OPEN,
            next_turn=Game.Symbol.X,
        )
        return Response(GameSerializer(game).data, status=status.HTTP_201_CREATED)


class OpenGamesView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: GameSerializer(many=True)})
    def get(self, request):
        games = Game.objects.filter(status=Game.Status.OPEN, opponent__isnull=True).order_by("-created_at")
        data = GameSerializer(games, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class GameDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: GameSerializer, 404: None, 403: None})
    def get(self, request, game_id: int):
        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return Response({"detail": "Game not found."}, status=status.HTTP_404_NOT_FOUND)

        member = _member_from_request(request)
        if game.status == Game.Status.OPEN:
            # Auth required at route level, but open games are viewable by any authenticated user
            pass
        else:
            if member is None or not game.is_player(member):
                return Response({"detail": "You do not have access to this game."}, status=status.HTTP_403_FORBIDDEN)
        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)


class JoinGameView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: GameSerializer, 400: None, 403: None, 404: None})
    def post(self, request, game_id: int):
        member = _member_from_request(request)
        if member is None:
            return Response({"detail": "Member not found for authenticated user."}, status=status.HTTP_403_FORBIDDEN)

        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return Response({"detail": "Game not found."}, status=status.HTTP_404_NOT_FOUND)

        if game.status != Game.Status.OPEN or game.opponent is not None:
            return Response({"detail": "Game is not open for joining."}, status=status.HTTP_400_BAD_REQUEST)
        if game.creator_id == member.id:
            return Response({"detail": "Creator cannot join own game as opponent."}, status=status.HTTP_400_BAD_REQUEST)

        game.opponent = member
        game.o_player = member
        game.status = Game.Status.IN_PROGRESS
        game.started_at = timezone.now()
        game.save(update_fields=["opponent", "o_player", "status", "started_at", "updated_at"])

        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)


class MoveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=MoveSerializer, responses={200: GameSerializer, 400: None, 403: None, 404: None})
    def post(self, request, game_id: int):
        member = _member_from_request(request)
        if member is None:
            return Response({"detail": "Member not found for authenticated user."}, status=status.HTTP_403_FORBIDDEN)

        serializer = MoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        position = serializer.validated_data["position"]

        with transaction.atomic():
            try:
                game = Game.objects.select_for_update().get(pk=game_id)
            except Game.DoesNotExist:
                return Response({"detail": "Game not found."}, status=status.HTTP_404_NOT_FOUND)

            if game.status != Game.Status.IN_PROGRESS:
                return Response({"detail": "Game is not in progress."}, status=status.HTTP_400_BAD_REQUEST)
            if not game.is_player(member):
                return Response({"detail": "You are not a participant of this game."}, status=status.HTTP_403_FORBIDDEN)

            # Determine player's symbol
            if game.x_player_id == member.id:
                symbol = Game.Symbol.X
            elif game.o_player_id == member.id:
                symbol = Game.Symbol.O
            else:
                return Response({"detail": "You are not assigned a symbol in this game."}, status=status.HTTP_403_FORBIDDEN)

            if game.next_turn != symbol:
                return Response({"detail": "It's not your turn."}, status=status.HTTP_400_BAD_REQUEST)

            board = list(game.board or [""] * 9)
            if position < 0 or position > 8:
                return Response({"detail": "Position must be between 0 and 8."}, status=status.HTTP_400_BAD_REQUEST)
            if board[position] != "":
                return Response({"detail": "Cell is already occupied."}, status=status.HTTP_400_BAD_REQUEST)

            # Place symbol
            board[position] = symbol
            game.board = board

            # Append move
            moves = list(game.moves or [])
            moves.append({
                "position": position,
                "symbol": symbol,
                "member_id": member.id,
                "timestamp": timezone.now().isoformat(),
            })
            game.moves = moves

            # Check winner or draw
            winner = Game.check_winner(board)
            finished_now = False
            if winner is not None:
                game.result = Game.Result.X_WIN if winner == Game.Symbol.X else Game.Result.O_WIN
                game.status = Game.Status.FINISHED
                game.finished_at = timezone.now()
                finished_now = True
            else:
                # Draw if no empty cells
                if all(cell != "" for cell in board):
                    game.result = Game.Result.DRAW
                    game.status = Game.Status.FINISHED
                    game.finished_at = timezone.now()
                    finished_now = True

            # Toggle next turn if not finished
            if not finished_now:
                game.next_turn = Game.Symbol.O if symbol == Game.Symbol.X else Game.Symbol.X

            # Process Elo once when game finishes
            if finished_now and not game.rating_processed and game.x_player_id and game.o_player_id:
                x_member = game.x_player
                o_member = game.o_player
                if game.result == Game.Result.X_WIN:
                    elo_update(x_member, o_member, 1.0, 0.0)
                elif game.result == Game.Result.O_WIN:
                    elo_update(x_member, o_member, 0.0, 1.0)
                else:
                    elo_update(x_member, o_member, 0.5, 0.5)
                game.rating_processed = True

            game.save()

        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)


class CloseGameView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: GameSerializer, 400: None, 403: None, 404: None})
    def post(self, request, game_id: int):
        member = _member_from_request(request)
        if member is None:
            return Response({"detail": "Member not found for authenticated user."}, status=status.HTTP_403_FORBIDDEN)
        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return Response({"detail": "Game not found."}, status=status.HTTP_404_NOT_FOUND)

        if game.creator_id != member.id:
            return Response({"detail": "Only the creator can close the game."}, status=status.HTTP_403_FORBIDDEN)
        if game.status not in (Game.Status.OPEN, Game.Status.FINISHED):
            return Response({"detail": "Only open or finished games can be closed."}, status=status.HTTP_400_BAD_REQUEST)

        game.status = Game.Status.CLOSED
        game.save(update_fields=["status", "updated_at"])
        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)


class RematchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={201: GameSerializer, 400: None, 403: None, 404: None})
    def post(self, request, game_id: int):
        member = _member_from_request(request)
        if member is None:
            return Response({"detail": "Member not found for authenticated user."}, status=status.HTTP_403_FORBIDDEN)
        try:
            old = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return Response({"detail": "Game not found."}, status=status.HTTP_404_NOT_FOUND)

        if old.status != Game.Status.FINISHED:
            return Response({"detail": "Rematch is available only for finished games."}, status=status.HTTP_400_BAD_REQUEST)
        if not old.is_player(member):
            return Response({"detail": "Only participants can request a rematch."}, status=status.HTTP_403_FORBIDDEN)
        if old.creator is None or old.opponent is None or old.x_player is None or old.o_player is None:
            return Response({"detail": "Game participants are not fully defined."}, status=status.HTTP_400_BAD_REQUEST)

        # Swap symbols for next game, keep same creator/opponent
        new_game = Game.objects.create(
            creator=old.creator,
            opponent=old.opponent,
            x_player=old.o_player,
            o_player=old.x_player,
            status=Game.Status.IN_PROGRESS,
            next_turn=Game.Symbol.X,
            started_at=timezone.now(),
        )
        return Response(GameSerializer(new_game).data, status=status.HTTP_201_CREATED)
