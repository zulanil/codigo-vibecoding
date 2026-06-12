from django.contrib.auth.models import User, Group
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


def auth_header(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


class CustomTokenTest(APITestCase):
    TOKEN_URL = '/api/v1/auth/token/'

    def setUp(self):
        self.superuser = User.objects.create_superuser('admin', 'admin@test.com', 'pass1234!')
        self.regular = User.objects.create_user('operador', 'op@test.com', 'pass1234!')
        self.group = Group.objects.create(name='Operador')
        self.regular.groups.add(self.group)

    def test_login_superuser_returns_is_superuser_true(self):
        r = self.client.post(self.TOKEN_URL, {'username': 'admin', 'password': 'pass1234!'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data['is_superuser'])
        self.assertEqual(r.data['groups'], [])

    def test_login_regular_returns_is_superuser_false(self):
        r = self.client.post(self.TOKEN_URL, {'username': 'operador', 'password': 'pass1234!'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(r.data['is_superuser'])
        self.assertEqual(r.data['groups'], ['Operador'])


class CurrentUserViewTest(APITestCase):
    ME_URL = '/api/v1/auth/me/'

    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass1234!')

    def test_me_authenticated_returns_200(self):
        r = self.client.get(self.ME_URL, **auth_header(self.user))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['username'], 'testuser')

    def test_me_unauthenticated_returns_401(self):
        r = self.client.get(self.ME_URL)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class UserViewSetTest(APITestCase):
    USERS_URL = '/api/v1/auth/users/'

    def setUp(self):
        self.superuser = User.objects.create_superuser('admin', 'admin@test.com', 'pass1234!')
        self.regular = User.objects.create_user('operador', 'op@test.com', 'pass1234!')

    def test_list_users_superuser_returns_200(self):
        r = self.client.get(self.USERS_URL, **auth_header(self.superuser))
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_list_users_regular_returns_403(self):
        r = self.client.get(self.USERS_URL, **auth_header(self.regular))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_users_unauthenticated_returns_401(self):
        r = self.client.get(self.USERS_URL)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_user_superuser_returns_201(self):
        r = self.client.post(
            self.USERS_URL,
            {'username': 'nuevo', 'password': 'pass1234!', 'email': 'nuevo@test.com',
             'first_name': '', 'last_name': '', 'is_active': True, 'is_superuser': False, 'groups': []},
            format='json',
            **auth_header(self.superuser),
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='nuevo').exists())

    def test_deactivate_user(self):
        r = self.client.post(
            f'{self.USERS_URL}{self.regular.pk}/deactivate/',
            **auth_header(self.superuser),
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.regular.refresh_from_db()
        self.assertFalse(self.regular.is_active)


class GroupViewSetTest(APITestCase):
    GROUPS_URL = '/api/v1/auth/groups/'

    def setUp(self):
        self.superuser = User.objects.create_superuser('admin', 'admin@test.com', 'pass1234!')
        self.regular = User.objects.create_user('operador', 'op@test.com', 'pass1234!')
        Group.objects.create(name='Operador')

    def test_list_groups_superuser_returns_200(self):
        r = self.client.get(self.GROUPS_URL, **auth_header(self.superuser))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data), 1)

    def test_list_groups_regular_returns_403(self):
        r = self.client.get(self.GROUPS_URL, **auth_header(self.regular))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
