from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.warehouses.models import Warehouse


class WarehouseViewSetTest(APITestCase):

    BASE_URL = '/api/v1/warehouses/'

    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )
        self.warehouse = Warehouse.objects.create(
            name='Almacen Principal',
            address='Av. Siempre Viva 123',
            city='Bogota',
            country='Colombia',
            capacity_kg='8000.00',
        )

    def _valid_payload(self, **overrides):
        data = {
            'name': 'Nuevo Almacen',
            'address': 'Calle 50 # 10-20',
            'city': 'Medellin',
            'country': 'Colombia',
            'capacity_kg': '3000.00',
        }
        data.update(overrides)
        return data

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------
    def test_list_returns_200(self):
        """GET /warehouses/ con token valido retorna 200 y lista paginada."""
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Almacen Principal')

    def test_create_returns_201(self):
        """POST /warehouses/ con datos validos crea el recurso y retorna 201."""
        payload = self._valid_payload()
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Warehouse.objects.filter(name='Nuevo Almacen').exists())

    def test_retrieve_returns_200(self):
        """GET /warehouses/{id}/ retorna 200 con los datos del almacen."""
        url = f'{self.BASE_URL}{self.warehouse.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.warehouse.id)
        self.assertEqual(response.data['name'], self.warehouse.name)

    def test_update_returns_200(self):
        """PUT /warehouses/{id}/ actualiza todos los campos y retorna 200."""
        url = f'{self.BASE_URL}{self.warehouse.id}/'
        payload = self._valid_payload(name='Almacen Actualizado', city='Cali')
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Almacen Actualizado')
        self.assertEqual(self.warehouse.city, 'Cali')

    def test_partial_update_returns_200(self):
        """PATCH /warehouses/{id}/ actualiza solo el campo indicado y retorna 200."""
        url = f'{self.BASE_URL}{self.warehouse.id}/'
        response = self.client.patch(url, {'city': 'Barranquilla'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.city, 'Barranquilla')

    def test_destroy_returns_204(self):
        """DELETE /warehouses/{id}/ retorna 204."""
        url = f'{self.BASE_URL}{self.warehouse.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_create_response_contains_expected_fields(self):
        """La respuesta de creacion incluye todos los campos del serializer."""
        payload = self._valid_payload()
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        for field in ['id', 'name', 'address', 'city', 'country', 'capacity_kg', 'created_at', 'updated_at']:
            self.assertIn(field, response.data)

    # ------------------------------------------------------------------
    # Unhappy path
    # ------------------------------------------------------------------
    def test_list_unauthenticated_returns_401(self):
        """GET /warehouses/ sin token retorna 401."""
        self.client.credentials()
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        """POST /warehouses/ sin token retorna 401."""
        self.client.credentials()
        response = self.client.post(self.BASE_URL, self._valid_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET /warehouses/{id}/ sin token retorna 401."""
        self.client.credentials()
        url = f'{self.BASE_URL}{self.warehouse.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_name_returns_400(self):
        """POST sin name retorna 400 con error en el campo 'name'."""
        payload = self._valid_payload()
        del payload['name']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_city_returns_400(self):
        """POST sin city retorna 400 con error en el campo 'city'."""
        payload = self._valid_payload()
        del payload['city']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_missing_country_returns_400(self):
        """POST sin country retorna 400 con error en el campo 'country'."""
        payload = self._valid_payload()
        del payload['country']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('country', response.data)

    def test_create_missing_capacity_kg_returns_400(self):
        """POST sin capacity_kg retorna 400."""
        payload = self._valid_payload()
        del payload['capacity_kg']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_kg', response.data)

    def test_create_invalid_capacity_kg_returns_400(self):
        """POST con capacity_kg no numerico retorna 400."""
        payload = self._valid_payload(capacity_kg='no-es-numero')
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_kg', response.data)

    def test_retrieve_nonexistent_returns_404(self):
        """GET /warehouses/99999/ retorna 404."""
        response = self.client.get(f'{self.BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        """PUT /warehouses/99999/ retorna 404."""
        response = self.client.put(f'{self.BASE_URL}99999/', self._valid_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        """DELETE /warehouses/99999/ retorna 404."""
        response = self.client.delete(f'{self.BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Edge cases
    # ------------------------------------------------------------------
    def test_destroy_soft_deletes(self):
        """DELETE marca is_active=False en DB y el objeto deja de aparecer en list."""
        url = f'{self.BASE_URL}{self.warehouse.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.warehouse.refresh_from_db()
        self.assertFalse(self.warehouse.is_active)
        list_response = self.client.get(self.BASE_URL)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.warehouse.id, ids)

    def test_list_excludes_inactive(self):
        """Almacenes con is_active=False no aparecen en el listado."""
        Warehouse.objects.create(
            name='Almacen Inactivo',
            address='Carrera 8 # 5-6',
            city='Cali',
            country='Colombia',
            capacity_kg='1000.00',
            is_active=False,
        )
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertNotIn('Almacen Inactivo', names)

    def test_retrieve_inactive_warehouse_returns_404(self):
        """GET /warehouses/{id}/ de un almacen inactivo retorna 404."""
        inactive = Warehouse.objects.create(
            name='Inactivo',
            address='Dir',
            city='Ciudad',
            country='Pais',
            capacity_kg='500.00',
            is_active=False,
        )
        response = self.client.get(f'{self.BASE_URL}{inactive.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_read_only_fields_ignored_on_create(self):
        """created_at y updated_at enviados en POST son ignorados."""
        payload = self._valid_payload()
        payload['created_at'] = '2000-01-01T00:00:00Z'
        payload['updated_at'] = '2000-01-01T00:00:00Z'
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['created_at'], '2000-01-01T00:00:00Z')

    def test_list_pagination_structure(self):
        """La respuesta de list incluye count, next, previous y results."""
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in ['count', 'next', 'previous', 'results']:
            self.assertIn(key, response.data)
