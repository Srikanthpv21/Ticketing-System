"""Token handling with a per-user version.

Every token carries the user's `token_version` ("tv" claim). Bumping the
version (sign out of all devices, password change or reset, closing the
account) makes all previously issued access and refresh tokens invalid
immediately, instead of waiting for them to expire.
"""
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView



def issue_refresh(user):
    """Create a refresh token (its access token inherits the claim)."""
    refresh = RefreshToken.for_user(user)
    refresh["tv"] = user.token_version
    return refresh


def token_payload(user):
    refresh = issue_refresh(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class VersionedTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            token = RefreshToken(attrs["refresh"])
        except TokenError as exc:
            raise InvalidToken(exc.args[0])

        User = get_user_model()
        user = User.objects.filter(pk=token.get("user_id"), is_active=True).first()
        if user is None or token.get("tv", 0) != user.token_version:
            raise InvalidToken("Token is invalid or expired")

        return super().validate(attrs)


class VersionedTokenRefreshView(TokenRefreshView):
    serializer_class = VersionedTokenRefreshSerializer
