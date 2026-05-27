from rest_framework import viewsets
from .models import Transport
from .serializers import TransportSerializer


class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.filter(is_active=True).select_related('driver').order_by('plate_number')
    serializer_class = TransportSerializer
    filterset_fields = ['vehicle_type', 'status', 'driver']
    search_fields = ['plate_number']
    ordering_fields = ['plate_number', 'vehicle_type', 'status']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
