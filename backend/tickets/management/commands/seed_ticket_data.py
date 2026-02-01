from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from tickets.models import Ticket

class Command(BaseCommand):
    help = 'Seeds the database with users, roles, and sample tickets'

    def handle(self, *args, **kwargs):
        # Create Role Groups
        agent_group, _ = Group.objects.get_or_create(name='agent')
        customer_group, _ = Group.objects.get_or_create(name='customer')

        # Create Admin
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'adminpass123')
            self.stdout.write("Created superuser: admin")

        # Create Agent
        if not User.objects.filter(username='agent_user').exists():
            agent = User.objects.create_user('agent_user', 'agent@example.com', 'agentpass123')
            agent.groups.add(agent_group)
            self.stdout.write("Created agent: agent_user")

        # Create Customer
        if not User.objects.filter(username='customer_user').exists():
            customer = User.objects.create_user('customer_user', 'customer@example.com', 'custpass123')
            customer.groups.add(customer_group)
            self.stdout.write("Created customer: customer_user")

        # Create Sample Ticket
        cust = User.objects.get(username='customer_user')
        Ticket.objects.get_or_create(
            title="Unable to access billing",
            description="I am getting a 403 error when trying to view my latest invoice.",
            created_by=cust,
            status="OPEN",
            priority="HIGH",
            category="Billing"
        )
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))