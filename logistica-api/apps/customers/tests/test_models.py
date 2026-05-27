from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from apps.customers.models import Customer


class CustomerModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='portaluser',
            password='testpass123',
            email='portal@example.com'
        )
        self.valid_data = {
            'name': 'Acme Corp',
            'customer_type': Customer.COMPANY,
            'email': 'acme@example.com',
            'phone': '555-1234',
            'address': '123 Main St',
        }

    # ------------------------------------------------------------------ #
    # Happy path
    # ------------------------------------------------------------------ #

    def test_create_with_valid_data(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.pk)
        self.assertEqual(customer.name, 'Acme Corp')
        self.assertEqual(customer.customer_type, Customer.COMPANY)
        self.assertEqual(customer.email, 'acme@example.com')
        self.assertEqual(customer.phone, '555-1234')
        self.assertEqual(customer.address, '123 Main St')

    def test_str_returns_name(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertEqual(str(customer), 'Acme Corp')

    def test_is_active_defaults_to_true(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertTrue(customer.is_active)

    def test_create_individual_customer_type(self):
        data = {**self.valid_data, 'customer_type': Customer.INDIVIDUAL, 'email': 'ind@example.com'}
        customer = Customer.objects.create(**data)
        self.assertEqual(customer.customer_type, Customer.INDIVIDUAL)

    def test_company_name_nullable(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNone(customer.company_name)

    def test_company_name_stored_when_provided(self):
        data = {**self.valid_data, 'company_name': 'Acme Holdings'}
        customer = Customer.objects.create(**data)
        self.assertEqual(customer.company_name, 'Acme Holdings')

    def test_user_fk_nullable(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNone(customer.user)

    def test_create_with_user_assigned(self):
        data = {**self.valid_data, 'user': self.user}
        customer = Customer.objects.create(**data)
        self.assertEqual(customer.user, self.user)

    def test_created_at_set_automatically(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.created_at)

    def test_updated_at_set_automatically(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.updated_at)

    def test_meta_ordering_by_name(self):
        Customer.objects.create(name='Zeta Ltd', customer_type=Customer.COMPANY, email='z@example.com', phone='1', address='A')
        Customer.objects.create(name='Alpha Inc', customer_type=Customer.INDIVIDUAL, email='a@example.com', phone='2', address='B')
        names = list(Customer.objects.values_list('name', flat=True))
        self.assertEqual(names, sorted(names))

    # ------------------------------------------------------------------ #
    # Unhappy path
    # ------------------------------------------------------------------ #

    def test_duplicate_email_raises_integrity_error(self):
        Customer.objects.create(**self.valid_data)
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Other Corp',
                customer_type=Customer.COMPANY,
                email='acme@example.com',  # duplicado
                phone='555-9999',
                address='456 Other St',
            )

    def test_duplicate_user_raises_integrity_error(self):
        Customer.objects.create(**self.valid_data, user=self.user)
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Second Customer',
                customer_type=Customer.INDIVIDUAL,
                email='second@example.com',
                phone='555-0000',
                address='789 Second Ave',
                user=self.user,  # mismo usuario — viola unique
            )
