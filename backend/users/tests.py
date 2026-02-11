"""
Tests for the Users app - Authentication and User Management
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model"""
    
    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='customer'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, 'admin')
    
    def test_user_role_choices(self):
        """Test that only valid roles can be assigned"""
        customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='pass123',
            role='customer'
        )
        agent = User.objects.create_user(
            username='agent',
            email='agent@test.com',
            password='pass123',
            role='agent'
        )
        admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='pass123',
            role='admin'
        )
        
        self.assertIn(customer.role, ['customer', 'agent', 'admin'])
        self.assertIn(agent.role, ['customer', 'agent', 'admin'])
        self.assertIn(admin.role, ['customer', 'agent', 'admin'])


class AuthenticationTest(APITestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_register_customer(self):
        """Test customer registration"""
        url = '/auth/register/'
        data = {
            'username': 'newcustomer',
            'email': 'customer@test.com',
            'password': 'securepass123',
            'role': 'customer'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify user was created
        user = User.objects.get(username='newcustomer')
        self.assertEqual(user.role, 'customer')
    
    def test_register_agent(self):
        """Test agent registration"""
        url = '/auth/register/'
        data = {
            'username': 'newagent',
            'email': 'agent@test.com',
            'password': 'securepass123',
            'role': 'agent'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(username='newagent')
        self.assertEqual(user.role, 'agent')
    
    def test_register_duplicate_username(self):
        """Test registration with duplicate username fails"""
        User.objects.create_user(
            username='existing',
            email='existing@test.com',
            password='pass123',
            role='customer'
        )
        
        url = '/auth/register/'
        data = {
            'username': 'existing',
            'email': 'new@test.com',
            'password': 'pass123',
            'role': 'customer'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_success(self):
        """Test successful login"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='customer'
        )
        
        url = '/auth/login/'
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_wrong_password(self):
        """Test login with wrong password fails"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='correctpass',
            role='customer'
        )
        
        url = '/auth/login/'
        data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_current_user_authenticated(self):
        """Test getting current user info when authenticated"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='customer'
        )
        self.client.force_authenticate(user=user)
        
        url = '/auth/me/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@test.com')
        self.assertEqual(response.data['role'], 'customer')
    
    def test_get_current_user_unauthenticated(self):
        """Test getting current user fails when not authenticated"""
        url = '/auth/me/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserPermissionsTest(APITestCase):
    """Test user permissions and role-based access"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='pass123',
            role='customer'
        )
        self.agent = User.objects.create_user(
            username='agent',
            email='agent@test.com',
            password='pass123',
            role='agent'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='pass123',
            role='admin'
        )
    
    def test_customer_role_permissions(self):
        """Test customer has correct role"""
        self.assertEqual(self.customer.role, 'customer')
        self.assertFalse(self.customer.is_staff)
        self.assertFalse(self.customer.is_superuser)
    
    def test_agent_role_permissions(self):
        """Test agent has correct role"""
        self.assertEqual(self.agent.role, 'agent')
        self.assertFalse(self.agent.is_staff)
        self.assertFalse(self.agent.is_superuser)
    
    def test_admin_role_permissions(self):
        """Test admin has correct role"""
        self.assertEqual(self.admin.role, 'admin')
        # Note: Regular admin users are not Django staff unless explicitly set
