from django.contrib import admin
from .models import Shipment, ShipmentProduct


class ShipmentProductInline(admin.TabularInline):
    model = ShipmentProduct
    extra = 1


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    inlines = [ShipmentProductInline]
    list_display = ['tracking_number', 'customer', 'status', 'scheduled_delivery_date', 'is_active']
    search_fields = ['tracking_number', 'destination_address']
    list_filter = ['status', 'is_active']
