from django.db import models
from apps.transport.models import Transport
from apps.warehouses.models import Warehouse


class Route(models.Model):
    PLANNED = 'planned'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (PLANNED, 'Planned'),
        (IN_PROGRESS, 'In Progress'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]

    transport = models.ForeignKey(Transport, on_delete=models.PROTECT, related_name='routes')
    origin_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='routes')
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PLANNED)
    scheduled_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'routes'
        ordering = ['-scheduled_date']

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    stop_order = models.PositiveIntegerField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    estimated_arrival = models.DateTimeField()
    actual_arrival = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'route_stops'
        unique_together = ('route', 'stop_order')
        ordering = ['stop_order']

    def __str__(self):
        return f"{self.route.name} — Stop {self.stop_order}: {self.city}"
