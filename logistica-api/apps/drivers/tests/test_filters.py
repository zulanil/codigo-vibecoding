from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver


class DriverFilterTest(APITestCase):

    def setUp(self):
        self.auth_user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.auth_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        user_a = User.objects.create_user(
            username='driver_available',
            first_name='Ana',
            last_name='Garcia',
            password='pass'
        )
        user_b = User.objects.create_user(
            username='driver_on_route',
            first_name='Pedro',
            last_name='Blanco',
            password='pass'
        )
        user_c = User.objects.create_user(
            username='driver_off_duty',
            first_name='Maria',
            last_name='Torres',
            password='pass'
        )

        self.driver_available = Driver.objects.create(
            user=user_a,
            license_number='LIC-A001',
            phone='3001000001',
            status=Driver.AVAILABLE,
        )
        self.driver_on_route = Driver.objects.create(
            user=user_b,
            license_number='LIC-B002',
            phone='3001000002',
            status=Driver.ON_ROUTE,
        )
        self.driver_off_duty = Driver.objects.create(
            user=user_c,
            license_number='LIC-C003',
            phone='3001000003',
            status=Driver.OFF_DUTY,
        )

    # --- Filter by status ---

    def test_filter_by_status_available(self):
        response = self.client.get('/api/v1/drivers/?status=available')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-A001')

    def test_filter_by_status_on_route(self):
        response = self.client.get('/api/v1/drivers/?status=on_route')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-B002')

    def test_filter_by_status_off_duty(self):
        response = self.client.get('/api/v1/drivers/?status=off_duty')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-C003')

    def test_filter_by_status_returns_only_matching(self):
        response = self.client.get('/api/v1/drivers/?status=available')
        results = response.data['results']
        for item in results:
            self.assertEqual(item['status'], 'available')

    # --- Search ---

    def test_search_by_first_name(self):
        response = self.client.get('/api/v1/drivers/?search=Ana')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-A001')

    def test_search_by_last_name(self):
        response = self.client.get('/api/v1/drivers/?search=Blanco')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-B002')

    def test_search_by_license_number(self):
        response = self.client.get('/api/v1/drivers/?search=LIC-C003')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['license_number'], 'LIC-C003')

    def test_search_no_match_returns_empty(self):
        response = self.client.get('/api/v1/drivers/?search=zzznomatch')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 0)

    # --- Ordering ---

    def test_ordering_by_status_asc(self):
        response = self.client.get('/api/v1/drivers/?ordering=status')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        statuses = [item['status'] for item in results]
        self.assertEqual(statuses, sorted(statuses))

    def test_ordering_by_status_desc(self):
        response = self.client.get('/api/v1/drivers/?ordering=-status')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        statuses = [item['status'] for item in results]
        self.assertEqual(statuses, sorted(statuses, reverse=True))

    def test_ordering_by_created_at_asc(self):
        response = self.client.get('/api/v1/drivers/?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [item['created_at'] for item in results]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_desc(self):
        response = self.client.get('/api/v1/drivers/?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [item['created_at'] for item in results]
        self.assertEqual(dates, sorted(dates, reverse=True))
