"""Email notifications for ticket events.

Each function respects the recipient's notification preferences and never
raises: a mail failure must not break the API request that triggered it.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

PAGES = {"customer": "/customer", "agent": "/agent", "admin": "/admin"}


def _link(user):
    return f"{settings.FRONTEND_URL}{PAGES.get(user.role, '/login')}"


def _send(recipient, subject, body):
    if not recipient or not recipient.email:
        return
    try:
        send_mail(
            subject=f"[{settings.APP_NAME}] {subject}",
            message=(
                f"Hello {recipient.username},\n\n{body}\n\n"
                f"Open {settings.APP_NAME}: {_link(recipient)}\n\n"
                "You can change which emails you receive in Settings."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
        )
    except Exception:
        logger.exception("Notification email failed for user %s", recipient.pk)


def notify_reply(ticket, comment):
    """Tell the other side of the conversation about a new reply."""
    author = comment.user
    if author == ticket.created_by:
        recipient = ticket.assigned_to
    else:
        recipient = ticket.created_by

    if not recipient or recipient == author or not recipient.email_on_reply:
        return

    excerpt = comment.message.strip()
    if len(excerpt) > 300:
        excerpt = excerpt[:300].rstrip() + "…"

    _send(
        recipient,
        f"New reply on ticket #{ticket.id}",
        f'{author.username} replied to "{ticket.title}":\n\n{excerpt}',
    )


def notify_status(ticket, actor):
    """Tell the customer their ticket status changed."""
    customer = ticket.created_by
    if customer == actor or not customer.email_on_status:
        return
    _send(
        customer,
        f"Ticket #{ticket.id} is now {ticket.get_status_display()}",
        f'The status of your ticket "{ticket.title}" changed to '
        f"{ticket.get_status_display()}.",
    )


def notify_assignment(ticket):
    """Tell an agent a ticket was assigned to them."""
    agent = ticket.assigned_to
    if not agent or not agent.email_on_assignment:
        return
    _send(
        agent,
        f"Ticket #{ticket.id} assigned to you",
        f'"{ticket.title}" from {ticket.created_by.username} was assigned to you.',
    )
