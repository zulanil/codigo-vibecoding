from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from apps.suppliers.models import Supplier


class SupplierViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        self.supplier = Supplier.objects.create(
            name='Tech Parts SA',
            contact_name='Juan Perez',
            email='contact@techparts.com',
            phone='1234567890',
            address='Av. Industrial 100, Bogota',
        )

        self.base_url = '/api/v1/suppliers/'
        self.detail_url = f'/api/v1/suppliers/{self.supplier.id}/'

    # --- Happy path ---

    def test_list_returns_200(self):
        """GET /api/v1/suppliers/ retorna 200 y contiene el objeto creado en setUp."""
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'contact@techparts.com')

    def test_create_returns_201(self):
        """POST /api/v1/suppliers/ con datos validos retorna 201 y el objeto queda en BD."""
        payload = {
            'name': 'Nuevo Proveedor SAS',
            'contact_name': 'Ana Lopez',
            'email': 'ana@nuevoproveedor.com',
            'phone': '0987654321',
            'address': 'Calle 10, Medellin',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Supplier.objects.filter(email='ana@nuevoproveedor.com').exists())

    def test_retrieve_returns_200(self):
        """GET /api/v1/suppliers/{id}/ retorna 200 y los datos del proveedor."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.supplier.id)
        self.assertEqual(response.data['name'], 'Tech Parts SA')
        self.assertEqual(response.data['email'], 'contact@techparts.com')

    def test_update_returns_200(self):
        """PUT /api/v1/suppliers/{id}/ con todos los campos retorna 200 y persiste cambios."""
        payload = {
            'name': 'Tech Parts Actualizado',
            'contact_name': 'Juan Perez',
            'email': 'nuevo@techparts.com',
            'phone': '1111111111',
            'address': 'Nueva Direccion 200, Bogota',
        }
        response = self.client.put(self.detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Tech Parts Actualizado')
        self.assertEqual(self.supplier.email, 'nuevo@techparts.com')

    def test_partial_update_returns_200(self):
        """PATCH /api/v1/suppliers/{id}/ con un campo retorna 200 y solo cambia ese campo."""
        payload = {'phone': '9999999999'}
        response = self.client.patch(self.detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.phone, '9999999999')
        self.assertEqual(self.supplier.name, 'Tech Parts SA')

    def test_destroy_returns_204(self):
        """DELETE /api/v1/suppliers/{id}/ retorna 204."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_response_includes_expected_fields(self):
        """La respuesta de retrieve incluye los campos documentados."""
        response = self.client.get(self.detail_url)
        expected_fields = {'id', 'name', 'contact_name', 'email', 'phone', 'address', 'created_at', 'updated_at'}
        self.assertEqual(set(response.data.keys()), expected_fields)

    def test_response_excludes_is_active(self):
        """El campo is_active no se expone en la respuesta de la API."""
        response = self.client.get(self.detail_url)
        self.assertNotIn('is_active', response.data)

    # --- Unhappy path ---

    def test_list_unauthenticated_returns_401(self):
        """GET sin token retorna 401."""
        self.client.credentials()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        """POST sin token retorna 401."""
        self.client.credentials()
        payload = {
            'name': 'Proveedor X',
            'contact_name': 'Pedro',
            'email': 'x@proveedor.com',
            'phone': '123',
            'address': 'Calle X',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET detalle sin token retorna 401."""
        self.client.credentials()
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_required_field_returns_400(self):
        """POST sin campo requerido (email) retorna 400."""
        payload = {
            'name': 'Sin Email SA',
            'contact_name': 'Carlos',
            'phone': '111222333',
            'address': 'Carrera 10, Cali',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_missing_name_returns_400(self):
        """POST sin nombre retorna 400."""
        payload = {
            'contact_name': 'Carlos',
            'email': 'carlos@test.com',
            'phone': '111222333',
            'address': 'Carrera 10, Cali',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_invalid_email_returns_400(self):
        """POST con email con formato invalido retorna 400."""
        payload = {
            'name': 'Proveedor Y',
            'contact_name': 'Luis',
            'email': 'esto-no-es-un-email',
            'phone': '555666777',
            'address': 'Zona 7',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_duplicate_email_returns_400(self):
        """POST con email ya existente retorna 400."""
        payload = {
            'name': 'Copia Tech Parts',
            'contact_name': 'Pedro',
            'email': 'contact@techparts.com',
            'phone': '0000000000',
            'address': 'Otra Direccion',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_retrieve_nonexistent_returns_404(self):
        """GET /api/v1/suppliers/99999/ retorna 404."""
        response = self.client.get('/api/v1/suppliers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        """PUT /api/v1/suppliers/99999/ retorna 404."""
        payload = {
            'name': 'No existe',
            'contact_name': 'Nadie',
            'email': 'noexiste@test.com',
            'phone': '000',
            'address': 'Ninguna',
        }
        response = self.client.put('/api/v1/suppliers/99999/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        """DELETE sin token retorna 401."""
        self.client.credentials()
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Edge cases ---

    def test_destroy_soft_deletes(self):
        """DELETE pone is_active=False sin borrar el registro y lo excluye del list."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.supplier.refresh_from_db()
        self.assertFalse(self.supplier.is_active)
        list_response = self.client.get(self.base_url)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.supplier.id, ids)

    def test_list_excludes_inactive_suppliers(self):
        """Los proveedores con is_active=False no aparecen en el listado."""
        inactive = Supplier.objects.create(
            name='Inactivo SA',
            contact_name='Ghost',
            email='ghost@inactivo.com',
            phone='000000000',
            address='Calle Fantasma 0',
            is_active=False,
        )
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive.id, ids)

    def test_retrieve_inactive_supplier_returns_404(self):
        """GET de un proveedor con is_active=False retorna 404."""
        self.supplier.is_active = False
        self.supplier.save()
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_read_only_fields_ignored_on_create(self):
        """created_at y updated_at en el payload son ignorados — se asignan automaticamente."""
        payload = {
            'name': 'Proveedor Nuevo',
            'contact_name': 'Maria',
            'email': 'maria@nuevo.com',
            'phone': '321321321',
            'address': 'Sector Industrial 5',
            'created_at': '2000-01-01T00:00:00Z',
            'updated_at': '2000-01-01T00:00:00Z',
        }
        response = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Supplier.objects.get(email='maria@nuevo.com')
        self.assertNotEqual(
            str(created.created_at),
            '2000-01-01 00:00:00+00:00',
        )

    def test_list_pagination_structure(self):
        """La respuesta de list tiene estructura paginada con 'results'."""
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
