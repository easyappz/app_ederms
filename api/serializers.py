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


class CreateGameSerializer(serializers.Serializer):
    """
    Empty serializer for create-game endpoint (no body required).
    """
    pass


class MoveSerializer(serializers.Serializer):
    position = serializers.IntegerField(min_value=0, max_value=8)
