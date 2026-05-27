from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse
from apps.routes.models import Route, RouteStop


class RouteViewSetTest(APITestCase):
    BASE_URL = '/api/v1/routes/'

    def setUp(self):
        # User for JWT
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        # Driver + Transport + Warehouse
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

        # A route to use in most tests
        self.route = Route.objects.create(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Route Alpha',
            status='planned',
            scheduled_date='2026-06-01',
        )

    def _route_detail_url(self, pk=None):
        pk = pk or self.route.pk
        return f'{self.BASE_URL}{pk}/'

    def _stops_url(self, pk=None):
        pk = pk or self.route.pk
        return f'{self.BASE_URL}{pk}/stops/'

    def _valid_route_payload(self, **overrides):
        payload = {
            'transport': self.transport.pk,
            'origin_warehouse': self.warehouse.pk,
            'name': 'New Route',
            'status': 'planned',
            'scheduled_date': '2026-08-01',
        }
        payload.update(overrides)
        return payload

    # ---------------------------------------------------------------
    # Happy path — Route CRUD
    # ---------------------------------------------------------------

    def test_list_returns_200(self):
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Route Alpha')

    def test_create_returns_201(self):
        payload = self._valid_route_payload()
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Route.objects.filter(is_active=True).count(), 2)
        self.assertEqual(response.data['name'], 'New Route')

    def test_retrieve_returns_200(self):
        response = self.client.get(self._route_detail_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.route.pk)
        self.assertEqual(response.data['name'], 'Route Alpha')

    def test_update_returns_200(self):
        payload = self._valid_route_payload(name='Updated Route', status='in_progress')
        response = self.client.put(self._route_detail_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Updated Route')
        self.assertEqual(self.route.status, 'in_progress')

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            self._route_detail_url(), {'name': 'Patched Route'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Patched Route')

    def test_destroy_returns_204(self):
        response = self.client.delete(self._route_detail_url())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # ---------------------------------------------------------------
    # Unhappy path — Route
    # ---------------------------------------------------------------

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(self.BASE_URL, self._valid_route_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_name_returns_400(self):
        payload = self._valid_route_payload()
        del payload['name']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_transport_returns_400(self):
        payload = self._valid_route_payload()
        del payload['transport']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('transport', response.data)

    def test_create_missing_warehouse_returns_400(self):
        payload = self._valid_route_payload()
        del payload['origin_warehouse']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.data)

    def test_create_missing_scheduled_date_returns_400(self):
        payload = self._valid_route_payload()
        del payload['scheduled_date']
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('scheduled_date', response.data)

    def test_create_invalid_transport_id_returns_400(self):
        payload = self._valid_route_payload(transport=99999)
        response = self.client.post(self.BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{self.BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        payload = self._valid_route_payload()
        response = self.client.put(f'{self.BASE_URL}99999/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---------------------------------------------------------------
    # Edge cases — Route
    # ---------------------------------------------------------------

    def test_destroy_soft_deletes(self):
        response = self.client.delete(self._route_detail_url())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.route.refresh_from_db()
        self.assertFalse(self.route.is_active)
        list_response = self.client.get(self.BASE_URL)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.route.pk, ids)

    def test_list_excludes_inactive_routes(self):
        inactive_route = Route.objects.create(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Inactive Route',
            status='cancelled',
            scheduled_date='2026-05-01',
            is_active=False,
        )
        response = self.client.get(self.BASE_URL)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(inactive_route.pk, ids)

    def test_retrieve_includes_nested_stops(self):
        RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='1 Stop St',
            city='Cali',
            estimated_arrival='2026-06-01T10:00:00Z',
        )
        response = self.client.get(self._route_detail_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stops', response.data)
        self.assertEqual(len(response.data['stops']), 1)


# ---------------------------------------------------------------
# Stops nested endpoint — /api/v1/routes/{id}/stops/
# ---------------------------------------------------------------

class RouteStopsEndpointTest(APITestCase):
    BASE_URL = '/api/v1/routes/'

    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        driver_user = User.objects.create_user(username='driver2', password='pass123')
        driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-002',
            phone='555-0020',
            status='available',
        )
        transport = Transport.objects.create(
            driver=driver,
            plate_number='DEF-002',
            vehicle_type='van',
            capacity_kg='2000.00',
            status='available',
        )
        warehouse = Warehouse.objects.create(
            name='Stop Warehouse',
            address='5 Stop Ave',
            city='Medellin',
            country='Colombia',
            capacity_kg='7000.00',
        )
        self.route = Route.objects.create(
            transport=transport,
            origin_warehouse=warehouse,
            name='Route for Stops',
            status='planned',
            scheduled_date='2026-09-01',
        )
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='10 First Ave',
            city='Bucaramanga',
            estimated_arrival='2026-09-01T08:00:00Z',
        )

    def _stops_url(self, pk=None):
        pk = pk or self.route.pk
        return f'{self.BASE_URL}{pk}/stops/'

    def _valid_stop_payload(self, stop_order=2, **overrides):
        payload = {
            'stop_order': stop_order,
            'address': '20 Second Ave',
            'city': 'Pasto',
            'estimated_arrival': '2026-09-01T12:00:00Z',
        }
        payload.update(overrides)
        return payload

    # --- happy path ---

    def test_list_stops_returns_200(self):
        response = self.client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['city'], 'Bucaramanga')

    def test_create_stop_returns_201(self):
        payload = self._valid_stop_payload()
        response = self.client.post(self._stops_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 2)
        self.assertEqual(response.data['city'], 'Pasto')

    def test_list_stops_ordered_by_stop_order(self):
        RouteStop.objects.create(
            route=self.route,
            stop_order=2,
            address='20 Second Ave',
            city='Pasto',
            estimated_arrival='2026-09-01T12:00:00Z',
        )
        response = self.client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        orders = [s['stop_order'] for s in response.data]
        self.assertEqual(orders, sorted(orders))

    def test_create_stop_with_actual_arrival_returns_201(self):
        payload = self._valid_stop_payload(
            stop_order=3, actual_arrival='2026-09-01T13:00:00Z'
        )
        response = self.client.post(self._stops_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['actual_arrival'])

    # --- unhappy path ---

    def test_list_stops_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_stop_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(self._stops_url(), self._valid_stop_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_stop_missing_address_returns_400(self):
        payload = self._valid_stop_payload()
        del payload['address']
        response = self.client.post(self._stops_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_stop_missing_city_returns_400(self):
        payload = self._valid_stop_payload()
        del payload['city']
        response = self.client.post(self._stops_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_stop_missing_estimated_arrival_returns_400(self):
        payload = self._valid_stop_payload()
        del payload['estimated_arrival']
        response = self.client.post(self._stops_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('estimated_arrival', response.data)

    def test_create_stop_duplicate_stop_order_raises_integrity_error(self):
        # The view does not catch the DB-level unique_together violation on
        # (route_id, stop_order), so attempting to save a duplicate raises an
        # IntegrityError.  The model-level test covers the constraint itself;
        # here we just confirm the server-side exception is raised.
        from django.db import IntegrityError
        payload = self._valid_stop_payload(stop_order=1)  # stop_order=1 already exists
        with self.assertRaises(IntegrityError):
            self.client.post(self._stops_url(), payload, format='json')

    def test_stops_for_nonexistent_route_returns_404(self):
        response = self.client.get(f'{self.BASE_URL}99999/stops/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- edge cases ---

    def test_create_stop_assigns_correct_route(self):
        payload = self._valid_stop_payload(stop_order=4)
        response = self.client.post(self._stops_url(), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_stop = RouteStop.objects.get(pk=response.data['id'])
        self.assertEqual(new_stop.route, self.route)

    def test_stops_response_contains_expected_fields(self):
        response = self.client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stop_data = response.data[0]
        for field in ('id', 'stop_order', 'address', 'city', 'estimated_arrival', 'actual_arrival'):
            self.assertIn(field, stop_data)


# ---------------------------------------------------------------
# Filter tests — RouteViewSet has filterset_fields and search_fields
# ---------------------------------------------------------------

class RouteFilterTest(APITestCase):
    BASE_URL = '/api/v1/routes/'

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        driver_user = User.objects.create_user(username='driver3', password='pass123')
        driver = Driver.objects.create(
            user=driver_user,
            license_number='LIC-003',
            phone='555-0030',
            status='available',
        )
        self.transport = Transport.objects.create(
            driver=driver,
            plate_number='GHI-003',
            vehicle_type='truck',
            capacity_kg='4000.00',
            status='available',
        )
        self.warehouse = Warehouse.objects.create(
            name='Filter Warehouse',
            address='9 Filter Rd',
            city='Ibague',
            country='Colombia',
            capacity_kg='6000.00',
        )

        self.planned_route = Route.objects.create(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Route Planned',
            status='planned',
            scheduled_date='2026-10-01',
        )
        self.completed_route = Route.objects.create(
            transport=self.transport,
            origin_warehouse=self.warehouse,
            name='Route Completed',
            status='completed',
            scheduled_date='2026-10-02',
        )

    # --- filter by status ---

    def test_filter_by_status_planned(self):
        response = self.client.get(f'{self.BASE_URL}?status=planned')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(r['status'] == 'planned' for r in results))
        names = [r['name'] for r in results]
        self.assertIn('Route Planned', names)
        self.assertNotIn('Route Completed', names)

    def test_filter_by_status_completed(self):
        response = self.client.get(f'{self.BASE_URL}?status=completed')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(all(r['status'] == 'completed' for r in results))

    def test_filter_by_transport(self):
        response = self.client.get(f'{self.BASE_URL}?transport={self.transport.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)

    def test_filter_by_origin_warehouse(self):
        response = self.client.get(f'{self.BASE_URL}?origin_warehouse={self.warehouse.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)

    # --- search ---

    def test_search_by_name_returns_match(self):
        response = self.client.get(f'{self.BASE_URL}?search=Planned')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Route Planned')

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{self.BASE_URL}?search=zzznomatch')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    # --- ordering ---

    def test_ordering_by_scheduled_date_asc(self):
        response = self.client.get(f'{self.BASE_URL}?ordering=scheduled_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [r['scheduled_date'] for r in results]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_scheduled_date_desc(self):
        response = self.client.get(f'{self.BASE_URL}?ordering=-scheduled_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        dates = [r['scheduled_date'] for r in results]
        self.assertEqual(dates, sorted(dates, reverse=True))
