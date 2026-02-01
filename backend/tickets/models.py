from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class Ticket(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="MEDIUM")
    category = models.CharField(max_length=100, null=True, blank=True)

    created_by = models.ForeignKey(
        User, related_name="created_tickets", on_delete=models.CASCADE
    )
    assigned_to = models.ForeignKey(
        User, related_name="assigned_tickets",
        null=True, blank=True, on_delete=models.SET_NULL
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Comment(models.Model):
    ticket = models.ForeignKey(
        Ticket, related_name="comments", on_delete=models.CASCADE
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
