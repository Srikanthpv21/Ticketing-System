from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.decorators import action

from .models import Ticket, Comment
from .serializers import TicketSerializer, CommentSerializer
from .ai_service import categorize_ticket

from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from django.db.models import Count



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
        category = categorize_ticket(description)

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

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get("status")

        if not request.user.groups.filter(name="agent").exists():
            return Response(
                {"detail": "Only agents can update ticket status"},
                status=403
            )

        if new_status not in ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]:
            return Response(
                {"detail": "Invalid status"},
                status=400
            )

        ticket.status = new_status
        ticket.save()

        return Response(TicketSerializer(ticket).data)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Comment.objects.all()

        if user.groups.filter(name="agent").exists():
            return Comment.objects.filter(ticket__assigned_to=user)

        return Comment.objects.filter(ticket__created_by=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_tickets = Ticket.objects.count()

        by_status = (
            Ticket.objects.values("status")
            .annotate(count=Count("id"))
        )

        by_category = (
            Ticket.objects.values("category")
            .annotate(count=Count("id"))
        )

        agent_workload = (
            Ticket.objects
            .exclude(assigned_to=None)
            .values("assigned_to__username")
            .annotate(count=Count("id"))
        )

        return Response({
            "total_tickets": total_tickets,
            "by_status": by_status,
            "by_category": by_category,
            "agent_workload": agent_workload,
        })
