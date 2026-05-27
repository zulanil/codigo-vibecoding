from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'supplier', 'name', 'sku', 'description',
            'weight_kg', 'length_cm', 'width_cm', 'height_cm',
            'unit_price', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
