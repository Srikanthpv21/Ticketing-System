"""Authentication class kept in its own module so DRF can import it while
settings load (it must not import views or serializers)."""
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class VersionedJWTAuthentication(JWTAuthentication):
    """Reject tokens issued before the user's current token_version."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if validated_token.get("tv", 0) != user.token_version:
            raise AuthenticationFailed(
                "You have been signed out. Please sign in again.",
                code="token_not_valid",
            )
        return user
