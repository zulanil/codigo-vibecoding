from django.db import models
from apps.suppliers.models import Supplier


class Product(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='products')
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=3)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2)
    width_cm = models.DecimalField(max_digits=8, decimal_places=2)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku})"
