from rest_framework import serializers
from .models import Member, Game


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=200)
    timestamp = serializers.DateTimeField(read_only=True)


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "username",
            "display_name",
            "rating",
            "games_played",
            "wins",
            "losses",
            "draws",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class MemberPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "username",
            "display_name",
            "rating",
            "games_played",
            "wins",
            "losses",
            "draws",
        ]
        read_only_fields = fields


class MemberMeUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=150, required=True, allow_blank=True)

    def update(self, instance: Member, validated_data):
        instance.display_name = validated_data.get("display_name", instance.display_name)
        instance.save(update_fields=["display_name", "updated_at"])
        return instance

    def create(self, validated_data):  # pragma: no cover - not used
        raise NotImplementedError("Use this serializer for updates only.")


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_username(self, value: str) -> str:
        if Member.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=1, max_length=128)


class GameSerializer(serializers.ModelSerializer):
    creator_username = serializers.SerializerMethodField()
    opponent_username = serializers.SerializerMethodField()
    x_player_username = serializers.SerializerMethodField()
    o_player_username = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "id",
            "creator",
            "opponent",
            "x_player",
            "o_player",
            "status",
            "board",
            "next_turn",
            "result",
            "moves",
            "started_at",
            "finished_at",
            "created_at",
            "updated_at",
            "rating_processed",
            # denormalized
            "creator_username",
            "opponent_username",
            "x_player_username",
            "o_player_username",
        ]
        read_only_fields = fields

    def _username(self, member: Member | None) -> str | None:
        return None if member is None else member.username

    def get_creator_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.creator)

    def get_opponent_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.opponent)

    def get_x_player_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.x_player)

    def get_o_player_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.o_player)


class GameShortSerializer(serializers.ModelSerializer):
    creator_username = serializers.SerializerMethodField()
    opponent_username = serializers.SerializerMethodField()
    x_player_username = serializers.SerializerMethodField()
    o_player_username = serializers.SerializerMethodField()
    outcome = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "id",
            "status",
            "result",
            "created_at",
            "finished_at",
            "creator_username",
            "opponent_username",
            "x_player_username",
            "o_player_username",
            "outcome",
        ]
        read_only_fields = fields

    def _username(self, member: Member | None) -> str | None:
        return None if member is None else member.username

    def get_creator_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.creator)

    def get_opponent_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.opponent)

    def get_x_player_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.x_player)

    def get_o_player_username(self, obj: Game) -> str | None:  # type: ignore[override]
        return self._username(obj.o_player)

    def get_outcome(self, obj: Game) -> str | None:  # type: ignore[override]
        member: Member | None = self.context.get("member")
        # In-progress (includes open)
        if obj.status in (Game.Status.OPEN, Game.Status.IN_PROGRESS):
            return "in_progress"
        # Finished
        if obj.result == Game.Result.DRAW:
            return "draw"
        # If we do not have the member in context, we cannot compute win/loss reliably
        if member is None:
            return None
        # Determine winner symbol
        winner_symbol = Game.Symbol.X if obj.result == Game.Result.X_WIN else Game.Symbol.O
        if obj.x_player_id == member.id and winner_symbol == Game.Symbol.X:
            return "win"
        if obj.o_player_id == member.id and winner_symbol == Game.Symbol.O:
            return "win"
        return "loss"


class CreateGameSerializer(serializers.Serializer):
    """
    Empty serializer for create-game endpoint (no body required).
    """
    pass


class MoveSerializer(serializers.Serializer):
    position = serializers.IntegerField(min_value=0, max_value=8)
