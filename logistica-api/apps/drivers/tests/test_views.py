from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver


class DriverViewSetTest(APITestCase):

    def setUp(self):
        # User for JWT authentication (not used as a Driver)
        self.auth_user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.auth_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        # Separate user assigned to the driver fixture
        self.driver_user = User.objects.create_user(
            username='driveruser',
            first_name='Carlos',
            last_name='Lopez',
            password='driverpass'
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-100',
            phone='3001234567',
            status=Driver.AVAILABLE,
        )

    # --- Happy path ---

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)

    def test_list_contains_created_driver(self):
        response = self.client.get('/api/v1/drivers/')
        results = response.data['results']
        ids = [item['id'] for item in results]
        self.assertIn(self.driver.id, ids)

    def test_create_returns_201(self):
        new_user = User.objects.create_user(username='newdriver', password='pass')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-200',
            'phone': '3009876543',
            'status': 'available',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Driver.objects.filter(license_number='LIC-200').exists())

    def test_create_persists_to_db(self):
        new_user = User.objects.create_user(username='persistdriver', password='pass')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-300',
            'phone': '3005551234',
            'status': 'off_duty',
        }
        self.client.post('/api/v1/drivers/', payload, format='json')
        driver = Driver.objects.get(license_number='LIC-300')
        self.assertEqual(driver.phone, '3005551234')
        self.assertEqual(driver.status, 'off_duty')

    def test_retrieve_returns_200(self):
        response = self.client.get(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.driver.id)
        self.assertEqual(response.data['license_number'], 'LIC-100')

    def test_update_returns_200(self):
        payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-100',
            'phone': '3001111111',
            'status': 'on_route',
        }
        response = self.client.put(f'/api/v1/drivers/{self.driver.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.phone, '3001111111')
        self.assertEqual(self.driver.status, 'on_route')

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            f'/api/v1/drivers/{self.driver.id}/',
            {'status': 'off_duty'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.status, 'off_duty')

    def test_destroy_returns_204(self):
        response = self.client.delete(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # --- Unhappy path ---

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get('/api/v1/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        new_user = User.objects.create_user(username='unauth_d', password='pass')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-999',
            'phone': '3000000000',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_license_number_returns_400(self):
        new_user = User.objects.create_user(username='nolicdriver', password='pass')
        payload = {
            'user': new_user.id,
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_phone_returns_400(self):
        new_user = User.objects.create_user(username='nophonedriver', password='pass')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-888',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_user_returns_400(self):
        payload = {
            'license_number': 'LIC-777',
            'phone': '3001234567',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_license_number_returns_400(self):
        new_user = User.objects.create_user(username='dupdriver', password='pass')
        payload = {
            'user': new_user.id,
            'license_number': 'LIC-100',  # already exists
            'phone': '3002222222',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_user_returns_400(self):
        payload = {
            'user': self.driver_user.id,  # already linked to a driver
            'license_number': 'LIC-DUP-USER',
            'phone': '3003333333',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-000',
            'phone': '3000000000',
            'status': 'available',
        }
        response = self.client.put('/api/v1/drivers/99999/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_destroy_soft_deletes(self):
        response = self.client.delete(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_active)

    def test_destroy_removes_from_list(self):
        self.client.delete(f'/api/v1/drivers/{self.driver.id}/')
        list_response = self.client.get('/api/v1/drivers/')
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.driver.id, ids)

    def test_destroy_retrieve_returns_404_after_soft_delete(self):
        self.client.delete(f'/api/v1/drivers/{self.driver.id}/')
        response = self.client.get(f'/api/v1/drivers/{self.driver.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_excludes_inactive_driver(self):
        inactive_user = User.objects.create_user(username='inactivedriver', password='pass')
        Driver.objects.create(
            user=inactive_user,
            license_number='LIC-INACTIVE',
            phone='3004444444',
            is_active=False,
        )
        response = self.client.get('/api/v1/drivers/')
        results = response.data['results']
        license_numbers = [item['license_number'] for item in results]
        self.assertNotIn('LIC-INACTIVE', license_numbers)

    def test_list_pagination_structure(self):
        response = self.client.get('/api/v1/drivers/')
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_create_with_status_on_route(self):
        on_route_user = User.objects.create_user(username='onroutedriver', password='pass')
        payload = {
            'user': on_route_user.id,
            'license_number': 'LIC-ON-ROUTE',
            'phone': '3005555555',
            'status': 'on_route',
        }
        response = self.client.post('/api/v1/drivers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'on_route')
