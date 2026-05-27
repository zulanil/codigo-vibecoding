from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'supplier', 'unit_price', 'weight_kg', 'is_active']
    search_fields = ['name', 'sku', 'description']
    list_filter = ['supplier', 'is_active']
