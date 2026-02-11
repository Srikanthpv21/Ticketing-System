from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model

from .models import Ticket, Comment
from .serializers import TicketSerializer, CommentSerializer
from .ai import auto_categorize, suggest_reply, summarize_ticket

User = get_user_model()

# Permissions
class IsAgentOrAdmin(permissions.BasePermission):
    """
    Allow only agents or admins
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("agent", "admin")
        )


# Ticket ViewSet
class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


    # Queryset by role
    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return Ticket.objects.all()

        if user.role == "agent":
            return Ticket.objects.filter(assigned_to=user)

        # customer
        return Ticket.objects.filter(created_by=user)

    # Create ticket (Customer)
    def perform_create(self, serializer):
        description = serializer.validated_data.get("description", "")

        # 🔹 AI auto-categorization
        category = auto_categorize(description)

        # 🔹 Simple auto-assign strategy
        agent = User.objects.filter(role=User.ROLE_AGENT).first()

        serializer.save(
            created_by=self.request.user,
            category=category,
            assigned_to=agent,
            status=Ticket.STATUS_OPEN,
        )

    # AI Reply Suggestion
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAgentOrAdmin],
    )
    def ai_reply(self, request, pk=None):
        ticket = self.get_object()
        comments = ticket.comments.filter(is_internal=False)

        suggestion = suggest_reply(ticket, comments)

        return Response({"suggestion": suggestion})


    # AI Ticket Summary
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAgentOrAdmin],
    )
    def ai_summary(self, request, pk=None):
        ticket = self.get_object()
        comments = ticket.comments.filter(is_internal=False)

        summary = summarize_ticket(ticket, comments)

        return Response({"summary": summary})


    # Update ticket status
    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsAgentOrAdmin],
    )
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get("status")

        if new_status not in dict(Ticket.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = new_status
        ticket.save(update_fields=["status"])

        return Response({"status": ticket.status})

    # List Agents
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAgentOrAdmin],
    )
    def agents(self, request):
        agents = User.objects.filter(role="agent")
        from .serializers import UserListSerializer
        serializer = UserListSerializer(agents, many=True)
        return Response(serializer.data)

    # Add comment (Chat)
    @action(detail=True, methods=["post"])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        user = request.user

        # Permission rules
        if user.role == "customer" and ticket.created_by != user:
            return Response(
                {"detail": "Not allowed"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == "agent" and ticket.assigned_to != user:
            return Response(
                {"detail": "Not allowed"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serializer.save(
            user=user,
            ticket=ticket,
            is_internal=False,  # visible to customer
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
