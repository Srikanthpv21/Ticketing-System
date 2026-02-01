from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from .ai import auto_categorize

from .models import Ticket, Comment
from .serializers import TicketSerializer, CommentSerializer


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer

    authentication_classes = [JWTAuthentication]   # ✅ ADD THIS
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return Ticket.objects.all()
        elif user.role == "agent":
            return Ticket.objects.filter(assigned_to=user)
        return Ticket.objects.filter(created_by=user)

    def perform_create(self, serializer):
        description = serializer.validated_data.get("description", "")
        category = auto_categorize(description)

        serializer.save(
            created_by=self.request.user,
            category=category
        )


    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = request.data.get("status", ticket.status)
        ticket.save()
        return Response({"status": ticket.status})

    @action(detail=True, methods=["post"])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, ticket=ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
