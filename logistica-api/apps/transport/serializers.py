from rest_framework import serializers
from .models import Transport


class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = [
            'id', 'driver', 'plate_number', 'vehicle_type',
            'capacity_kg', 'status', 'image', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
