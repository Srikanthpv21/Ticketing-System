from rest_framework import serializers
from .models import Ticket, Comment


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "user", "message", "is_internal", "created_at")


class TicketSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)

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
        read_only_fields = ("created_by",)
