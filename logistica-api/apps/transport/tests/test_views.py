from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver
from apps.transport.models import Transport


class TransportViewSetTest(APITestCase):

    def setUp(self):
        # API user (auth)
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        # Driver dependency
        driver_user = User.objects.create_user(
            username='driver1',
            password='pass123',
            first_name='John',
            last_name='Doe',
        )
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            phone='555-0010',
            status='available',
        )

        # Base transport object for read/update/delete tests
        self.transport = Transport.objects.create(
            driver=self.driver,
            plate_number='ABC-001',
            vehicle_type='truck',
            capacity_kg='5000.00',
            status='available',
        )

    # --- Happy path ---

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/transports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['plate_number'], 'ABC-001')

    def test_create_returns_201(self):
        payload = {
            'plate_number': 'NEW-999',
            'vehicle_type': 'van',
            'capacity_kg': '2000.00',
            'status': 'available',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['plate_number'], 'NEW-999')
        self.assertTrue(Transport.objects.filter(plate_number='NEW-999').exists())

    def test_create_with_driver_returns_201(self):
        payload = {
            'driver': self.driver.id,
            'plate_number': 'DRV-001',
            'vehicle_type': 'motorcycle',
            'capacity_kg': '150.00',
            'status': 'in_use',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['driver'], self.driver.id)

    def test_retrieve_returns_200(self):
        response = self.client.get(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['plate_number'], 'ABC-001')
        self.assertEqual(response.data['vehicle_type'], 'truck')
        self.assertEqual(response.data['id'], self.transport.id)

    def test_update_returns_200(self):
        payload = {
            'plate_number': 'ABC-001',
            'vehicle_type': 'van',
            'capacity_kg': '3000.00',
            'status': 'maintenance',
        }
        response = self.client.put(f'/api/v1/transports/{self.transport.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.vehicle_type, 'van')
        self.assertEqual(float(self.transport.capacity_kg), 3000.00)
        self.assertEqual(self.transport.status, 'maintenance')

    def test_partial_update_returns_200(self):
        payload = {'status': 'in_use'}
        response = self.client.patch(f'/api/v1/transports/{self.transport.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.status, 'in_use')
        # Other fields unchanged
        self.assertEqual(self.transport.plate_number, 'ABC-001')

    def test_destroy_returns_204(self):
        response = self.client.delete(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # --- Unhappy path ---

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get('/api/v1/transports/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        payload = {
            'plate_number': 'UNA-001',
            'vehicle_type': 'truck',
            'capacity_kg': '5000.00',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_plate_number_returns_400(self):
        payload = {
            'vehicle_type': 'truck',
            'capacity_kg': '5000.00',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('plate_number', response.data)

    def test_create_missing_vehicle_type_returns_400(self):
        payload = {
            'plate_number': 'MVT-001',
            'capacity_kg': '5000.00',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle_type', response.data)

    def test_create_missing_capacity_kg_returns_400(self):
        payload = {
            'plate_number': 'MCP-001',
            'vehicle_type': 'van',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_kg', response.data)

    def test_create_duplicate_plate_number_returns_400(self):
        payload = {
            'plate_number': 'ABC-001',  # already exists in setUp
            'vehicle_type': 'van',
            'capacity_kg': '1500.00',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('plate_number', response.data)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get('/api/v1/transports/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        payload = {
            'plate_number': 'NOT-001',
            'vehicle_type': 'truck',
            'capacity_kg': '5000.00',
        }
        response = self.client.put('/api/v1/transports/99999/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_destroy_soft_deletes(self):
        response = self.client.delete(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.transport.refresh_from_db()
        self.assertFalse(self.transport.is_active)
        # Object no longer appears in list
        list_response = self.client.get('/api/v1/transports/')
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.transport.id, ids)

    def test_list_excludes_inactive(self):
        # Mark setUp transport inactive directly
        self.transport.is_active = False
        self.transport.save()
        response = self.client.get('/api/v1/transports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        ids = [item['id'] for item in results]
        self.assertNotIn(self.transport.id, ids)

    def test_retrieve_inactive_transport_returns_404(self):
        self.transport.is_active = False
        self.transport.save()
        response = self.client.get(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_returns_paginated_response(self):
        response = self.client.get('/api/v1/transports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_create_transport_without_driver(self):
        payload = {
            'plate_number': 'NOD-001',
            'vehicle_type': 'motorcycle',
            'capacity_kg': '100.00',
        }
        response = self.client.post('/api/v1/transports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['driver'])

    def test_response_contains_expected_fields(self):
        response = self.client.get(f'/api/v1/transports/{self.transport.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_fields = {'id', 'driver', 'plate_number', 'vehicle_type', 'capacity_kg', 'status', 'created_at', 'updated_at'}
        self.assertTrue(expected_fields.issubset(set(response.data.keys())))

    def test_partial_update_capacity_kg(self):
        payload = {'capacity_kg': '9999.99'}
        response = self.client.patch(f'/api/v1/transports/{self.transport.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertEqual(float(self.transport.capacity_kg), 9999.99)

    def test_update_assigns_driver(self):
        transport_no_driver = Transport.objects.create(
            plate_number='NDD-001',
            vehicle_type='van',
            capacity_kg='2000.00',
        )
        payload = {
            'plate_number': 'NDD-001',
            'vehicle_type': 'van',
            'capacity_kg': '2000.00',
            'driver': self.driver.id,
        }
        response = self.client.put(f'/api/v1/transports/{transport_no_driver.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        transport_no_driver.refresh_from_db()
        self.assertEqual(transport_no_driver.driver, self.driver)
