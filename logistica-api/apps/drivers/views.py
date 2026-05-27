from rest_framework import viewsets
from .models import Driver
from .serializers import DriverSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.filter(is_active=True).select_related('user').order_by('user__last_name')
    serializer_class = DriverSerializer
    filterset_fields = ['status']
    search_fields = ['user__first_name', 'user__last_name', 'license_number']
    ordering_fields = ['status', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
