from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework.response import Response
from users.authentication import VersionedJWTAuthentication
from django.contrib.auth import get_user_model
from django.db.models import Count, Prefetch, Q

from .models import Ticket, Comment
from .serializers import (
    TicketSerializer,
    CommentSerializer,
    StatusUpdateSerializer,
    AiSuggestionSerializer,
    AiSummarySerializer,
    UserListSerializer,
)
from .ai import auto_categorize, suggest_reply, summarize_ticket
from .notifications import notify_reply, notify_status, notify_assignment
from .pagination import OptionalPageNumberPagination

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


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


# Ticket ViewSet
@extend_schema_view(
    list=extend_schema(
        summary="List tickets visible to the current user",
        description=(
            "Customers see their own tickets, agents the tickets assigned to "
            "them, admins all tickets. Returns a plain list unless `page` or "
            "`page_size` is given, in which case the response is paginated."
        ),
        parameters=[
            OpenApiParameter("status", str, description="OPEN, IN_PROGRESS, RESOLVED or CLOSED"),
            OpenApiParameter("category", str, description="LOGIN, PAYMENT, BUG, FEATURE or OTHER"),
            OpenApiParameter("priority", str, description="LOW, MEDIUM or HIGH"),
            OpenApiParameter("assigned_to", str, description="An agent id, or `none` for unassigned"),
            OpenApiParameter("search", str, description="Matches title or description"),
            OpenApiParameter("page", int, description="Page number (turns pagination on)"),
            OpenApiParameter("page_size", int, description="Items per page, max 100"),
        ],
    ),
    create=extend_schema(summary="Create a ticket (auto-categorised and assigned)"),
    retrieve=extend_schema(summary="Get a ticket with its comments"),
    update=extend_schema(summary="Update a ticket"),
    partial_update=extend_schema(summary="Partially update a ticket"),
    destroy=extend_schema(summary="Delete a ticket (admin only)"),
)
class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    authentication_classes = [VersionedJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OptionalPageNumberPagination


    # Queryset by role (+ optional list filters)
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Ticket.objects.none()  # schema generation has no real user

        user = self.request.user

        if user.role == "admin":
            qs = Ticket.objects.all()
        elif user.role == "agent":
            qs = Ticket.objects.filter(assigned_to=user)
        else:  # customer
            qs = Ticket.objects.filter(created_by=user)

        # One query for tickets (+ users) and one for all their comments,
        # instead of extra queries per ticket (N+1).
        qs = qs.select_related("created_by", "assigned_to").prefetch_related(
            Prefetch("comments", queryset=Comment.objects.select_related("user"))
        )

        if self.action == "list":
            params = self.request.query_params
            for field in ("status", "category", "priority"):
                value = params.get(field)
                if value:
                    qs = qs.filter(**{field: value.upper()})
            assignee = params.get("assigned_to")
            if assignee == "none":
                qs = qs.filter(assigned_to__isnull=True)
            elif assignee and assignee.isdigit():
                qs = qs.filter(assigned_to_id=int(assignee))
            search = params.get("search", "").strip()
            if search:
                qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return qs

    # Customers may edit only title/description; workflow fields are
    # controlled by agents/admins.
    def perform_update(self, serializer):
        if self.request.user.role == "customer":
            for field in ("status", "priority", "assigned_to"):
                serializer.validated_data.pop(field, None)
        previous_assignee = serializer.instance.assigned_to_id
        ticket = serializer.save()
        if ticket.assigned_to_id and ticket.assigned_to_id != previous_assignee:
            notify_assignment(ticket)

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdminRole()]
        return super().get_permissions()

    # Create ticket (Customer)
    def perform_create(self, serializer):
        description = serializer.validated_data.get("description", "")

        # 🔹 AI auto-categorization
        category = auto_categorize(description)

        # 🔹 Auto-assign to the agent with the fewest active tickets
        agent = (
            User.objects.filter(role=User.ROLE_AGENT)
            .annotate(
                active=Count(
                    "assigned_tickets",
                    filter=Q(
                        assigned_tickets__status__in=[
                            Ticket.STATUS_OPEN,
                            Ticket.STATUS_IN_PROGRESS,
                        ]
                    ),
                )
            )
            .order_by("active", "id")
            .first()
        )

        ticket = serializer.save(
            created_by=self.request.user,
            category=category,
            assigned_to=agent,
            status=Ticket.STATUS_OPEN,
        )
        notify_assignment(ticket)

    # AI Reply Suggestion
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAgentOrAdmin],
    )
    @extend_schema(summary="AI-suggested reply (agents/admins)", responses=AiSuggestionSerializer)
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
    @extend_schema(summary="AI summary of the ticket (agents/admins)", responses=AiSummarySerializer)
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
    @extend_schema(
        summary="Change ticket status (agents/admins)",
        request=StatusUpdateSerializer,
        responses=StatusUpdateSerializer,
    )
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get("status")

        if new_status not in dict(Ticket.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        changed = ticket.status != new_status
        ticket.status = new_status
        ticket.save(update_fields=["status"])
        if changed:
            notify_status(ticket, request.user)

        return Response({"status": ticket.status})

    # List Agents
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAgentOrAdmin],
    )
    @extend_schema(summary="List agents (agents/admins)", responses=UserListSerializer(many=True))
    def agents(self, request):
        agents = User.objects.filter(role="agent")
        serializer = UserListSerializer(agents, many=True)
        return Response(serializer.data)

    # Add comment (Chat)
    @action(detail=True, methods=["post"])
    @extend_schema(
        summary="Add a comment to a ticket",
        request=CommentSerializer,
        responses={201: CommentSerializer},
    )
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

        comment = serializer.save(
            user=user,
            ticket=ticket,
            is_internal=False,  # visible to customer
        )
        notify_reply(ticket, comment)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
