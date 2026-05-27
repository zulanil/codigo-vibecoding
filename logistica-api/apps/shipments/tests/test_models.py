from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.products.models import Product
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentProduct


class ShipmentModelTest(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Main WH',
            address='1 WH Rd',
            city='Bogota',
            country='Colombia',
            capacity_kg='10000.00',
        )
        self.customer = Customer.objects.create(
            name='Test Customer',
            customer_type='individual',
            email='customer@test.com',
            phone='555-0001',
            address='1 Customer St',
        )
        driver_user = User.objects.create_user(username='driver1', password='pass123')
        self.driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-001',
            phone='555-0010',
            status='available',
        )
        self.transport = Transport.objects.create(
            driver=self.driver,
            plate_number='ABC-001',
            vehicle_type='truck',
            capacity_kg='5000.00',
            status='available',
        )
        self.route = Route.objects.create(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Route 1',
            status='planned',
            scheduled_date='2026-06-01',
        )

    def _make_shipment(self, **kwargs):
        defaults = dict(
            tracking_number='TRK-0001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            status='pending',
            origin_address='Origin St 1',
            destination_address='Dest St 2',
            scheduled_delivery_date='2026-07-01',
            weight_kg='5.000',
            declared_value='1500.00',
            shipping_cost='50.00',
        )
        defaults.update(kwargs)
        return Shipment.objects.create(**defaults)

    # --- Happy path ---

    def test_create_shipment_with_valid_data(self):
        shipment = self._make_shipment()
        self.assertIsNotNone(shipment.pk)
        self.assertEqual(shipment.tracking_number, 'TRK-0001')
        self.assertEqual(shipment.customer, self.customer)
        self.assertEqual(shipment.origin_warehouse, self.warehouse)

    def test_str_returns_tracking_number(self):
        shipment = self._make_shipment()
        self.assertEqual(str(shipment), 'TRK-0001')

    def test_is_active_default_true(self):
        shipment = self._make_shipment()
        self.assertTrue(shipment.is_active)

    def test_status_default_pending(self):
        shipment = self._make_shipment()
        self.assertEqual(shipment.status, Shipment.PENDING)

    def test_create_with_route(self):
        shipment = self._make_shipment(route=self.route)
        self.assertEqual(shipment.route, self.route)

    def test_status_choices_assigned(self):
        shipment = self._make_shipment(status=Shipment.ASSIGNED)
        self.assertEqual(shipment.status, 'assigned')

    def test_status_choices_in_transit(self):
        shipment = self._make_shipment(status=Shipment.IN_TRANSIT)
        self.assertEqual(shipment.status, 'in_transit')

    def test_status_choices_delivered(self):
        shipment = self._make_shipment(status=Shipment.DELIVERED)
        self.assertEqual(shipment.status, 'delivered')

    def test_status_choices_cancelled(self):
        shipment = self._make_shipment(status=Shipment.CANCELLED)
        self.assertEqual(shipment.status, 'cancelled')

    def test_actual_delivery_date_nullable(self):
        shipment = self._make_shipment()
        self.assertIsNone(shipment.actual_delivery_date)

    def test_notes_nullable(self):
        shipment = self._make_shipment()
        self.assertIsNone(shipment.notes)

    def test_route_nullable(self):
        shipment = self._make_shipment(route=None)
        self.assertIsNone(shipment.route)

    def test_created_at_auto_set(self):
        shipment = self._make_shipment()
        self.assertIsNotNone(shipment.created_at)

    def test_updated_at_auto_set(self):
        shipment = self._make_shipment()
        self.assertIsNotNone(shipment.updated_at)

    # --- Unhappy path ---

    def test_tracking_number_unique_raises_integrity_error(self):
        self._make_shipment(tracking_number='TRK-DUP')
        with self.assertRaises(IntegrityError):
            self._make_shipment(tracking_number='TRK-DUP')

    def test_create_without_customer_raises_error(self):
        with self.assertRaises(Exception):
            Shipment.objects.create(
                tracking_number='TRK-NOCUST',
                origin_warehouse=self.warehouse,
                origin_address='Origin',
                destination_address='Dest',
                scheduled_delivery_date='2026-07-01',
                weight_kg='1.000',
                declared_value='100.00',
                shipping_cost='10.00',
            )

    def test_create_without_warehouse_raises_error(self):
        with self.assertRaises(Exception):
            Shipment.objects.create(
                tracking_number='TRK-NOWH',
                customer=self.customer,
                origin_address='Origin',
                destination_address='Dest',
                scheduled_delivery_date='2026-07-01',
                weight_kg='1.000',
                declared_value='100.00',
                shipping_cost='10.00',
            )


class ShipmentProductModelTest(TestCase):

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='WH One',
            address='2 WH Rd',
            city='Medellin',
            country='Colombia',
            capacity_kg='5000.00',
        )
        self.customer = Customer.objects.create(
            name='Customer B',
            customer_type='company',
            email='customerb@test.com',
            phone='555-0002',
            address='2 Customer Ave',
        )
        self.supplier = Supplier.objects.create(
            name='Supplier A',
            contact_name='John',
            email='suppliera@test.com',
            phone='555-0003',
            address='3 Supplier Blvd',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            name='Laptop',
            sku='LAP-001',
            weight_kg='2.500',
            length_cm='35.00',
            width_cm='25.00',
            height_cm='3.00',
            unit_price='1200.00',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-SP-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            origin_address='Origin',
            destination_address='Dest',
            scheduled_delivery_date='2026-07-15',
            weight_kg='3.000',
            declared_value='1200.00',
            shipping_cost='30.00',
        )

    # --- Happy path ---

    def test_create_shipment_product_with_valid_data(self):
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price='1200.00',
        )
        self.assertIsNotNone(sp.pk)
        self.assertEqual(sp.quantity, 2)
        self.assertEqual(sp.shipment, self.shipment)
        self.assertEqual(sp.product, self.product)

    def test_str_returns_tracking_product_quantity(self):
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
            unit_price='1200.00',
        )
        expected = f"{self.shipment.tracking_number} — {self.product.name} x3"
        self.assertEqual(str(sp), expected)

    def test_multiple_products_in_same_shipment(self):
        product2 = Product.objects.create(
            supplier=self.supplier,
            name='Monitor',
            sku='MON-001',
            weight_kg='5.000',
            length_cm='60.00',
            width_cm='40.00',
            height_cm='10.00',
            unit_price='400.00',
        )
        sp1 = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price='1200.00',
        )
        sp2 = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=product2,
            quantity=2,
            unit_price='400.00',
        )
        self.assertEqual(self.shipment.shipment_products.count(), 2)
        self.assertIsNotNone(sp1.pk)
        self.assertIsNotNone(sp2.pk)

    # --- Unhappy path ---

    def test_unique_together_same_shipment_product_raises_integrity_error(self):
        ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price='1200.00',
        )
        with self.assertRaises(IntegrityError):
            ShipmentProduct.objects.create(
                shipment=self.shipment,
                product=self.product,
                quantity=2,
                unit_price='1200.00',
            )

    def test_cascade_delete_when_shipment_deleted(self):
        sp = ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=1,
            unit_price='1200.00',
        )
        sp_id = sp.pk
        self.shipment.delete()
        self.assertFalse(ShipmentProduct.objects.filter(pk=sp_id).exists())
