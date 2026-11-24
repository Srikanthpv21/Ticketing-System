"""Create starter accounts from environment variables.

Meant for deployments without a shell (for example Render's free tier): run
it from the build or pre-deploy command, e.g.

    python manage.py migrate && python manage.py bootstrap_accounts

For each role set USERNAME and PASSWORD (EMAIL is optional):

    BOOTSTRAP_ADMIN_USERNAME / BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD
    BOOTSTRAP_AGENT_USERNAME / BOOTSTRAP_AGENT_EMAIL / BOOTSTRAP_AGENT_PASSWORD
    BOOTSTRAP_CUSTOMER_USERNAME / BOOTSTRAP_CUSTOMER_EMAIL / BOOTSTRAP_CUSTOMER_PASSWORD

Safe to run on every deploy:
- a role is skipped unless both its username and password are set;
- an existing user is never modified (its password is not overwritten);
- weak passwords are rejected by Django's password validators;
- passwords are never printed.
"""
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()

ROLES = ("ADMIN", "AGENT", "CUSTOMER")


class Command(BaseCommand):
    help = "Create admin / agent / customer accounts from BOOTSTRAP_* environment variables."

    def handle(self, *args, **options):
        configured = 0

        for role in ROLES:
            username = os.getenv(f"BOOTSTRAP_{role}_USERNAME", "").strip()
            password = os.getenv(f"BOOTSTRAP_{role}_PASSWORD", "")
            email = os.getenv(f"BOOTSTRAP_{role}_EMAIL", "").strip()

            if not username and not password:
                continue  # this role is not configured
            if not username or not password:
                raise CommandError(
                    f"BOOTSTRAP_{role}_USERNAME and BOOTSTRAP_{role}_PASSWORD "
                    "must both be set."
                )

            configured += 1

            if User.objects.filter(username=username).exists():
                self.stdout.write(f"{role.lower()} '{username}' already exists, left unchanged.")
                continue

            try:
                validate_password(password, User(username=username, email=email))
            except ValidationError as exc:
                raise CommandError(
                    f"Password for {role.lower()} '{username}' is too weak: "
                    + " ".join(exc.messages)
                )

            if role == "ADMIN":
                User.objects.create_superuser(username=username, email=email, password=password)
            else:
                User.objects.create_user(
                    username=username, email=email, password=password, role=role.lower()
                )
            self.stdout.write(self.style.SUCCESS(f"Created {role.lower()} '{username}'."))

        if configured == 0:
            self.stdout.write("No BOOTSTRAP_* accounts configured; nothing to do.")
