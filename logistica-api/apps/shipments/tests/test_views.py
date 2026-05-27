from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.products.models import Product
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentProduct


class ShipmentViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

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
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-0001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            route=self.route,
            status='pending',
            origin_address='Origin St 1',
            destination_address='Destination Ave 2',
            scheduled_delivery_date='2026-07-01',
            weight_kg='5.000',
            declared_value='1500.00',
            shipping_cost='50.00',
        )

        self.valid_payload = {
            'tracking_number': 'TRK-NEW-1',
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'route': self.route.id,
            'status': 'pending',
            'origin_address': 'New Origin St',
            'destination_address': 'New Dest Blvd',
            'scheduled_delivery_date': '2026-08-01',
            'weight_kg': '3.000',
            'declared_value': '800.00',
            'shipping_cost': '25.00',
        }

    # ========================
    # Happy path
    # ========================

    def test_list_returns_200(self):
        response = self.client.get('/api/v1/shipments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tracking_number'], 'TRK-0001')

    def test_create_returns_201(self):
        response = self.client.post('/api/v1/shipments/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tracking_number'], 'TRK-NEW-1')
        self.assertTrue(Shipment.objects.filter(tracking_number='TRK-NEW-1').exists())

    def test_retrieve_returns_200(self):
        response = self.client.get(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tracking_number'], 'TRK-0001')

    def test_update_returns_200(self):
        payload = self.valid_payload.copy()
        payload['tracking_number'] = 'TRK-UPDATED'
        response = self.client.put(
            f'/api/v1/shipments/{self.shipment.id}/', payload, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.tracking_number, 'TRK-UPDATED')

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            f'/api/v1/shipments/{self.shipment.id}/',
            {'status': 'assigned'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'assigned')

    def test_destroy_returns_204(self):
        response = self.client.delete(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_create_without_route_returns_201(self):
        payload = self.valid_payload.copy()
        payload['tracking_number'] = 'TRK-NOROUTE'
        payload.pop('route')
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['route'])

    def test_retrieve_includes_shipment_products(self):
        supplier = Supplier.objects.create(
            name='Sup A', contact_name='Alice',
            email='supa@test.com', phone='555-0099', address='1 Sup St',
        )
        product = Product.objects.create(
            supplier=supplier, name='Tablet', sku='TAB-001',
            weight_kg='0.800', length_cm='25.00', width_cm='18.00',
            height_cm='1.00', unit_price='300.00',
        )
        ShipmentProduct.objects.create(
            shipment=self.shipment, product=product,
            quantity=1, unit_price='300.00',
        )
        response = self.client.get(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['shipment_products']), 1)

    # ========================
    # Unhappy path
    # ========================

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get('/api/v1/shipments/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post('/api/v1/shipments/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_required_field_returns_400(self):
        payload = self.valid_payload.copy()
        del payload['tracking_number']
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tracking_number', response.data)

    def test_create_missing_customer_returns_400(self):
        payload = self.valid_payload.copy()
        del payload['customer']
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_origin_warehouse_returns_400(self):
        payload = self.valid_payload.copy()
        del payload['origin_warehouse']
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_destination_address_returns_400(self):
        payload = self.valid_payload.copy()
        del payload['destination_address']
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_tracking_number_returns_400(self):
        payload = self.valid_payload.copy()
        payload['tracking_number'] = 'TRK-0001'
        response = self.client.post('/api/v1/shipments/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tracking_number', response.data)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get('/api/v1/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_returns_404(self):
        response = self.client.put('/api/v1/shipments/99999/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_destroy_nonexistent_returns_404(self):
        response = self.client.delete('/api/v1/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========================
    # Edge cases
    # ========================

    def test_destroy_soft_deletes(self):
        response = self.client.delete(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.shipment.refresh_from_db()
        self.assertFalse(self.shipment.is_active)

    def test_destroy_excluded_from_list(self):
        self.client.delete(f'/api/v1/shipments/{self.shipment.id}/')
        list_response = self.client.get('/api/v1/shipments/')
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.shipment.id, ids)

    def test_list_excludes_inactive_shipment(self):
        Shipment.objects.create(
            tracking_number='TRK-INACTIVE',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            status='pending',
            origin_address='Inactive Origin',
            destination_address='Inactive Dest',
            scheduled_delivery_date='2026-09-01',
            weight_kg='1.000',
            declared_value='200.00',
            shipping_cost='10.00',
            is_active=False,
        )
        response = self.client.get('/api/v1/shipments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tracking_numbers = [item['tracking_number'] for item in response.data['results']]
        self.assertNotIn('TRK-INACTIVE', tracking_numbers)

    def test_retrieve_inactive_shipment_returns_404(self):
        self.shipment.is_active = False
        self.shipment.save()
        response = self.client.get(f'/api/v1/shipments/{self.shipment.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_partial_update_notes_only(self):
        response = self.client.patch(
            f'/api/v1/shipments/{self.shipment.id}/',
            {'notes': 'Fragile cargo'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.notes, 'Fragile cargo')


class ShipmentItemsEndpointTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        self.warehouse = Warehouse.objects.create(
            name='WH Items',
            address='3 WH Rd',
            city='Cali',
            country='Colombia',
            capacity_kg='8000.00',
        )
        self.customer = Customer.objects.create(
            name='Items Customer',
            customer_type='company',
            email='itemscustomer@test.com',
            phone='555-0020',
            address='10 Items Blvd',
        )
        self.supplier = Supplier.objects.create(
            name='Items Supplier',
            contact_name='Bob',
            email='itemssup@test.com',
            phone='555-0021',
            address='11 Sup Rd',
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            name='Keyboard',
            sku='KEY-001',
            weight_kg='0.500',
            length_cm='45.00',
            width_cm='15.00',
            height_cm='3.00',
            unit_price='80.00',
        )
        self.product2 = Product.objects.create(
            supplier=self.supplier,
            name='Mouse',
            sku='MOU-001',
            weight_kg='0.150',
            length_cm='12.00',
            width_cm='6.00',
            height_cm='4.00',
            unit_price='25.00',
        )
        self.shipment = Shipment.objects.create(
            tracking_number='TRK-ITEMS-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            status='pending',
            origin_address='Origin Items St',
            destination_address='Dest Items Ave',
            scheduled_delivery_date='2026-07-20',
            weight_kg='1.000',
            declared_value='200.00',
            shipping_cost='15.00',
        )
        self.items_url = f'/api/v1/shipments/{self.shipment.id}/items/'

    # ========================
    # Happy path — GET items
    # ========================

    def test_get_items_returns_200_empty_list(self):
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_items_returns_existing_items(self):
        ShipmentProduct.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price='80.00',
        )
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['product'], self.product.id)
        self.assertEqual(response.data[0]['quantity'], 2)

    def test_get_items_returns_multiple_items(self):
        ShipmentProduct.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price='80.00',
        )
        ShipmentProduct.objects.create(
            shipment=self.shipment, product=self.product2,
            quantity=3, unit_price='25.00',
        )
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    # ========================
    # Happy path — POST items
    # ========================

    def test_post_item_returns_201(self):
        payload = {'product': self.product.id, 'quantity': 4, 'unit_price': '80.00'}
        response = self.client.post(self.items_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['product'], self.product.id)
        self.assertEqual(response.data['quantity'], 4)
        self.assertTrue(
            ShipmentProduct.objects.filter(
                shipment=self.shipment, product=self.product
            ).exists()
        )

    def test_post_second_item_returns_201(self):
        ShipmentProduct.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price='80.00',
        )
        payload = {'product': self.product2.id, 'quantity': 2, 'unit_price': '25.00'}
        response = self.client.post(self.items_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.shipment.shipment_products.count(), 2)

    # ========================
    # Unhappy path
    # ========================

    def test_get_items_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_item_unauthenticated_returns_401(self):
        self.client.credentials()
        payload = {'product': self.product.id, 'quantity': 1, 'unit_price': '80.00'}
        response = self.client.post(self.items_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_item_missing_product_returns_400(self):
        payload = {'quantity': 1, 'unit_price': '80.00'}
        response = self.client.post(self.items_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('product', response.data)

    def test_post_item_missing_quantity_returns_400(self):
        payload = {'product': self.product.id, 'unit_price': '80.00'}
        response = self.client.post(self.items_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data)

    def test_post_item_missing_unit_price_returns_400(self):
        payload = {'product': self.product.id, 'quantity': 1}
        response = self.client.post(self.items_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('unit_price', response.data)

    def test_get_items_nonexistent_shipment_returns_404(self):
        response = self.client.get('/api/v1/shipments/99999/items/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_post_item_nonexistent_shipment_returns_404(self):
        payload = {'product': self.product.id, 'quantity': 1, 'unit_price': '80.00'}
        response = self.client.post('/api/v1/shipments/99999/items/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ========================
    # Edge cases
    # ========================

    def test_post_duplicate_product_in_same_shipment_raises_integrity_error(self):
        # The items endpoint passes valid serializer data to save(), but the DB
        # unique_together constraint on (shipment, product) raises IntegrityError
        # because the view has no cross-field validation for duplicates.
        from django.db import IntegrityError
        ShipmentProduct.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price='80.00',
        )
        payload = {'product': self.product.id, 'quantity': 2, 'unit_price': '80.00'}
        with self.assertRaises(IntegrityError):
            self.client.post(self.items_url, payload, format='json')

    def test_get_items_returns_list_not_paginated(self):
        # The items endpoint returns a plain list, not paginated
        response = self.client.get(self.items_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class ShipmentFilterTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        self.warehouse = Warehouse.objects.create(
            name='Filter WH',
            address='4 WH Rd',
            city='Barranquilla',
            country='Colombia',
            capacity_kg='3000.00',
        )
        self.customer1 = Customer.objects.create(
            name='Filter Customer 1',
            customer_type='individual',
            email='filtercust1@test.com',
            phone='555-0030',
            address='30 Filter St',
        )
        self.customer2 = Customer.objects.create(
            name='Filter Customer 2',
            customer_type='company',
            email='filtercust2@test.com',
            phone='555-0031',
            address='31 Filter St',
        )
        self.shipment_pending = Shipment.objects.create(
            tracking_number='TRK-FILTER-PEND',
            customer=self.customer1,
            origin_warehouse=self.warehouse,
            status='pending',
            origin_address='Filter Origin',
            destination_address='Alpha District',
            scheduled_delivery_date='2026-07-01',
            weight_kg='2.000',
            declared_value='500.00',
            shipping_cost='20.00',
        )
        self.shipment_assigned = Shipment.objects.create(
            tracking_number='TRK-FILTER-ASGN',
            customer=self.customer2,
            origin_warehouse=self.warehouse,
            status='assigned',
            origin_address='Filter Origin 2',
            destination_address='Beta District',
            scheduled_delivery_date='2026-08-01',
            weight_kg='3.000',
            declared_value='900.00',
            shipping_cost='35.00',
        )

    # ========================
    # Happy path — filters
    # ========================

    def test_filter_by_status_pending(self):
        response = self.client.get('/api/v1/shipments/?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-PEND')

    def test_filter_by_status_assigned(self):
        response = self.client.get('/api/v1/shipments/?status=assigned')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-ASGN')

    def test_filter_by_customer(self):
        response = self.client.get(f'/api/v1/shipments/?customer={self.customer1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-PEND')

    def test_filter_by_origin_warehouse(self):
        response = self.client.get(
            f'/api/v1/shipments/?origin_warehouse={self.warehouse.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)

    def test_search_by_tracking_number(self):
        response = self.client.get('/api/v1/shipments/?search=TRK-FILTER-PEND')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-PEND')

    def test_search_by_destination_address(self):
        response = self.client.get('/api/v1/shipments/?search=Alpha District')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-PEND')

    def test_search_no_match_returns_empty(self):
        response = self.client.get('/api/v1/shipments/?search=ZZZNOMATCH')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # ========================
    # Edge cases — ordering
    # ========================

    def test_ordering_by_scheduled_delivery_date_asc(self):
        response = self.client.get('/api/v1/shipments/?ordering=scheduled_delivery_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-PEND')

    def test_ordering_by_scheduled_delivery_date_desc(self):
        response = self.client.get('/api/v1/shipments/?ordering=-scheduled_delivery_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['tracking_number'], 'TRK-FILTER-ASGN')

    def test_ordering_by_status(self):
        response = self.client.get('/api/v1/shipments/?ordering=status')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
