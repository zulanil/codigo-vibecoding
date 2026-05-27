from rest_framework import serializers
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['id', 'stop_order', 'address', 'city', 'estimated_arrival', 'actual_arrival']


class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'transport', 'origin_warehouse', 'name',
            'status', 'scheduled_date', 'stops', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
