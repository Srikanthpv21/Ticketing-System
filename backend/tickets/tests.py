"""
Comprehensive test suite for the Ticketing System
Tests cover: Models, API endpoints, Authentication, Permissions, and Workflows
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from tickets.models import Ticket, Comment
from datetime import datetime

User = get_user_model()


class UserModelTest(TestCase):
    """Test custom User model"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.agent = User.objects.create_user(
            username='agent1',
            email='agent@test.com',
            password='testpass123',
            role='agent'
        )
        self.admin = User.objects.create_user(
            username='admin1',
            email='admin@test.com',
            password='testpass123',
            role='admin'
        )
    
    def test_user_creation(self):
        """Test that users are created with correct roles"""
        self.assertEqual(self.customer.role, 'customer')
        self.assertEqual(self.agent.role, 'agent')
        self.assertEqual(self.admin.role, 'admin')
    
    def test_user_string_representation(self):
        """Test user __str__ method"""
        self.assertEqual(str(self.customer), 'customer1')


class TicketModelTest(TestCase):
    """Test Ticket model validations and methods"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.agent = User.objects.create_user(
            username='agent1',
            email='agent@test.com',
            password='testpass123',
            role='agent'
        )
        self.category = 'OTHER'
        
    def test_ticket_creation(self):
        """Test ticket is created with correct defaults"""
        ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.customer,
            category=self.category
        )
        self.assertEqual(ticket.status, 'OPEN')
        self.assertEqual(ticket.priority, 'MEDIUM')
        self.assertIsNotNone(ticket.created_at)
    
    def test_ticket_status_transitions(self):
        """Test valid status transitions"""
        ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.customer,
            category=self.category
        )
        
        # OPEN -> IN_PROGRESS
        ticket.status = 'IN_PROGRESS'
        ticket.save()
        self.assertEqual(ticket.status, 'IN_PROGRESS')
        
        # IN_PROGRESS -> RESOLVED
        ticket.status = 'RESOLVED'
        ticket.save()
        self.assertEqual(ticket.status, 'RESOLVED')
        
        # RESOLVED -> CLOSED
        ticket.status = 'CLOSED'
        ticket.save()
        self.assertEqual(ticket.status, 'CLOSED')
    
    def test_ticket_assignment(self):
        """Test ticket can be assigned to agent"""
        ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.customer,
            category=self.category,
            assigned_to=self.agent
        )
        self.assertEqual(ticket.assigned_to, self.agent)


class CommentModelTest(TestCase):
    """Test Comment model"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.category = 'OTHER'
        self.ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.customer,
            category=self.category
        )
    
    def test_comment_creation(self):
        """Test comment is created correctly"""
        comment = Comment.objects.create(
            ticket=self.ticket,
            user=self.customer,
            message='Test comment',
            is_internal=False
        )
        self.assertEqual(comment.message, 'Test comment')
        self.assertFalse(comment.is_internal)
        self.assertIsNotNone(comment.created_at)


class AuthenticationAPITest(APITestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/auth/register/'
        self.login_url = '/auth/login/'
        self.me_url = '/auth/me/'
    
    def test_user_registration(self):
        """Test user can register"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'testpass123',
            'role': 'customer'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
    
    def test_user_login(self):
        """Test user can login"""
        # Create user first
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='customer'
        )
        
        # Login
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_get_current_user(self):
        """Test authenticated user can get their info"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='customer'
        )
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')


class TicketAPITest(APITestCase):
    """Test ticket CRUD operations and permissions"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.agent = User.objects.create_user(
            username='agent1',
            email='agent@test.com',
            password='testpass123',
            role='agent'
        )
        self.admin = User.objects.create_user(
            username='admin1',
            email='admin@test.com',
            password='testpass123',
            role='admin'
        )
        self.category = 'OTHER'
        self.tickets_url = '/api/tickets/'
    
    def test_customer_can_create_ticket(self):
        """Test customer can create a ticket"""
        self.client.force_authenticate(user=self.customer)
        data = {
            'title': 'New Ticket',
            'description': 'Test description',
            'priority': 'HIGH',
            'category': self.category
        }
        response = self.client.post(self.tickets_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Ticket')
    
    def test_customer_can_only_see_own_tickets(self):
        """Test customer can only view their own tickets"""
        # Create tickets for different customers
        customer2 = User.objects.create_user(
            username='customer2',
            email='customer2@test.com',
            password='testpass123',
            role='customer'
        )
        
        Ticket.objects.create(
            title='Customer 1 Ticket',
            description='Test',
            created_by=self.customer,
            category=self.category
        )
        Ticket.objects.create(
            title='Customer 2 Ticket',
            description='Test',
            created_by=customer2,
            category=self.category
        )
        
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.tickets_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_agent_can_see_assigned_tickets(self):
        """Test agent can see tickets assigned to them"""
        Ticket.objects.create(
            title='Assigned Ticket',
            description='Test',
            created_by=self.customer,
            category=self.category,
            assigned_to=self.agent
        )
        
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(self.tickets_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_admin_can_see_all_tickets(self):
        """Test admin can see all tickets"""
        Ticket.objects.create(
            title='Ticket 1',
            description='Test',
            created_by=self.customer,
            category=self.category
        )
        Ticket.objects.create(
            title='Ticket 2',
            description='Test',
            created_by=self.customer,
            category=self.category
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.tickets_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
    
    def test_unauthenticated_cannot_access_tickets(self):
        """Test unauthenticated users cannot access tickets"""
        response = self.client.get(self.tickets_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CommentAPITest(APITestCase):
    """Test comment functionality"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.agent = User.objects.create_user(
            username='agent1',
            email='agent@test.com',
            password='testpass123',
            role='agent'
        )
        self.category = 'OTHER'
        self.ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.customer,
            category=self.category,
            assigned_to=self.agent
        )
    
    def test_customer_can_add_comment(self):
        """Test customer can add comment to their ticket"""
        self.client.force_authenticate(user=self.customer)
        url = f'/api/tickets/{self.ticket.id}/comments/'
        data = {
            'message': 'Customer comment',
            'is_internal': False
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_agent_can_add_internal_comment(self):
        """Test agent can add internal comment"""
        self.client.force_authenticate(user=self.agent)
        url = f'/api/tickets/{self.ticket.id}/comments/'
        data = {
            'message': 'Internal note',
            'is_internal': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_customer_cannot_see_internal_comments(self):
        """Test customer cannot see internal comments"""
        # Agent adds internal comment
        Comment.objects.create(
            ticket=self.ticket,
            user=self.agent,
            message='Internal note',
            is_internal=True
        )
        
        # Customer tries to view ticket
        self.client.force_authenticate(user=self.customer)
        url = f'/api/tickets/{self.ticket.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that internal comments are filtered out
        comments = response.data.get('comments', [])
        internal_comments = [c for c in comments if c.get('is_internal')]
        self.assertEqual(len(internal_comments), 0)


class TicketWorkflowTest(APITestCase):
    """Integration tests for complete ticket lifecycle"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='testpass123',
            role='customer'
        )
        self.agent = User.objects.create_user(
            username='agent1',
            email='agent@test.com',
            password='testpass123',
            role='agent'
        )
        self.category = 'OTHER'
    
    def test_complete_ticket_lifecycle(self):
        """Test complete ticket workflow from creation to resolution"""
        
        # 1. Customer creates ticket
        self.client.force_authenticate(user=self.customer)
        create_data = {
            'title': 'Login Issue',
            'description': 'Cannot login to my account',
            'priority': 'HIGH',
            'category': self.category
        }
        response = self.client.post('/api/tickets/', create_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket_id = response.data['id']
        self.assertEqual(response.data['status'], 'OPEN')
        
        # 2. Customer adds comment
        comment_data = {
            'message': 'I tried resetting password but still cannot login',
            'is_internal': False
        }
        response = self.client.post(f'/api/tickets/{ticket_id}/comments/', comment_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Agent views and updates ticket
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f'/api/tickets/{ticket_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Agent updates status to IN_PROGRESS
        update_data = {'status': 'IN_PROGRESS'}
        response = self.client.patch(f'/api/tickets/{ticket_id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'IN_PROGRESS')
        
        # 5. Agent adds response
        agent_comment = {
            'message': 'I have reset your account. Please try again.',
            'is_internal': False
        }
        response = self.client.post(f'/api/tickets/{ticket_id}/comments/', agent_comment)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 6. Agent resolves ticket
        resolve_data = {'status': 'RESOLVED'}
        response = self.client.patch(f'/api/tickets/{ticket_id}/', resolve_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RESOLVED')
        
        # 7. Verify customer can see the resolution
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/tickets/{ticket_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'RESOLVED')
        self.assertGreaterEqual(len(response.data['comments']), 2)
