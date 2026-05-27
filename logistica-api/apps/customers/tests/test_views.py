from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer


BASE_URL = '/api/v1/customers/'


def detail_url(pk):
    return f'{BASE_URL}{pk}/'


class CustomerViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}'
        )
        self.customer = Customer.objects.create(
            name='Test Customer',
            customer_type=Customer.INDIVIDUAL,
            email='test@example.com',
            phone='555-0001',
            address='1 Test Ave',
        )
        self.valid_payload = {
            'name': 'New Customer',
            'customer_type': Customer.COMPANY,
            'email': 'new@example.com',
            'phone': '555-0002',
            'address': '2 New St',
        }

    # ------------------------------------------------------------------ #
    # Happy path
    # ------------------------------------------------------------------ #

    def test_list_returns_200(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'test@example.com')

    def test_create_returns_201(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Customer.objects.filter(email='new@example.com').exists())

    def test_retrieve_returns_200(self):
        response = self.client.get(detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_update_returns_200(self):
        payload = {
            'name': 'Updated Customer',
            'customer_type': Customer.COMPANY,
            'email': 'updated@example.com',
            'phone': '555-9999',
            'address': '99 Updated Blvd',
        }
        response = self.client.put(detail_url(self.customer.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Updated Customer')
        self.assertEqual(self.customer.email, 'updated@example.com')

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            detail_url(self.customer.pk),
            {'phone': '555-8888'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.phone, '555-8888')

    def test_destroy_returns_204(self):
        response = self.client.delete(detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_create_with_user_fk_returns_201(self):
        portal_user = User.objects.create_user(
            username='portaluser', password='pass123'
        )
        payload = {**self.valid_payload, 'user': portal_user.pk}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        customer = Customer.objects.get(email='new@example.com')
        self.assertEqual(customer.user, portal_user)

    def test_create_without_user_fk_returns_201(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        customer = Customer.objects.get(email='new@example.com')
        self.assertIsNone(customer.user)

    # ------------------------------------------------------------------ #
    # Unhappy path
    # ------------------------------------------------------------------ #

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
        response = self.client.get(detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_required_fields_returns_400(self):
        response = self.client.post(BASE_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_name_returns_400(self):
        payload = {**self.valid_payload}
        del payload['name']
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_email_returns_400(self):
        payload = {**self.valid_payload}
        del payload['email']
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_invalid_email_returns_400(self):
        payload = {**self.valid_payload, 'email': 'not-an-email'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_duplicate_email_returns_400(self):
        payload = {**self.valid_payload, 'email': 'test@example.com'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_invalid_customer_type_returns_400(self):
        payload = {**self.valid_payload, 'customer_type': 'unknown'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        response = self.client.put(detail_url(99999), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------ #
    # Edge cases
    # ------------------------------------------------------------------ #

    def test_destroy_soft_deletes(self):
        response = self.client.delete(detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

    def test_destroy_removes_from_list(self):
        self.client.delete(detail_url(self.customer.pk))
        list_response = self.client.get(BASE_URL)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.customer.pk, ids)

    def test_list_excludes_inactive_customers(self):
        inactive = Customer.objects.create(
            name='Inactive Customer',
            customer_type=Customer.INDIVIDUAL,
            email='inactive@example.com',
            phone='555-0000',
            address='0 Dead End',
            is_active=False,
        )
        response = self.client.get(BASE_URL)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive.pk, ids)

    def test_soft_deleted_customer_returns_404_on_retrieve(self):
        self.client.delete(detail_url(self.customer.pk))
        response = self.client.get(detail_url(self.customer.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_pagination_structure(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_create_with_company_name(self):
        payload = {**self.valid_payload, 'company_name': 'New Holdings LLC'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        customer = Customer.objects.get(email='new@example.com')
        self.assertEqual(customer.company_name, 'New Holdings LLC')

    def test_response_does_not_include_is_active(self):
        response = self.client.get(detail_url(self.customer.pk))
        self.assertNotIn('is_active', response.data)

    def test_read_only_fields_ignored_on_create(self):
        payload = {
            **self.valid_payload,
            'created_at': '2000-01-01T00:00:00Z',
            'updated_at': '2000-01-01T00:00:00Z',
        }
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        customer = Customer.objects.get(email='new@example.com')
        self.assertNotEqual(str(customer.created_at), '2000-01-01 00:00:00+00:00')
