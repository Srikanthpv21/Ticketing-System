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
    
    def test_cannot_self_register_privileged_roles(self):
        """Public registration must not create agents or admins"""
        for role in ('agent', 'admin'):
            response = self.client.post('/auth/register/', {
                'username': f'new_{role}',
                'email': f'{role}@test.com',
                'password': 'securepass123',
                'role': role,
            })
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(User.objects.filter(username=f'new_{role}').exists())
    
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


class PasswordResetTests(TestCase):
    def setUp(self):
        from rest_framework.test import APIClient
        from django.core.cache import cache
        cache.clear()  # reset throttle counters between tests
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='resetme', email='reset@test.com',
            password='OldPassw0rd!x', role='customer')

    def _token(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        return (urlsafe_base64_encode(force_bytes(self.user.pk)),
                default_token_generator.make_token(self.user))

    def test_request_sends_email_for_known_address(self):
        from django.core import mail
        resp = self.client.post('/auth/password-reset/', {'email': 'RESET@test.com'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('/reset-password?uid=', mail.outbox[0].body)

    def test_request_does_not_reveal_unknown_address(self):
        from django.core import mail
        resp = self.client.post('/auth/password-reset/', {'email': 'nobody@test.com'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_sets_new_password_and_token_is_single_use(self):
        uid, token = self._token()
        resp = self.client.post('/auth/password-reset/confirm/', {
            'uid': uid, 'token': token, 'new_password': 'Brand-new-Pass-77'})
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Brand-new-Pass-77'))
        again = self.client.post('/auth/password-reset/confirm/', {
            'uid': uid, 'token': token, 'new_password': 'Another-Pass-88'})
        self.assertEqual(again.status_code, 400)

    def test_confirm_rejects_bad_token_and_weak_password(self):
        uid, token = self._token()
        bad = self.client.post('/auth/password-reset/confirm/', {
            'uid': uid, 'token': 'wrong', 'new_password': 'Brand-new-Pass-77'})
        self.assertEqual(bad.status_code, 400)
        weak = self.client.post('/auth/password-reset/confirm/', {
            'uid': uid, 'token': token, 'new_password': '12345678'})
        self.assertEqual(weak.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('OldPassw0rd!x'))


class AccountSettingsTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='acct', email='acct@test.com',
            password='OldPassw0rd!x', role='customer')
        self.client.force_authenticate(self.user)

    def test_update_profile(self):
        resp = self.client.patch('/auth/me/', {
            'first_name': 'Ada', 'last_name': 'Lovelace',
            'email': 'ada@test.com'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Ada')
        self.assertEqual(self.user.email, 'ada@test.com')

    def test_profile_update_cannot_change_role_or_username(self):
        resp = self.client.patch('/auth/me/', {
            'role': 'admin', 'username': 'hacker', 'is_staff': True},
            format='json')
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'customer')
        self.assertEqual(self.user.username, 'acct')
        self.assertFalse(self.user.is_staff)

    def test_change_password_requires_correct_current_password(self):
        resp = self.client.post('/auth/change-password/', {
            'current_password': 'wrong', 'new_password': 'Brand-new-Pass-77'},
            format='json')
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('OldPassw0rd!x'))

    def test_change_password_success_and_validation(self):
        weak = self.client.post('/auth/change-password/', {
            'current_password': 'OldPassw0rd!x', 'new_password': '12345678'},
            format='json')
        self.assertEqual(weak.status_code, 400)
        ok = self.client.post('/auth/change-password/', {
            'current_password': 'OldPassw0rd!x',
            'new_password': 'Brand-new-Pass-77'}, format='json')
        self.assertEqual(ok.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Brand-new-Pass-77'))

    def test_endpoints_require_login(self):
        anon = APIClient()
        self.assertEqual(anon.patch('/auth/me/', {}, format='json').status_code, 401)
        self.assertEqual(anon.post('/auth/change-password/', {}, format='json').status_code, 401)


class SessionAndAccountTests(TestCase):
    """Token invalidation, sign-out everywhere, close account, preferences"""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='sess', email='sess@test.com',
            password='OldPassw0rd!x', role='customer')

    def _login(self):
        resp = self.client.post('/auth/login/', {
            'username': 'sess', 'password': 'OldPassw0rd!x'}, format='json')
        self.assertEqual(resp.status_code, 200)
        return resp.data['access'], resp.data['refresh']

    def _auth(self, access):
        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        return c

    def test_sign_out_everywhere_invalidates_access_and_refresh(self):
        access, refresh = self._login()
        c = self._auth(access)
        self.assertEqual(c.get('/auth/me/').status_code, 200)

        self.assertEqual(c.post('/auth/sign-out-everywhere/').status_code, 200)

        self.assertEqual(c.get('/auth/me/').status_code, 401)
        r = APIClient().post('/auth/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(r.status_code, 401)

    def test_refresh_still_works_before_sign_out(self):
        _, refresh = self._login()
        r = APIClient().post('/auth/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.data)

    def test_password_change_signs_out_other_devices_but_not_this_one(self):
        old_access, _ = self._login()
        c = self._auth(old_access)
        resp = c.post('/auth/change-password/', {
            'current_password': 'OldPassw0rd!x',
            'new_password': 'Brand-new-Pass-77'}, format='json')
        self.assertEqual(resp.status_code, 200)
        # the old token (another device) is dead...
        self.assertEqual(self._auth(old_access).get('/auth/me/').status_code, 401)
        # ...the fresh token returned to this device works
        self.assertEqual(self._auth(resp.data['access']).get('/auth/me/').status_code, 200)

    def test_close_account_requires_password_and_deactivates(self):
        access, _ = self._login()
        c = self._auth(access)
        bad = c.post('/auth/close-account/', {'current_password': 'nope'}, format='json')
        self.assertEqual(bad.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

        ok = c.post('/auth/close-account/', {'current_password': 'OldPassw0rd!x'}, format='json')
        self.assertEqual(ok.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
        login = APIClient().post('/auth/login/', {
            'username': 'sess', 'password': 'OldPassw0rd!x'}, format='json')
        self.assertEqual(login.status_code, 401)

    def test_staff_cannot_close_account_themselves(self):
        agent = User.objects.create_user(
            username='ag', password='OldPassw0rd!x', role='agent')
        c = APIClient()
        c.force_authenticate(agent)
        resp = c.post('/auth/close-account/', {'current_password': 'OldPassw0rd!x'}, format='json')
        self.assertEqual(resp.status_code, 403)
        agent.refresh_from_db()
        self.assertTrue(agent.is_active)

    def test_notification_preferences_can_be_updated(self):
        c = APIClient()
        c.force_authenticate(self.user)
        resp = c.patch('/auth/me/', {'email_on_reply': False, 'email_on_status': False}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.email_on_reply)
        self.assertFalse(self.user.email_on_status)
        self.assertTrue(self.user.email_on_assignment)


class BootstrapAccountsCommandTests(TestCase):
    """The deploy-time command that creates starter accounts from env vars."""

    ENV = {
        'BOOTSTRAP_ADMIN_USERNAME': 'siteadmin',
        'BOOTSTRAP_ADMIN_EMAIL': 'admin@example.org',
        'BOOTSTRAP_ADMIN_PASSWORD': 'Rare-Admin-Pass-4471',
        'BOOTSTRAP_AGENT_USERNAME': 'demoagent',
        'BOOTSTRAP_AGENT_PASSWORD': 'Rare-Agent-Pass-4471',
        'BOOTSTRAP_CUSTOMER_USERNAME': 'democustomer',
        'BOOTSTRAP_CUSTOMER_PASSWORD': 'Rare-Cust-Pass-4471',
    }

    def _run(self, env):
        import os
        from io import StringIO
        from unittest.mock import patch
        from django.core.management import call_command
        out = StringIO()
        with patch.dict(os.environ, env, clear=False):
            for key in list(os.environ):
                if key.startswith('BOOTSTRAP_') and key not in env:
                    del os.environ[key]
            call_command('bootstrap_accounts', stdout=out)
        return out.getvalue()

    def test_creates_each_role_and_never_prints_passwords(self):
        output = self._run(self.ENV)
        admin = User.objects.get(username='siteadmin')
        self.assertEqual((admin.role, admin.is_superuser, admin.email), ('admin', True, 'admin@example.org'))
        self.assertEqual(User.objects.get(username='demoagent').role, 'agent')
        self.assertEqual(User.objects.get(username='democustomer').role, 'customer')
        self.assertTrue(admin.check_password('Rare-Admin-Pass-4471'))
        self.assertNotIn('Rare-', output)

    def test_is_idempotent_and_does_not_overwrite_existing_users(self):
        User.objects.create_user('demoagent', password='Original-Pass-9921', role='agent')
        self._run(self.ENV)
        self._run(self.ENV)
        self.assertEqual(User.objects.filter(username='demoagent').count(), 1)
        self.assertTrue(User.objects.get(username='demoagent').check_password('Original-Pass-9921'))

    def test_does_nothing_when_not_configured(self):
        self.assertIn('nothing to do', self._run({}))
        self.assertEqual(User.objects.count(), 0)

    def test_rejects_weak_passwords(self):
        from django.core.management.base import CommandError
        weak = {'BOOTSTRAP_ADMIN_USERNAME': 'siteadmin', 'BOOTSTRAP_ADMIN_PASSWORD': 'password123'}
        with self.assertRaises(CommandError):
            self._run(weak)
        self.assertFalse(User.objects.filter(username='siteadmin').exists())

    def test_username_without_password_is_an_error(self):
        from django.core.management.base import CommandError
        with self.assertRaises(CommandError):
            self._run({'BOOTSTRAP_AGENT_USERNAME': 'demoagent'})
