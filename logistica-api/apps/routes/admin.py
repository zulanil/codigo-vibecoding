from django.contrib import admin
from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    inlines = [RouteStopInline]
    list_display = ['name', 'transport', 'origin_warehouse', 'status', 'scheduled_date', 'is_active']
    search_fields = ['name']
    list_filter = ['status', 'is_active']
