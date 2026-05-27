from django.test import TestCase
from django.db import IntegrityError
from apps.suppliers.models import Supplier


class SupplierModelTest(TestCase):

    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Tech Parts SA',
            contact_name='Juan Perez',
            email='contact@techparts.com',
            phone='1234567890',
            address='Av. Industrial 100, Bogota',
        )

    # --- Happy path ---

    def test_create_supplier_with_valid_data(self):
        """Crear un proveedor con datos validos guarda el objeto correctamente."""
        supplier = Supplier.objects.get(pk=self.supplier.pk)
        self.assertEqual(supplier.name, 'Tech Parts SA')
        self.assertEqual(supplier.contact_name, 'Juan Perez')
        self.assertEqual(supplier.email, 'contact@techparts.com')
        self.assertEqual(supplier.phone, '1234567890')
        self.assertEqual(supplier.address, 'Av. Industrial 100, Bogota')

    def test_str_returns_name(self):
        """__str__ retorna el nombre del proveedor."""
        self.assertEqual(str(self.supplier), 'Tech Parts SA')

    def test_is_active_defaults_to_true(self):
        """is_active es True por defecto al crear un proveedor."""
        self.assertTrue(self.supplier.is_active)

    def test_created_at_is_set_automatically(self):
        """created_at se asigna automaticamente al crear."""
        self.assertIsNotNone(self.supplier.created_at)

    def test_updated_at_is_set_automatically(self):
        """updated_at se asigna automaticamente al crear."""
        self.assertIsNotNone(self.supplier.updated_at)

    def test_db_table_name(self):
        """La tabla en la BD se llama 'suppliers'."""
        self.assertEqual(Supplier._meta.db_table, 'suppliers')

    # --- Unhappy path ---

    def test_duplicate_email_raises_integrity_error(self):
        """Crear dos proveedores con el mismo email lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Otro Proveedor',
                contact_name='Ana Lopez',
                email='contact@techparts.com',
                phone='0987654321',
                address='Calle 5, Medellin',
            )

    def test_name_required(self):
        """El campo name es obligatorio — IntegrityError si es None."""
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name=None,
                contact_name='Ana Lopez',
                email='nuevo@proveedor.com',
                phone='0987654321',
                address='Calle 5, Medellin',
            )

    def test_email_required(self):
        """El campo email es obligatorio — IntegrityError si es None."""
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Sin Email SA',
                contact_name='Carlos',
                email=None,
                phone='111222333',
                address='Carrera 10, Cali',
            )

    # --- Edge cases ---

    def test_is_active_can_be_set_to_false(self):
        """is_active puede establecerse en False (soft delete)."""
        self.supplier.is_active = False
        self.supplier.save()
        self.supplier.refresh_from_db()
        self.assertFalse(self.supplier.is_active)

    def test_ordering_by_name(self):
        """Los proveedores se ordenan por nombre por defecto."""
        Supplier.objects.create(
            name='Abastecedora Norte',
            contact_name='Pedro',
            email='norte@abast.com',
            phone='555000111',
            address='Zona Norte 1',
        )
        Supplier.objects.create(
            name='Zona Sur Ltda',
            contact_name='Maria',
            email='sur@zona.com',
            phone='555000222',
            address='Zona Sur 1',
        )
        suppliers = list(Supplier.objects.all())
        names = [s.name for s in suppliers]
        self.assertEqual(names, sorted(names))

    def test_multiple_suppliers_can_have_same_name(self):
        """El campo name no es unique — se permiten nombres duplicados."""
        duplicate = Supplier.objects.create(
            name='Tech Parts SA',
            contact_name='Luis',
            email='otro@techparts.com',
            phone='999888777',
            address='Carrera 20, Barranquilla',
        )
        self.assertEqual(duplicate.name, 'Tech Parts SA')
