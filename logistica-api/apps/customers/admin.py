from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'customer_type', 'phone', 'is_active']
    search_fields = ['name', 'email', 'company_name']
    list_filter = ['customer_type', 'is_active']
