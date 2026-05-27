from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.suppliers.models import Supplier
from apps.products.models import Product


BASE_URL = '/api/v1/products/'


def detail_url(pk):
    return f'{BASE_URL}{pk}/'


class ProductViewSetTest(APITestCase):

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
            name='Test Supplier',
            contact_name='Contact Person',
            email='supplier@test.com',
            phone='555-0001',
            address='1 Supplier St',
        )

        self.product = Product.objects.create(
            supplier=self.supplier,
            name='Laptop X1',
            sku='LAP-001',
            weight_kg=Decimal('2.500'),
            length_cm=Decimal('35.00'),
            width_cm=Decimal('25.00'),
            height_cm=Decimal('3.00'),
            unit_price=Decimal('1200.00'),
        )

        self.valid_payload = {
            'supplier': self.supplier.id,
            'name': 'Tablet Y2',
            'sku': 'TAB-001',
            'weight_kg': '0.800',
            'length_cm': '25.00',
            'width_cm': '17.00',
            'height_cm': '0.80',
            'unit_price': '350.00',
        }

    # --- Happy path ---

    def test_list_returns_200(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.product.id)

    def test_create_returns_201(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.filter(is_active=True).count(), 2)
        self.assertEqual(response.data['sku'], 'TAB-001')

    def test_retrieve_returns_200(self):
        response = self.client.get(detail_url(self.product.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.product.id)
        self.assertEqual(response.data['name'], 'Laptop X1')
        self.assertEqual(response.data['sku'], 'LAP-001')

    def test_update_returns_200(self):
        payload = {
            'supplier': self.supplier.id,
            'name': 'Laptop X1 Pro',
            'sku': 'LAP-001',
            'weight_kg': '2.800',
            'length_cm': '35.00',
            'width_cm': '25.00',
            'height_cm': '3.00',
            'unit_price': '1400.00',
        }
        response = self.client.put(detail_url(self.product.id), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Laptop X1 Pro')
        self.assertEqual(self.product.unit_price, Decimal('1400.00'))

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            detail_url(self.product.id),
            {'unit_price': '1500.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.unit_price, Decimal('1500.00'))
        self.assertEqual(self.product.name, 'Laptop X1')

    def test_destroy_returns_204(self):
        response = self.client.delete(detail_url(self.product.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # --- Unhappy path ---

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(detail_url(self.product.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_required_field_returns_400(self):
        payload = {
            'supplier': self.supplier.id,
            'name': 'No SKU Product',
            # 'sku' missing
            'weight_kg': '1.000',
            'length_cm': '10.00',
            'width_cm': '10.00',
            'height_cm': '10.00',
            'unit_price': '100.00',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_create_missing_supplier_returns_400(self):
        payload = {
            'name': 'No Supplier',
            'sku': 'NOS-001',
            'weight_kg': '1.000',
            'length_cm': '10.00',
            'width_cm': '10.00',
            'height_cm': '10.00',
            'unit_price': '100.00',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('supplier', response.data)

    def test_create_duplicate_sku_returns_400(self):
        payload = {
            'supplier': self.supplier.id,
            'name': 'Another Laptop',
            'sku': 'LAP-001',  # already used by self.product
            'weight_kg': '2.000',
            'length_cm': '30.00',
            'width_cm': '22.00',
            'height_cm': '3.00',
            'unit_price': '950.00',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        payload = {
            'supplier': self.supplier.id,
            'name': 'Ghost Product',
            'sku': 'GHO-001',
            'weight_kg': '1.000',
            'length_cm': '10.00',
            'width_cm': '10.00',
            'height_cm': '10.00',
            'unit_price': '100.00',
        }
        response = self.client.put(detail_url(99999), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_invalid_weight_type_returns_400(self):
        payload = dict(self.valid_payload)
        payload['weight_kg'] = 'not-a-number'
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('weight_kg', response.data)

    # --- Edge cases ---

    def test_destroy_soft_deletes(self):
        response = self.client.delete(detail_url(self.product.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)
        # Verify product no longer appears in list
        list_response = self.client.get(BASE_URL)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.product.id, ids)

    def test_list_excludes_inactive_products(self):
        inactive = Product.objects.create(
            supplier=self.supplier,
            name='Inactive Product',
            sku='INA-001',
            weight_kg=Decimal('1.000'),
            length_cm=Decimal('10.00'),
            width_cm=Decimal('10.00'),
            height_cm=Decimal('10.00'),
            unit_price=Decimal('100.00'),
            is_active=False,
        )
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive.id, ids)
        self.assertIn(self.product.id, ids)

    def test_retrieve_inactive_product_returns_404(self):
        self.product.is_active = False
        self.product.save()
        response = self.client.get(detail_url(self.product.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_description_optional_on_create(self):
        payload = dict(self.valid_payload)
        payload['sku'] = 'NO-DESC-001'
        # No 'description' key in payload
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_with_description(self):
        payload = dict(self.valid_payload)
        payload['description'] = 'A detailed description of the product'
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['description'], 'A detailed description of the product')

    def test_list_pagination_structure(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_read_only_fields_ignored_on_create(self):
        payload = dict(self.valid_payload)
        payload['created_at'] = '2000-01-01T00:00:00Z'
        payload['updated_at'] = '2000-01-01T00:00:00Z'
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # created_at should be set by the server, not the payload value
        self.assertNotEqual(response.data['created_at'], '2000-01-01T00:00:00Z')
