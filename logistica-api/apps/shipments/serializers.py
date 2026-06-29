from rest_framework import serializers
from .models import Shipment, ShipmentProduct


class ShipmentProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentProduct
        fields = ['id', 'product', 'quantity', 'unit_price']


class ShipmentSerializer(serializers.ModelSerializer):
    shipment_products = ShipmentProductSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_number', 'customer', 'origin_warehouse', 'route',
            'status', 'origin_address', 'destination_address',
            'scheduled_delivery_date', 'actual_delivery_date',
            'weight_kg', 'declared_value', 'shipping_cost',
            'notes', 'delivery_photo', 'shipment_products', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
