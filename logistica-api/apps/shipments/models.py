from django.db import models
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.routes.models import Route
from apps.products.models import Product


class Shipment(models.Model):
    PENDING = 'pending'
    ASSIGNED = 'assigned'
    IN_TRANSIT = 'in_transit'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ASSIGNED, 'Assigned'),
        (IN_TRANSIT, 'In Transit'),
        (DELIVERED, 'Delivered'),
        (CANCELLED, 'Cancelled'),
    ]

    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='shipments')
    origin_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='shipments')
    route = models.ForeignKey(
        Route, on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    origin_address = models.TextField()
    destination_address = models.TextField()
    scheduled_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3)
    declared_value = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    delivery_photo = models.ImageField(upload_to='shipments/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        ordering = ['-created_at']

    def __str__(self):
        return self.tracking_number


class ShipmentProduct(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='shipment_products')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='shipment_products')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'shipment_products'
        unique_together = ('shipment', 'product')

    def __str__(self):
        return f"{self.shipment.tracking_number} — {self.product.name} x{self.quantity}"
