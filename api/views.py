from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema

from .models import Member
from .serializers import (
    MessageSerializer,
    MemberSerializer,
    RegisterSerializer,
    LoginSerializer,
)


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
