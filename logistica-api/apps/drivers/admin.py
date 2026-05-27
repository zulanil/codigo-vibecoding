from django.contrib import admin
from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_number', 'phone', 'status', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'license_number']
    list_filter = ['status', 'is_active']
