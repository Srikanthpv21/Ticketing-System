from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tickets.models import Ticket

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with users, roles, and sample tickets'

    def handle(self, *args, **kwargs):
        # Create Admin
        if not User.objects.filter(username='admin1').exists():
            User.objects.create_superuser(
                username='admin1',
                email='admin@example.com',
                password='password123'
            )
            self.stdout.write(self.style.SUCCESS("Created admin: admin1 / password123"))

        # Create Agent
        if not User.objects.filter(username='agent1').exists():
            User.objects.create_user(
                username='agent1',
                email='agent@example.com',
                password='password123',
                role='agent'
            )
            self.stdout.write(self.style.SUCCESS("Created agent: agent1 / password123"))

        # Create Customer
        if not User.objects.filter(username='customer1').exists():
            customer = User.objects.create_user(
                username='customer1',
                email='customer@example.com',
                password='password123',
                role='customer'
            )
            self.stdout.write(self.style.SUCCESS("Created customer: customer1 / password123"))

            # Create Sample Tickets
            Ticket.objects.get_or_create(
                title="Cannot login to account",
                defaults={
                    'description': "I'm unable to login with my credentials. Getting 'Invalid username or password' error.",
                    'created_by': customer,
                    'status': 'OPEN',
                    'priority': 'HIGH',
                    'category': 'LOGIN'
                }
            )
            
            Ticket.objects.get_or_create(
                title="Payment failed but money deducted",
                defaults={
                    'description': "My payment was deducted from my account but the order shows as failed.",
                    'created_by': customer,
                    'status': 'OPEN',
                    'priority': 'HIGH',
                    'category': 'PAYMENT'
                }
            )
            
            Ticket.objects.get_or_create(
                title="Bug in dashboard",
                defaults={
                    'description': "The dashboard is not loading properly. Getting a blank screen.",
                    'created_by': customer,
                    'status': 'OPEN',
                    'priority': 'MEDIUM',
                    'category': 'BUG'
                }
            )
            
            self.stdout.write(self.style.SUCCESS("Created 3 sample tickets"))

        self.stdout.write(self.style.SUCCESS("\n" + "="*50))
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("="*50))
        self.stdout.write(self.style.SUCCESS("\nTest Users:"))
        self.stdout.write("Admin:admin1 / password123")
        self.stdout.write("Agent:agent1 / password123")
        self.stdout.write("Customer:customer1 / password123")
        self.stdout.write("")