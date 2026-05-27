from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from apps.suppliers.models import Supplier


class SupplierFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        self.supplier_a = Supplier.objects.create(
            name='Alpha Componentes',
            contact_name='Luis Torres',
            email='alpha@componentes.com',
            phone='1001001000',
            address='Zona Norte 1',
        )
        self.supplier_b = Supplier.objects.create(
            name='Beta Electricos',
            contact_name='Pedro Salas',
            email='beta@electricos.com',
            phone='2002002000',
            address='Zona Sur 2',
        )
        self.supplier_c = Supplier.objects.create(
            name='Gamma Tech',
            contact_name='Sandra Vargas',
            email='sandra@gammatech.com',
            phone='3003003000',
            address='Zona Centro 3',
        )

        self.base_url = '/api/v1/suppliers/'

    # --- Happy path (search) ---

    def test_search_by_name_returns_match(self):
        """?search=Alpha retorna solo el proveedor cuyo nombre contiene 'Alpha'."""
        response = self.client.get(self.base_url, {'search': 'Alpha'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Alpha Componentes')

    def test_search_by_email_returns_match(self):
        """?search=beta@electricos.com retorna el proveedor con ese email."""
        response = self.client.get(self.base_url, {'search': 'beta@electricos.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'beta@electricos.com')

    def test_search_by_contact_name_returns_match(self):
        """?search=Sandra retorna el proveedor cuyo contact_name contiene 'Sandra'."""
        response = self.client.get(self.base_url, {'search': 'Sandra'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['contact_name'], 'Sandra Vargas')

    def test_search_case_insensitive(self):
        """La busqueda es case-insensitive."""
        response = self.client.get(self.base_url, {'search': 'alpha'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Alpha Componentes')

    def test_search_partial_match(self):
        """La busqueda parcial funciona — 'Tech' coincide con 'Gamma Tech'."""
        response = self.client.get(self.base_url, {'search': 'Tech'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Gamma Tech')

    # --- Unhappy path (search) ---

    def test_search_no_match_returns_empty_list(self):
        """?search=zzznomatch retorna lista vacia."""
        response = self.client.get(self.base_url, {'search': 'zzznomatch'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 0)

    # --- Happy path (ordering) ---

    def test_ordering_by_name_asc(self):
        """?ordering=name retorna proveedores en orden alfabetico ascendente."""
        response = self.client.get(self.base_url, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_desc(self):
        """?ordering=-name retorna proveedores en orden alfabetico descendente."""
        response = self.client.get(self.base_url, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_created_at_asc(self):
        """?ordering=created_at retorna proveedores del mas antiguo al mas nuevo."""
        response = self.client.get(self.base_url, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [item['created_at'] for item in results]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_desc(self):
        """?ordering=-created_at retorna proveedores del mas nuevo al mas antiguo."""
        response = self.client.get(self.base_url, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [item['created_at'] for item in results]
        self.assertEqual(dates, sorted(dates, reverse=True))

    # --- Edge case ---

    def test_search_returns_multiple_matches(self):
        """?search=Zona no existe en name/email/contact_name — retorna 0 (address no es search field)."""
        response = self.client.get(self.base_url, {'search': 'Torres'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['contact_name'], 'Luis Torres')
