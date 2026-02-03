from rest_framework import serializers
from .models import Ticket, Comment


# --------------------
# Comment Serializer
# --------------------
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


# --------------------
# Ticket Serializer
# --------------------
class TicketSerializer(serializers.ModelSerializer):
    comments = serializers.SerializerMethodField()
    created_by = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)

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
            "created_at",
            "updated_at",
            "comments",
        )
        read_only_fields = (
            "created_by",
            "assigned_to",
            "category",
            "created_at",
            "updated_at",
        )

    def get_comments(self, obj):
        request = self.context.get("request")
        user = request.user if request else None

        qs = obj.comments.all()

        # 🔒 Customers see only public messages
        if user and user.role == "customer":
            qs = qs.filter(is_internal=False)

        return CommentSerializer(qs, many=True).data
