from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Ticket, Comment

User = get_user_model()


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "status",
        "priority",
        "category",
        "created_by",
        "assigned_to",
        "created_at",
    )

    list_filter = (
        "status",
        "priority",
        "category",
        "assigned_to",
    )

    search_fields = (
        "title",
        "description",
        "created_by__username",
        "assigned_to__username",
    )

    ordering = ("-created_at",)

    fieldsets = (
        ("Ticket Info", {
            "fields": ("title", "description", "priority", "category")
        }),
        ("Workflow", {
            "fields": ("status", "assigned_to")
        }),
        ("Audit", {
            "fields": ("created_by", "created_at", "updated_at")
        }),
    )

    readonly_fields = (
        "created_by",
        "created_at",
        "updated_at",
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Only allow AGENTS to be assigned to tickets.
        """
        if db_field.name == "assigned_to":
            kwargs["queryset"] = User.objects.filter(role=User.ROLE_AGENT)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "ticket",
        "user",
        "is_internal",
        "created_at",
    )

    list_filter = ("is_internal",)
    search_fields = ("message", "user__username")
    ordering = ("created_at",)

    readonly_fields = ("created_at",)
