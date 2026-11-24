from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "role")

    def validate_role(self, value):
        # Public sign-up may only create customers. Agents and admins are
        # created by an administrator (Django admin / createsuperuser).
        if value != User.ROLE_CUSTOMER:
            raise serializers.ValidationError(
                "Only customer accounts can be self-registered."
            )
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role=User.ROLE_CUSTOMER,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name", "role",
            "email_on_reply", "email_on_status", "email_on_assignment",
        )
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Fields a user may edit on their own account. Username and role are
    deliberately not included."""

    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = (
            "first_name", "last_name", "email",
            "email_on_reply", "email_on_status", "email_on_assignment",
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if attrs["current_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": ["New password must be different from the current one."]}
            )
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user data in the response"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["tv"] = user.token_version
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to the response
        data['user'] = UserSerializer(self.user).data
        
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        invalid = serializers.ValidationError(
            {"detail": "This reset link is invalid or has expired."}
        )
        try:
            user = User.objects.get(
                pk=force_str(urlsafe_base64_decode(attrs["uid"])),
                is_active=True,
            )
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise invalid

        if not default_token_generator.check_token(user, attrs["token"]):
            raise invalid

        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"new_password": list(exc.messages)}
            )

        attrs["user"] = user
        return attrs


class CloseAccountSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Password is incorrect.")
        return value


class DetailSerializer(serializers.Serializer):
    """Generic {"detail": "..."} response, used for API documentation."""

    detail = serializers.CharField()


class AuthResponseSerializer(serializers.Serializer):
    """Response of register: the new user plus a token pair."""

    user = UserSerializer()
    access = serializers.CharField()
    refresh = serializers.CharField()


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
