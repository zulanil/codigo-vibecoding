from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver
from apps.transport.models import Transport


class TransportFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        # Driver for FK tests
        driver_user = User.objects.create_user(
            username='driver1',
            password='pass123',
            first_name='Ana',
            last_name='Lopez',
        )
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            phone='555-0010',
            status='available',
        )

        # Second driver
        driver_user2 = User.objects.create_user(
            username='driver2',
            password='pass123',
            first_name='Carlos',
            last_name='Ruiz',
        )
        self.driver2 = Driver.objects.create(
            user=driver_user2,
            license_number='LIC-002',
            phone='555-0020',
            status='available',
        )

        # Create transports with different types/statuses/drivers
        self.truck = Transport.objects.create(
            driver=self.driver,
            plate_number='TRK-001',
            vehicle_type='truck',
            capacity_kg='10000.00',
            status='available',
        )
        self.van = Transport.objects.create(
            driver=self.driver2,
            plate_number='VAN-001',
            vehicle_type='van',
            capacity_kg='3000.00',
            status='in_use',
        )
        self.motorcycle = Transport.objects.create(
            plate_number='MOT-001',
            vehicle_type='motorcycle',
            capacity_kg='100.00',
            status='maintenance',
        )

    # --- Filter by vehicle_type ---

    def test_filter_by_vehicle_type_truck(self):
        response = self.client.get('/api/v1/transports/?vehicle_type=truck')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['vehicle_type'], 'truck')

    def test_filter_by_vehicle_type_van(self):
        response = self.client.get('/api/v1/transports/?vehicle_type=van')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['vehicle_type'], 'van')

    def test_filter_by_vehicle_type_motorcycle(self):
        response = self.client.get('/api/v1/transports/?vehicle_type=motorcycle')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['vehicle_type'], 'motorcycle')

    def test_filter_by_vehicle_type_invalid_value_returns_400(self):
        # django-filter validates choices; an invalid choice value returns 400
        response = self.client.get('/api/v1/transports/?vehicle_type=bicycle')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Filter by status ---

    def test_filter_by_status_available(self):
        response = self.client.get('/api/v1/transports/?status=available')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'available')

    def test_filter_by_status_in_use(self):
        response = self.client.get('/api/v1/transports/?status=in_use')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'in_use')

    def test_filter_by_status_maintenance(self):
        response = self.client.get('/api/v1/transports/?status=maintenance')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['status'], 'maintenance')

    # --- Filter by driver ---

    def test_filter_by_driver(self):
        response = self.client.get(f'/api/v1/transports/?driver={self.driver.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['driver'], self.driver.id)

    def test_filter_by_driver_nonexistent_id_returns_400(self):
        # django-filter validates FK existence; a non-existent driver id returns 400
        response = self.client.get('/api/v1/transports/?driver=99999')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Search by plate_number ---

    def test_search_by_plate_number_exact(self):
        response = self.client.get('/api/v1/transports/?search=TRK-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['plate_number'], 'TRK-001')

    def test_search_by_plate_number_partial(self):
        response = self.client.get('/api/v1/transports/?search=TRK')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['plate_number'], 'TRK-001')

    def test_search_no_match_returns_empty(self):
        response = self.client.get('/api/v1/transports/?search=ZZZNOMATCH')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 0)

    # --- Ordering ---

    def test_ordering_by_plate_number_asc(self):
        response = self.client.get('/api/v1/transports/?ordering=plate_number')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        plate_numbers = [r['plate_number'] for r in results]
        self.assertEqual(plate_numbers, sorted(plate_numbers))

    def test_ordering_by_plate_number_desc(self):
        response = self.client.get('/api/v1/transports/?ordering=-plate_number')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        plate_numbers = [r['plate_number'] for r in results]
        self.assertEqual(plate_numbers, sorted(plate_numbers, reverse=True))

    def test_ordering_by_vehicle_type_asc(self):
        response = self.client.get('/api/v1/transports/?ordering=vehicle_type')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        types = [r['vehicle_type'] for r in results]
        self.assertEqual(types, sorted(types))

    def test_ordering_by_status_asc(self):
        response = self.client.get('/api/v1/transports/?ordering=status')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        statuses = [r['status'] for r in results]
        self.assertEqual(statuses, sorted(statuses))

    # --- Combined filters ---

    def test_combined_filter_vehicle_type_and_status(self):
        response = self.client.get('/api/v1/transports/?vehicle_type=truck&status=available')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['plate_number'], 'TRK-001')
