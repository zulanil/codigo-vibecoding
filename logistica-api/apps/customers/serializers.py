from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'user', 'name', 'company_name', 'customer_type',
            'email', 'phone', 'address', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
