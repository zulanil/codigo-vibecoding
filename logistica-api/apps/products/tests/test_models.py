from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.suppliers.models import Supplier
from apps.products.models import Product


class ProductModelTest(TestCase):

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Test Supplier',
            contact_name='Contact Person',
            email='supplier@test.com',
            phone='555-0001',
            address='1 Supplier St',
        )

    # --- Happy path ---

    def test_create_product_with_valid_data(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Laptop X1',
            sku='LAP-001',
            weight_kg=Decimal('2.500'),
            length_cm=Decimal('35.00'),
            width_cm=Decimal('25.00'),
            height_cm=Decimal('3.00'),
            unit_price=Decimal('1200.00'),
        )
        self.assertIsNotNone(product.id)
        self.assertEqual(product.name, 'Laptop X1')
        self.assertEqual(product.sku, 'LAP-001')
        self.assertEqual(product.supplier, self.supplier)
        self.assertEqual(product.weight_kg, Decimal('2.500'))
        self.assertEqual(product.unit_price, Decimal('1200.00'))

    def test_str_returns_name_and_sku(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Laptop X1',
            sku='LAP-001',
            weight_kg=Decimal('2.500'),
            length_cm=Decimal('35.00'),
            width_cm=Decimal('25.00'),
            height_cm=Decimal('3.00'),
            unit_price=Decimal('1200.00'),
        )
        self.assertEqual(str(product), 'Laptop X1 (LAP-001)')

    def test_is_active_true_by_default(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Tablet Y2',
            sku='TAB-001',
            weight_kg=Decimal('0.800'),
            length_cm=Decimal('25.00'),
            width_cm=Decimal('17.00'),
            height_cm=Decimal('0.80'),
            unit_price=Decimal('350.00'),
        )
        self.assertTrue(product.is_active)

    def test_description_nullable(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Monitor Z3',
            sku='MON-001',
            description=None,
            weight_kg=Decimal('4.000'),
            length_cm=Decimal('55.00'),
            width_cm=Decimal('40.00'),
            height_cm=Decimal('15.00'),
            unit_price=Decimal('500.00'),
        )
        self.assertIsNone(product.description)

    def test_description_accepts_text(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Monitor Z3',
            sku='MON-002',
            description='27-inch 4K display with HDR support',
            weight_kg=Decimal('4.000'),
            length_cm=Decimal('55.00'),
            width_cm=Decimal('40.00'),
            height_cm=Decimal('15.00'),
            unit_price=Decimal('500.00'),
        )
        self.assertEqual(product.description, '27-inch 4K display with HDR support')

    def test_created_at_auto_set(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Keyboard K1',
            sku='KEY-001',
            weight_kg=Decimal('0.500'),
            length_cm=Decimal('44.00'),
            width_cm=Decimal('15.00'),
            height_cm=Decimal('3.00'),
            unit_price=Decimal('80.00'),
        )
        self.assertIsNotNone(product.created_at)
        self.assertIsNotNone(product.updated_at)

    # --- Unhappy path ---

    def test_sku_unique_raises_integrity_error(self):
        Product.objects.create(
            supplier=self.supplier,
            name='Laptop A',
            sku='UNIQUE-SKU',
            weight_kg=Decimal('2.000'),
            length_cm=Decimal('30.00'),
            width_cm=Decimal('20.00'),
            height_cm=Decimal('2.00'),
            unit_price=Decimal('900.00'),
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier=self.supplier,
                name='Laptop B',
                sku='UNIQUE-SKU',
                weight_kg=Decimal('2.000'),
                length_cm=Decimal('30.00'),
                width_cm=Decimal('20.00'),
                height_cm=Decimal('2.00'),
                unit_price=Decimal('900.00'),
            )

    def test_supplier_required_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier_id=None,
                name='Orphan Product',
                sku='ORP-001',
                weight_kg=Decimal('1.000'),
                length_cm=Decimal('10.00'),
                width_cm=Decimal('10.00'),
                height_cm=Decimal('10.00'),
                unit_price=Decimal('100.00'),
            )

    # --- Edge cases ---

    def test_ordering_by_name(self):
        Product.objects.create(
            supplier=self.supplier,
            name='Zebra Keyboard',
            sku='ZEB-001',
            weight_kg=Decimal('0.500'),
            length_cm=Decimal('44.00'),
            width_cm=Decimal('15.00'),
            height_cm=Decimal('3.00'),
            unit_price=Decimal('50.00'),
        )
        Product.objects.create(
            supplier=self.supplier,
            name='Alpha Mouse',
            sku='ALP-001',
            weight_kg=Decimal('0.200'),
            length_cm=Decimal('12.00'),
            width_cm=Decimal('7.00'),
            height_cm=Decimal('4.00'),
            unit_price=Decimal('30.00'),
        )
        products = list(Product.objects.all())
        self.assertEqual(products[0].name, 'Alpha Mouse')
        self.assertEqual(products[1].name, 'Zebra Keyboard')

    def test_decimal_precision_weight(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='Precision Scale Item',
            sku='PSI-001',
            weight_kg=Decimal('1.234'),
            length_cm=Decimal('10.00'),
            width_cm=Decimal('10.00'),
            height_cm=Decimal('10.00'),
            unit_price=Decimal('99.99'),
        )
        product.refresh_from_db()
        self.assertEqual(product.weight_kg, Decimal('1.234'))

    def test_soft_delete_sets_is_active_false(self):
        product = Product.objects.create(
            supplier=self.supplier,
            name='To Be Deleted',
            sku='DEL-001',
            weight_kg=Decimal('1.000'),
            length_cm=Decimal('10.00'),
            width_cm=Decimal('10.00'),
            height_cm=Decimal('10.00'),
            unit_price=Decimal('100.00'),
        )
        product.is_active = False
        product.save()
        product.refresh_from_db()
        self.assertFalse(product.is_active)
