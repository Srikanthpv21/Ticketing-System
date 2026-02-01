from django.contrib import admin
from .models import Ticket, Comment

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "created_by", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description")

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "ticket", "user", "created_at")
