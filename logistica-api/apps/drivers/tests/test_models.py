from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from apps.drivers.models import Driver


class DriverModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='driver1',
            first_name='Juan',
            last_name='Perez',
            password='pass123'
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            phone='3001234567',
            status=Driver.AVAILABLE,
        )

    # --- Happy path ---

    def test_create_driver_with_valid_data(self):
        self.assertEqual(self.driver.license_number, 'LIC-001')
        self.assertEqual(self.driver.phone, '3001234567')
        self.assertEqual(self.driver.status, Driver.AVAILABLE)
        self.assertEqual(self.driver.user, self.user)

    def test_str_returns_full_name_and_license(self):
        expected = f"Juan Perez (LIC-001)"
        self.assertEqual(str(self.driver), expected)

    def test_is_active_default_true(self):
        self.assertTrue(self.driver.is_active)

    def test_status_available_is_valid_choice(self):
        self.driver.status = Driver.AVAILABLE
        self.driver.save()
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.status, 'available')

    def test_status_on_route_is_valid_choice(self):
        self.driver.status = Driver.ON_ROUTE
        self.driver.save()
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.status, 'on_route')

    def test_status_off_duty_is_valid_choice(self):
        self.driver.status = Driver.OFF_DUTY
        self.driver.save()
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.status, 'off_duty')

    def test_created_at_and_updated_at_are_set(self):
        self.assertIsNotNone(self.driver.created_at)
        self.assertIsNotNone(self.driver.updated_at)

    def test_db_table_is_drivers(self):
        self.assertEqual(Driver._meta.db_table, 'drivers')

    # --- Unhappy path ---

    def test_license_number_unique_constraint(self):
        user2 = User.objects.create_user(username='driver2', password='pass123')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user2,
                license_number='LIC-001',  # duplicate
                phone='3009999999',
            )

    def test_user_onetoone_unique_constraint(self):
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user,  # same user — violates OneToOne
                license_number='LIC-999',
                phone='3008888888',
            )

    def test_license_number_required(self):
        user3 = User.objects.create_user(username='driver3', password='pass123')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user3,
                license_number=None,
                phone='3007777777',
            )

    def test_phone_required(self):
        user4 = User.objects.create_user(username='driver4', password='pass123')
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=user4,
                license_number='LIC-004',
                phone=None,
            )

    # --- Edge cases ---

    def test_str_when_user_has_no_full_name(self):
        user_no_name = User.objects.create_user(username='noname', password='pass123')
        driver_no_name = Driver.objects.create(
            user=user_no_name,
            license_number='LIC-NONAME',
            phone='3001111111',
        )
        # get_full_name() returns empty string when first/last name not set
        expected = f" (LIC-NONAME)"
        self.assertEqual(str(driver_no_name), expected)

    def test_default_status_is_available(self):
        user5 = User.objects.create_user(username='driver5', password='pass123')
        driver = Driver.objects.create(
            user=user5,
            license_number='LIC-005',
            phone='3006666666',
        )
        self.assertEqual(driver.status, Driver.AVAILABLE)

    def test_driver_status_choices_constants(self):
        self.assertEqual(Driver.AVAILABLE, 'available')
        self.assertEqual(Driver.ON_ROUTE, 'on_route')
        self.assertEqual(Driver.OFF_DUTY, 'off_duty')
