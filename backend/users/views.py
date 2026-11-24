from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

import logging

from django.conf import settings
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.throttling import ScopedRateThrottle

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    CloseAccountSerializer,
    DetailSerializer,
    AuthResponseSerializer,
    TokenPairSerializer,
)
from .auth import issue_refresh, token_payload

User = get_user_model()
logger = logging.getLogger(__name__)


class CustomLoginView(TokenObtainPairView):
    """Custom login view that returns user data along with tokens"""
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema_view(post=extend_schema(
    summary="Register a customer account",
    request=RegisterSerializer,
    responses={201: AuthResponseSerializer},
))
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = issue_refresh(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    get=extend_schema(summary="Current user", responses=UserSerializer),
    patch=extend_schema(
        summary="Update profile and notification preferences",
        request=ProfileUpdateSerializer,
        responses=UserSerializer,
    ),
)
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


@extend_schema_view(post=extend_schema(
    summary="Change password (signs out other devices)",
    request=ChangePasswordSerializer,
    responses={200: TokenPairSerializer},
))
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_change"

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.token_version += 1  # sign out every other device
        user.save(update_fields=["password", "token_version"])
        # Fresh tokens so the device making the change stays signed in.
        return Response(
            {"detail": "Your password has been changed.", **token_payload(user)}
        )


@extend_schema_view(post=extend_schema(
    summary="Sign out on all devices",
    request=None,
    responses={200: DetailSerializer},
))
class SignOutEverywhereView(APIView):
    """Invalidate every token issued to this user, on all devices."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.token_version += 1
        user.save(update_fields=["token_version"])
        return Response({"detail": "You have been signed out on all devices."})


@extend_schema_view(post=extend_schema(
    summary="Close (deactivate) the account - customers only",
    request=CloseAccountSerializer,
    responses={200: DetailSerializer},
))
class CloseAccountView(APIView):
    """Deactivate the account. Tickets and history are kept."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_change"

    def post(self, request):
        user = request.user
        if user.role != User.ROLE_CUSTOMER:
            return Response(
                {"detail": "Agent and administrator accounts are closed by an administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = CloseAccountSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user.is_active = False
        user.token_version += 1
        user.save(update_fields=["is_active", "token_version"])
        return Response({"detail": "Your account has been closed."})



@extend_schema_view(post=extend_schema(
    summary="Email a password reset link",
    request=PasswordResetRequestSerializer,
    responses={200: DetailSerializer},
))
class PasswordResetRequestView(APIView):
    """Email a one-time reset link. Always answers 200 so the endpoint
    can't be used to discover which emails are registered."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        for user in User.objects.filter(email__iexact=email, is_active=True):
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            try:
                send_mail(
                    subject=f"Reset your {settings.APP_NAME} password",
                    message=(
                        f"Hello {user.username},\n\n"
                        f"We received a request to reset your {settings.APP_NAME} password.\n"
                        f"Use the link below to choose a new one:\n\n{link}\n\n"
                        "The link can be used once and expires soon. "
                        "If you did not request this, you can ignore this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                )
            except Exception:
                logger.exception("Password reset email failed for user %s", user.pk)

        return Response(
            {"detail": "If an account exists for that email, a reset link has been sent."}
        )


@extend_schema_view(post=extend_schema(
    summary="Set a new password using a reset link",
    request=PasswordResetConfirmSerializer,
    responses={200: DetailSerializer},
))
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.token_version += 1  # old sessions must not survive a reset
        user.save(update_fields=["password", "token_version"])
        return Response({"detail": "Your password has been updated."})
