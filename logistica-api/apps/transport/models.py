from django.db import models
from apps.drivers.models import Driver


class Transport(models.Model):
    TRUCK = 'truck'
    VAN = 'van'
    MOTORCYCLE = 'motorcycle'
    VEHICLE_TYPE_CHOICES = [
        (TRUCK, 'Truck'),
        (VAN, 'Van'),
        (MOTORCYCLE, 'Motorcycle'),
    ]

    AVAILABLE = 'available'
    IN_USE = 'in_use'
    MAINTENANCE = 'maintenance'
    STATUS_CHOICES = [
        (AVAILABLE, 'Available'),
        (IN_USE, 'In Use'),
        (MAINTENANCE, 'Maintenance'),
    ]

    driver = models.ForeignKey(
        Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='transports'
    )
    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=30, choices=VEHICLE_TYPE_CHOICES)
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)
    image = models.ImageField(upload_to='transports/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transports'
        ordering = ['plate_number']

    def __str__(self):
        return f"{self.plate_number} ({self.vehicle_type})"
