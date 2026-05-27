from django.test import TestCase
from django.db import IntegrityError

from apps.warehouses.models import Warehouse


class WarehouseModelTest(TestCase):

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------
    def _make_warehouse(self, **kwargs):
        defaults = {
            'name': 'Almacen Central',
            'address': 'Calle 1 # 2-3',
            'city': 'Bogota',
            'country': 'Colombia',
            'capacity_kg': '5000.00',
        }
        defaults.update(kwargs)
        return Warehouse.objects.create(**defaults)

    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------
    def test_create_with_valid_data(self):
        """Crear un warehouse con datos validos debe persistir todos los campos."""
        wh = self._make_warehouse()
        self.assertIsNotNone(wh.pk)
        self.assertEqual(wh.name, 'Almacen Central')
        self.assertEqual(wh.address, 'Calle 1 # 2-3')
        self.assertEqual(wh.city, 'Bogota')
        self.assertEqual(wh.country, 'Colombia')
        self.assertEqual(float(wh.capacity_kg), 5000.00)

    def test_str_returns_name(self):
        """__str__ debe retornar el nombre del almacen."""
        wh = self._make_warehouse(name='Deposito Norte')
        self.assertEqual(str(wh), 'Deposito Norte')

    def test_is_active_defaults_to_true(self):
        """is_active debe ser True por defecto al crear."""
        wh = self._make_warehouse()
        self.assertTrue(wh.is_active)

    def test_created_at_and_updated_at_auto_populated(self):
        """created_at y updated_at se rellenan automaticamente."""
        wh = self._make_warehouse()
        self.assertIsNotNone(wh.created_at)
        self.assertIsNotNone(wh.updated_at)

    def test_create_multiple_warehouses_with_same_city(self):
        """No hay restriccion unique sobre city; dos almacenes en la misma ciudad son validos."""
        wh1 = self._make_warehouse(name='Almacen A', city='Medellin')
        wh2 = self._make_warehouse(name='Almacen B', city='Medellin')
        self.assertEqual(wh1.city, wh2.city)

    def test_ordering_is_by_name(self):
        """El queryset por defecto debe ordenar por nombre ascendente."""
        self._make_warehouse(name='Zeta')
        self._make_warehouse(name='Alpha')
        self._make_warehouse(name='Medio')
        names = list(Warehouse.objects.values_list('name', flat=True))
        self.assertEqual(names, ['Alpha', 'Medio', 'Zeta'])

    def test_db_table_name(self):
        """La tabla debe llamarse 'warehouses' segun el schema."""
        self.assertEqual(Warehouse._meta.db_table, 'warehouses')

    def test_capacity_kg_stores_decimal(self):
        """capacity_kg acepta valores decimales con dos decimales."""
        wh = self._make_warehouse(capacity_kg='1234.56')
        wh.refresh_from_db()
        self.assertEqual(float(wh.capacity_kg), 1234.56)

    def test_is_active_can_be_set_to_false(self):
        """is_active puede almacenarse como False (soft delete)."""
        wh = self._make_warehouse(is_active=False)
        self.assertFalse(wh.is_active)

    # ------------------------------------------------------------------
    # Unhappy path
    # ------------------------------------------------------------------
    def test_create_without_name_stores_empty_string(self):
        """CharField en SQLite no impone NOT NULL a nivel DB para strings.
        El campo acepta cadena vacia; la restriccion blank=False opera en serializers."""
        wh = Warehouse.objects.create(
            address='Dir',
            city='Ciudad',
            country='Pais',
            capacity_kg='100.00',
        )
        # name queda como '' (valor por defecto de CharField al omitir)
        self.assertEqual(wh.name, '')

    def test_create_without_city_stores_empty_string(self):
        """CharField en SQLite acepta cadena vacia cuando se omite el campo."""
        wh = Warehouse.objects.create(
            name='Sin ciudad',
            address='Dir',
            country='Pais',
            capacity_kg='100.00',
        )
        self.assertEqual(wh.city, '')

    def test_create_without_country_stores_empty_string(self):
        """CharField en SQLite acepta cadena vacia cuando se omite el campo."""
        wh = Warehouse.objects.create(
            name='Sin pais',
            address='Dir',
            city='Ciudad',
            capacity_kg='100.00',
        )
        self.assertEqual(wh.country, '')

    def test_create_without_capacity_kg_raises_integrity_error(self):
        """Omitir capacity_kg (DecimalField) debe fallar al guardar en DB."""
        with self.assertRaises(IntegrityError):
            Warehouse.objects.create(
                name='Sin capacidad',
                address='Dir',
                city='Ciudad',
                country='Pais',
            )
