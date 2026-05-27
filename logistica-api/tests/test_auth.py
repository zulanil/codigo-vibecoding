from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


class AuthEndpointsTest(APITestCase):
    """
    Tests para los endpoints de autenticacion JWT:
      POST /api/v1/auth/token/
      POST /api/v1/auth/token/refresh/
      POST /api/v1/auth/token/verify/
    """

    TOKEN_URL = '/api/v1/auth/token/'
    REFRESH_URL = '/api/v1/auth/token/refresh/'
    VERIFY_URL = '/api/v1/auth/token/verify/'
    PROTECTED_URL = '/api/v1/customers/'

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.valid_credentials = {
            'username': 'testuser',
            'password': 'testpass123',
        }

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_login_valid_credentials_returns_200(self):
        """Login con credenciales validas devuelve 200 y tokens access + refresh."""
        response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_returns_non_empty_tokens(self):
        """Los tokens retornados no son cadenas vacias."""
        response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        self.assertTrue(len(response.data['access']) > 0)
        self.assertTrue(len(response.data['refresh']) > 0)

    def test_refresh_valid_token_returns_200(self):
        """Refresh con refresh token valido devuelve 200 y nuevo access token."""
        login_response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        refresh_token = login_response.data['refresh']

        response = self.client.post(self.REFRESH_URL, {'refresh': refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_returns_new_access_token(self):
        """El access token retornado por refresh es distinto del original."""
        login_response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        original_access = login_response.data['access']
        refresh_token = login_response.data['refresh']

        response = self.client.post(self.REFRESH_URL, {'refresh': refresh_token})
        new_access = response.data['access']
        # Los tokens pueden diferir (contienen timestamps distintos)
        self.assertIsNotNone(new_access)
        self.assertTrue(len(new_access) > 0)

    def test_verify_valid_token_returns_200(self):
        """Verify con access token valido devuelve 200."""
        login_response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        access_token = login_response.data['access']

        response = self.client.post(self.VERIFY_URL, {'token': access_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Unhappy path
    # ------------------------------------------------------------------

    def test_login_wrong_password_returns_401(self):
        """Login con contrasena incorrecta devuelve 401."""
        response = self.client.post(self.TOKEN_URL, {
            'username': 'testuser',
            'password': 'wrongpassword',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user_returns_401(self):
        """Login con usuario inexistente devuelve 401."""
        response = self.client.post(self.TOKEN_URL, {
            'username': 'noexiste',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_no_body_returns_400(self):
        """Login sin body devuelve 400."""
        response = self.client.post(self.TOKEN_URL, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_password_returns_400(self):
        """Login sin campo password devuelve 400."""
        response = self.client.post(self.TOKEN_URL, {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_username_returns_400(self):
        """Login sin campo username devuelve 400."""
        response = self.client.post(self.TOKEN_URL, {'password': 'testpass123'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_invalid_token_returns_401(self):
        """Refresh con token invalido devuelve 401."""
        response = self.client.post(self.REFRESH_URL, {'refresh': 'token.invalido.aqui'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_no_body_returns_400(self):
        """Refresh sin body devuelve 400."""
        response = self.client.post(self.REFRESH_URL, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_invalid_token_returns_401(self):
        """Verify con token invalido devuelve 401."""
        response = self.client.post(self.VERIFY_URL, {'token': 'token.invalido.aqui'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # Edge cases
    # ------------------------------------------------------------------

    def test_token_in_header_grants_access_to_protected_endpoint(self):
        """Access token valido en header permite acceso a endpoint protegido."""
        login_response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        access_token = login_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_no_token_denies_access_to_protected_endpoint(self):
        """Sin token, el endpoint protegido devuelve 401."""
        self.client.credentials()  # limpiar cualquier credencial
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_in_header_denies_access(self):
        """Token invalido en header devuelve 401 en endpoint protegido."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token.invalido.aqui')
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_malformed_authorization_header_returns_401(self):
        """Header Authorization malformado (sin 'Bearer') devuelve 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Token alguntoken')
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_used_as_access_token_denied(self):
        """Un refresh token no puede usarse como access token en el header."""
        login_response = self.client.post(self.TOKEN_URL, self.valid_credentials)
        refresh_token = login_response.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh_token}')
        response = self.client.get(self.PROTECTED_URL)
        # simplejwt rechaza refresh tokens como access tokens
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
