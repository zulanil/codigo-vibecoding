from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse
from apps.routes.models import Route, RouteStop


class RouteModelTest(TestCase):
    def setUp(self):
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
        self.warehouse = Warehouse.objects.create(
            name='Main Warehouse',
            address='1 Warehouse Rd',
            city='Bogota',
            country='Colombia',
            capacity_kg='10000.00',
        )

    def _make_route(self, **kwargs):
        defaults = dict(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Route Alpha',
            status='planned',
            scheduled_date='2026-06-01',
        )
        defaults.update(kwargs)
        return Route.objects.create(**defaults)

    # --- happy path ---

    def test_create_route_with_valid_data(self):
        route = self._make_route()
        self.assertIsNotNone(route.pk)
        self.assertEqual(route.name, 'Route Alpha')
        self.assertEqual(route.transport, self.transport)
        self.assertEqual(route.origin_warehouse, self.warehouse)

    def test_str_returns_name(self):
        route = self._make_route()
        self.assertEqual(str(route), 'Route Alpha')

    def test_is_active_defaults_to_true(self):
        route = self._make_route()
        self.assertTrue(route.is_active)

    def test_status_defaults_to_planned(self):
        route = Route.objects.create(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Route Beta',
            scheduled_date='2026-06-02',
        )
        self.assertEqual(route.status, 'planned')

    def test_status_valid_choices(self):
        for status_value in ('planned', 'in_progress', 'completed', 'cancelled'):
            route = self._make_route(name=f'Route {status_value}', status=status_value)
            self.assertEqual(route.status, status_value)

    def test_created_at_auto_populated(self):
        route = self._make_route()
        self.assertIsNotNone(route.created_at)

    def test_updated_at_auto_populated(self):
        route = self._make_route()
        self.assertIsNotNone(route.updated_at)

    # --- unhappy path ---

    def test_create_route_without_transport_raises(self):
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                origin_warehouse=self.warehouse,
                name='No Transport',
                scheduled_date='2026-06-01',
                transport_id=None,
            )

    def test_create_route_without_warehouse_raises(self):
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                transport=self.transport,
                name='No Warehouse',
                scheduled_date='2026-06-01',
                origin_warehouse_id=None,
            )


class RouteStopModelTest(TestCase):
    def setUp(self):
        driver_user = User.objects.create_user(username='driver2', password='pass123')
        driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-002',
            phone='555-0020',
            status='available',
        )
        transport = Transport.objects.create(
            driver=driver,
            plate_number='XYZ-999',
            vehicle_type='van',
            capacity_kg='2000.00',
            status='available',
        )
        warehouse = Warehouse.objects.create(
            name='Secondary Warehouse',
            address='2 Depot Ave',
            city='Medellin',
            country='Colombia',
            capacity_kg='5000.00',
        )
        self.route = Route.objects.create(
            transport=transport,
            origin_warehouse=warehouse,
            name='Route Gamma',
            status='planned',
            scheduled_date='2026-07-01',
        )

    def _make_stop(self, stop_order=1, **kwargs):
        defaults = dict(
            route=self.route,
            stop_order=stop_order,
            address='123 Delivery St',
            city='Cali',
            estimated_arrival='2026-07-01T10:00:00Z',
        )
        defaults.update(kwargs)
        return RouteStop.objects.create(**defaults)

    # --- happy path ---

    def test_create_stop_with_valid_data(self):
        stop = self._make_stop()
        self.assertIsNotNone(stop.pk)
        self.assertEqual(stop.stop_order, 1)
        self.assertEqual(stop.city, 'Cali')

    def test_str_returns_expected_string(self):
        stop = self._make_stop(stop_order=1)
        self.assertEqual(str(stop), 'Route Gamma — Stop 1: Cali')

    def test_actual_arrival_nullable(self):
        stop = self._make_stop()
        self.assertIsNone(stop.actual_arrival)

    def test_actual_arrival_can_be_set(self):
        stop = self._make_stop(actual_arrival='2026-07-01T11:30:00Z')
        self.assertIsNotNone(stop.actual_arrival)

    def test_multiple_stops_different_order(self):
        stop1 = self._make_stop(stop_order=1)
        stop2 = self._make_stop(stop_order=2, city='Barranquilla')
        self.assertNotEqual(stop1.pk, stop2.pk)

    # --- unhappy path ---

    def test_duplicate_stop_order_on_same_route_raises(self):
        self._make_stop(stop_order=1)
        with self.assertRaises(IntegrityError):
            self._make_stop(stop_order=1)

    # --- edge cases ---

    def test_same_stop_order_on_different_routes_is_allowed(self):
        driver_user2 = User.objects.create_user(username='driver3', password='pass123')
        driver2 = Driver.objects.create(
            user=driver_user2,
            license_number='LIC-003',
            phone='555-0030',
            status='available',
        )
        transport2 = Transport.objects.create(
            driver=driver2,
            plate_number='DEF-002',
            vehicle_type='truck',
            capacity_kg='3000.00',
            status='available',
        )
        warehouse2 = Warehouse.objects.create(
            name='Third Warehouse',
            address='3 Third St',
            city='Cartagena',
            country='Colombia',
            capacity_kg='8000.00',
        )
        route2 = Route.objects.create(
            transport=transport2,
            origin_warehouse=warehouse2,
            name='Route Delta',
            status='planned',
            scheduled_date='2026-07-05',
        )
        stop_route1 = self._make_stop(stop_order=1)
        stop_route2 = RouteStop.objects.create(
            route=route2,
            stop_order=1,
            address='99 Other St',
            city='Pereira',
            estimated_arrival='2026-07-05T09:00:00Z',
        )
        self.assertEqual(stop_route1.stop_order, stop_route2.stop_order)
        self.assertNotEqual(stop_route1.route, stop_route2.route)
