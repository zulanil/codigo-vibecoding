from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer


BASE_URL = '/api/v1/customers/'


class CustomerFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )
        self.individual = Customer.objects.create(
            name='Alice Individual',
            customer_type=Customer.INDIVIDUAL,
            email='alice@example.com',
            phone='555-0001',
            address='1 Alice St',
        )
        self.company = Customer.objects.create(
            name='Beta Company',
            customer_type=Customer.COMPANY,
            email='beta@example.com',
            phone='555-0002',
            address='2 Beta Ave',
            company_name='Beta Holdings',
        )

    # ------------------------------------------------------------------ #
    # filterset_fields: customer_type
    # ------------------------------------------------------------------ #

    def test_filter_by_customer_type_individual(self):
        response = self.client.get(BASE_URL, {'customer_type': 'individual'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'alice@example.com')

    def test_filter_by_customer_type_company(self):
        response = self.client.get(BASE_URL, {'customer_type': 'company'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'beta@example.com')

    def test_filter_by_customer_type_invalid_value_returns_400(self):
        # DjangoFilterBackend valida los choices — un valor fuera del enum retorna 400
        response = self.client.get(BASE_URL, {'customer_type': 'government'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # search_fields: name, email, company_name
    # ------------------------------------------------------------------ #

    def test_search_by_name(self):
        response = self.client.get(BASE_URL, {'search': 'Alice'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'alice@example.com')

    def test_search_by_email(self):
        response = self.client.get(BASE_URL, {'search': 'beta@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'beta@example.com')

    def test_search_by_company_name(self):
        response = self.client.get(BASE_URL, {'search': 'Beta Holdings'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'beta@example.com')

    def test_search_no_match_returns_empty(self):
        response = self.client.get(BASE_URL, {'search': 'zzznomatch'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 0)

    def test_search_partial_name_returns_match(self):
        response = self.client.get(BASE_URL, {'search': 'Individ'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)

    # ------------------------------------------------------------------ #
    # ordering_fields: name, created_at
    # ------------------------------------------------------------------ #

    def test_ordering_by_name_asc(self):
        response = self.client.get(BASE_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        names = [r['name'] for r in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_desc(self):
        response = self.client.get(BASE_URL, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        names = [r['name'] for r in results]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_created_at_asc(self):
        response = self.client.get(BASE_URL, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [r['created_at'] for r in results]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_desc(self):
        response = self.client.get(BASE_URL, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [r['created_at'] for r in results]
        self.assertEqual(dates, sorted(dates, reverse=True))
