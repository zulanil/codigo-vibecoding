from django.contrib import admin
from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'country', 'capacity_kg', 'is_active']
    search_fields = ['name', 'city', 'country']
    list_filter = ['city', 'country', 'is_active']
