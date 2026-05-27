from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.suppliers.models import Supplier
from apps.products.models import Product


BASE_URL = '/api/v1/products/'


class ProductFilterTest(APITestCase):

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
            name='Supplier A',
            contact_name='Alice',
            email='suppliera@test.com',
            phone='555-0001',
            address='1 Supplier Ave',
        )
        self.supplier_b = Supplier.objects.create(
            name='Supplier B',
            contact_name='Bob',
            email='supplierb@test.com',
            phone='555-0002',
            address='2 Supplier Ave',
        )

        self.product_a1 = Product.objects.create(
            supplier=self.supplier_a,
            name='Laptop Pro',
            sku='LAP-PRO-001',
            description='High-end laptop for professionals',
            weight_kg=Decimal('2.500'),
            length_cm=Decimal('35.00'),
            width_cm=Decimal('25.00'),
            height_cm=Decimal('3.00'),
            unit_price=Decimal('2000.00'),
        )
        self.product_a2 = Product.objects.create(
            supplier=self.supplier_a,
            name='Mouse Wireless',
            sku='MOU-WIR-001',
            description='Ergonomic wireless mouse',
            weight_kg=Decimal('0.200'),
            length_cm=Decimal('12.00'),
            width_cm=Decimal('7.00'),
            height_cm=Decimal('4.00'),
            unit_price=Decimal('45.00'),
        )
        self.product_b1 = Product.objects.create(
            supplier=self.supplier_b,
            name='Keyboard Mechanical',
            sku='KEY-MEC-001',
            description=None,
            weight_kg=Decimal('1.000'),
            length_cm=Decimal('44.00'),
            width_cm=Decimal('15.00'),
            height_cm=Decimal('4.00'),
            unit_price=Decimal('120.00'),
        )

    # --- Happy path (filterset_fields) ---

    def test_filter_by_supplier_returns_only_that_suppliers_products(self):
        response = self.client.get(BASE_URL, {'supplier': self.supplier_a.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        returned_ids = {item['id'] for item in results}
        self.assertIn(self.product_a1.id, returned_ids)
        self.assertIn(self.product_a2.id, returned_ids)
        self.assertNotIn(self.product_b1.id, returned_ids)

    def test_filter_by_supplier_b_returns_only_supplier_b_products(self):
        response = self.client.get(BASE_URL, {'supplier': self.supplier_b.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product_b1.id)

    # --- Happy path (search_fields) ---

    def test_search_by_name_returns_matching_product(self):
        response = self.client.get(BASE_URL, {'search': 'Laptop'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product_a1.id)

    def test_search_by_sku_returns_matching_product(self):
        response = self.client.get(BASE_URL, {'search': 'MOU-WIR'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product_a2.id)

    def test_search_by_description_returns_matching_product(self):
        response = self.client.get(BASE_URL, {'search': 'ergonomic'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product_a2.id)

    def test_search_case_insensitive(self):
        response = self.client.get(BASE_URL, {'search': 'laptop'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product_a1.id)

    # --- Unhappy path ---

    def test_search_no_match_returns_empty_results(self):
        response = self.client.get(BASE_URL, {'search': 'zzznomatch'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 0)

    def test_filter_nonexistent_supplier_returns_400(self):
        # django-filter validates FK choices; a non-existent PK returns 400
        response = self.client.get(BASE_URL, {'supplier': 99999})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Edge cases (ordering_fields) ---

    def test_ordering_by_name_asc(self):
        response = self.client.get(BASE_URL, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        names = [item['name'] for item in results]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_desc(self):
        response = self.client.get(BASE_URL, {'ordering': '-name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        names = [item['name'] for item in results]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_unit_price_asc(self):
        response = self.client.get(BASE_URL, {'ordering': 'unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        prices = [float(item['unit_price']) for item in results]
        self.assertEqual(prices, sorted(prices))

    def test_ordering_by_unit_price_desc(self):
        response = self.client.get(BASE_URL, {'ordering': '-unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        prices = [float(item['unit_price']) for item in results]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_combined_filter_and_search(self):
        response = self.client.get(BASE_URL, {
            'supplier': self.supplier_a.id,
            'search': 'Mouse',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product_a2.id)
