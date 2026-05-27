from rest_framework import serializers
from .models import Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'address', 'city', 'country', 'capacity_kg', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
