"""OpenAPI helpers: tell drf-spectacular how our JWT authentication works."""
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class VersionedJWTScheme(OpenApiAuthenticationExtension):
    target_class = "users.authentication.VersionedJWTAuthentication"
    name = "jwtAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Send the access token as `Authorization: Bearer <token>`.",
        }
