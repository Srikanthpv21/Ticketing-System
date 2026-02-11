from rest_framework import serializers
from .models import Ticket, Comment



# Comment Serializer
class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "user",
            "message",
            "is_internal",
            "created_at",
        )
        read_only_fields = ("user", "created_at")


# User List Serializer
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        model = User
        fields = ("id", "username", "email", "role")


# Ticket Serializer
class TicketSerializer(serializers.ModelSerializer):
    comments = serializers.SerializerMethodField()
    created_by = serializers.StringRelatedField(read_only=True)
    
    # Writable field for assignment (User ID)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    
    # Read-only field for display (Username)
    assigned_to_username = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "category",
            "created_by",
            "assigned_to",
            "assigned_to_username",
            "created_at",
            "updated_at",
            "comments",
        )
        read_only_fields = (
            "created_by",
            "category",
            "created_at",
            "updated_at",
        )

    def get_assigned_to_username(self, obj):
        return obj.assigned_to.username if obj.assigned_to else None

    def get_comments(self, obj):
        request = self.context.get("request")
        user = request.user if request else None

        qs = obj.comments.all()

        # Customers see only public messages
        if user and user.role == "customer":
            qs = qs.filter(is_internal=False)

        return CommentSerializer(qs, many=True).data
