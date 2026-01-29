from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets

from .models import Ticket, Comment
from .serializers import TicketSerializer, CommentSerializer
from .ai_service import auto_categorize_ticket


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin → all tickets
        if user.is_superuser:
            return Ticket.objects.all()

        # Agent → only assigned tickets
        if user.groups.filter(name="agent").exists():
            return Ticket.objects.filter(assigned_to=user)

        # Customer → only own tickets
        return Ticket.objects.filter(created_by=user)

    def perform_create(self, serializer):
        description = serializer.validated_data.get("description", "")
        category = auto_categorize_ticket(description)

        print("AI CATEGORY:", category)  # debug (can remove later)

        serializer.save(
            created_by=self.request.user,
            category=category
        )

    def update(self, request, *args, **kwargs):
        # Customers cannot update tickets
        if request.user.groups.filter(name="customer").exists():
            return Response(
                {"detail": "Customers are not allowed to update tickets"},
                status=403
            )
        return super().update(request, *args, **kwargs)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin → all comments
        if user.is_superuser:
            return Comment.objects.all()

        # Agent → comments on assigned tickets
        if user.groups.filter(name="agent").exists():
            return Comment.objects.filter(ticket__assigned_to=user)

        # Customer → comments on own tickets
        return Comment.objects.filter(ticket__created_by=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
