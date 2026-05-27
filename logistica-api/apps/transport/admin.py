from django.contrib import admin
from .models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ['plate_number', 'vehicle_type', 'driver', 'capacity_kg', 'status', 'is_active']
    search_fields = ['plate_number']
    list_filter = ['vehicle_type', 'status', 'is_active']
