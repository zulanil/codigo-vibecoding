from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.warehouses.models import Warehouse


class WarehouseFilterTest(APITestCase):

    BASE_URL = '/api/v1/warehouses/'

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )

        self.wh_bogota = Warehouse.objects.create(
            name='Almacen Bogota',
            address='Calle 1',
            city='Bogota',
            country='Colombia',
            capacity_kg='5000.00',
        )
        self.wh_medellin = Warehouse.objects.create(
            name='Almacen Medellin',
            address='Carrera 2',
            city='Medellin',
            country='Colombia',
            capacity_kg='3000.00',
        )
        self.wh_lima = Warehouse.objects.create(
            name='Deposito Lima',
            address='Av. Peru 100',
            city='Lima',
            country='Peru',
            capacity_kg='2000.00',
        )

    # ------------------------------------------------------------------
    # filterset_fields: city
    # ------------------------------------------------------------------
    def test_filter_by_city_returns_only_matching(self):
        """?city=Bogota retorna solo almacenes de Bogota."""
        response = self.client.get(self.BASE_URL, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['city'], 'Bogota')

    def test_filter_by_city_no_match_returns_empty(self):
        """?city=Tokio retorna lista vacia cuando no hay coincidencias."""
        response = self.client.get(self.BASE_URL, {'city': 'Tokio'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # ------------------------------------------------------------------
    # filterset_fields: country
    # ------------------------------------------------------------------
    def test_filter_by_country_returns_only_matching(self):
        """?country=Colombia retorna solo almacenes de Colombia."""
        response = self.client.get(self.BASE_URL, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        for item in results:
            self.assertEqual(item['country'], 'Colombia')

    def test_filter_by_country_no_match_returns_empty(self):
        """?country=Japon retorna lista vacia cuando no hay coincidencias."""
        response = self.client.get(self.BASE_URL, {'country': 'Japon'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_filter_by_city_and_country_combined(self):
        """?city=Lima&country=Peru retorna exactamente el almacen de Lima."""
        response = self.client.get(self.BASE_URL, {'city': 'Lima', 'country': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.wh_lima.id)

    # ------------------------------------------------------------------
    # search_fields: name, city, country
    # ------------------------------------------------------------------
    def test_search_by_name_returns_matching(self):
        """?search=Deposito retorna almacenes cuyo nombre contiene 'Deposito'."""
        response = self.client.get(self.BASE_URL, {'search': 'Deposito'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.wh_lima.id)

    def test_search_by_city_returns_matching(self):
        """?search=Medellin retorna almacenes cuya ciudad contiene 'Medellin'."""
        response = self.client.get(self.BASE_URL, {'search': 'Medellin'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.wh_medellin.id)

    def test_search_by_country_returns_matching(self):
        """?search=Peru retorna almacenes cuyo pais contiene 'Peru'."""
        response = self.client.get(self.BASE_URL, {'search': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.wh_lima.id)

    def test_search_no_match_returns_empty(self):
        """?search=xyzzzz retorna lista vacia cuando no hay coincidencias."""
        response = self.client.get(self.BASE_URL, {'search': 'xyzzzz'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_search_partial_match(self):
        """?search=Alma retorna todos los almacenes cuyo nombre empieza con 'Alma'."""
        response = self.client.get(self.BASE_URL, {'search': 'Alma'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)

    # ------------------------------------------------------------------
    # ordering_fields: name, city, created_at
    # ------------------------------------------------------------------
    def test_ordering_by_name_asc(self):
        """?ordering=name retorna almacenes ordenados por nombre ascendente."""
        response = self.client.get(self.BASE_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_desc(self):
        """?ordering=-name retorna almacenes ordenados por nombre descendente."""
        response = self.client.get(self.BASE_URL, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_city_asc(self):
        """?ordering=city retorna almacenes ordenados por ciudad ascendente."""
        response = self.client.get(self.BASE_URL, {'ordering': 'city'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cities = [item['city'] for item in response.data['results']]
        self.assertEqual(cities, sorted(cities))
