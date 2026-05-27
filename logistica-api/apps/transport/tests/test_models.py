from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from apps.drivers.models import Driver
from apps.transport.models import Transport


class TransportModelTest(TestCase):

    def setUp(self):
        driver_user = User.objects.create_user(
            username='driver1',
            password='pass123',
            first_name='John',
            last_name='Doe',
        )
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            phone='555-0010',
            status='available',
        )

    # --- Happy path ---

    def test_create_transport_with_valid_data(self):
        transport = Transport.objects.create(
            driver=self.driver,
            plate_number='ABC-001',
            vehicle_type='truck',
            capacity_kg='5000.00',
            status='available',
        )
        self.assertIsNotNone(transport.id)
        self.assertEqual(transport.plate_number, 'ABC-001')
        self.assertEqual(transport.vehicle_type, 'truck')
        self.assertEqual(float(transport.capacity_kg), 5000.00)
        self.assertEqual(transport.status, 'available')
        self.assertEqual(transport.driver, self.driver)

    def test_str_returns_expected_value(self):
        transport = Transport.objects.create(
            plate_number='XYZ-999',
            vehicle_type='van',
            capacity_kg='1500.00',
        )
        self.assertEqual(str(transport), 'XYZ-999 (van)')

    def test_is_active_defaults_to_true(self):
        transport = Transport.objects.create(
            plate_number='DEF-002',
            vehicle_type='motorcycle',
            capacity_kg='200.00',
        )
        self.assertTrue(transport.is_active)

    def test_status_defaults_to_available(self):
        transport = Transport.objects.create(
            plate_number='GHI-003',
            vehicle_type='van',
            capacity_kg='2000.00',
        )
        self.assertEqual(transport.status, 'available')

    def test_vehicle_type_truck_is_valid(self):
        transport = Transport.objects.create(
            plate_number='TRK-010',
            vehicle_type='truck',
            capacity_kg='10000.00',
        )
        self.assertEqual(transport.vehicle_type, 'truck')

    def test_vehicle_type_van_is_valid(self):
        transport = Transport.objects.create(
            plate_number='VAN-020',
            vehicle_type='van',
            capacity_kg='3000.00',
        )
        self.assertEqual(transport.vehicle_type, 'van')

    def test_vehicle_type_motorcycle_is_valid(self):
        transport = Transport.objects.create(
            plate_number='MOT-030',
            vehicle_type='motorcycle',
            capacity_kg='100.00',
        )
        self.assertEqual(transport.vehicle_type, 'motorcycle')

    def test_status_in_use_is_valid(self):
        transport = Transport.objects.create(
            plate_number='INU-040',
            vehicle_type='truck',
            capacity_kg='5000.00',
            status='in_use',
        )
        self.assertEqual(transport.status, 'in_use')

    def test_status_maintenance_is_valid(self):
        transport = Transport.objects.create(
            plate_number='MNT-050',
            vehicle_type='van',
            capacity_kg='2000.00',
            status='maintenance',
        )
        self.assertEqual(transport.status, 'maintenance')

    def test_driver_nullable_accepts_none(self):
        transport = Transport.objects.create(
            driver=None,
            plate_number='NDA-060',
            vehicle_type='van',
            capacity_kg='2500.00',
        )
        self.assertIsNone(transport.driver)

    def test_created_at_and_updated_at_auto_set(self):
        transport = Transport.objects.create(
            plate_number='AUT-070',
            vehicle_type='truck',
            capacity_kg='8000.00',
        )
        self.assertIsNotNone(transport.created_at)
        self.assertIsNotNone(transport.updated_at)

    # --- Unhappy path ---

    def test_duplicate_plate_number_raises_integrity_error(self):
        Transport.objects.create(
            plate_number='DUP-001',
            vehicle_type='truck',
            capacity_kg='5000.00',
        )
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                plate_number='DUP-001',
                vehicle_type='van',
                capacity_kg='1500.00',
            )

    def test_plate_number_required(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                plate_number=None,
                vehicle_type='truck',
                capacity_kg='5000.00',
            )

    def test_vehicle_type_required(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                plate_number='REQ-001',
                vehicle_type=None,
                capacity_kg='5000.00',
            )

    def test_capacity_kg_required(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                plate_number='REQ-002',
                vehicle_type='truck',
                capacity_kg=None,
            )

    # --- Edge cases ---

    def test_driver_set_to_null_when_driver_deleted(self):
        transport = Transport.objects.create(
            driver=self.driver,
            plate_number='SDN-001',
            vehicle_type='van',
            capacity_kg='2000.00',
        )
        self.driver.delete()
        transport.refresh_from_db()
        self.assertIsNone(transport.driver)

    def test_ordering_by_plate_number(self):
        Transport.objects.create(plate_number='ZZZ-999', vehicle_type='van', capacity_kg='1000.00')
        Transport.objects.create(plate_number='AAA-001', vehicle_type='truck', capacity_kg='5000.00')
        transports = list(Transport.objects.all())
        self.assertEqual(transports[0].plate_number, 'AAA-001')
        self.assertEqual(transports[1].plate_number, 'ZZZ-999')

    def test_db_table_name(self):
        self.assertEqual(Transport._meta.db_table, 'transports')
