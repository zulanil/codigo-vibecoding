from rest_framework import serializers
from .models import Driver


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'user', 'license_number', 'phone', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
