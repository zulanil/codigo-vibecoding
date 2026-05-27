from rest_framework import viewsets
from .models import Warehouse
from .serializers import WarehouseSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True).order_by('name')
    serializer_class = WarehouseSerializer
    filterset_fields = ['city', 'country']
    search_fields = ['name', 'city', 'country']
    ordering_fields = ['name', 'city', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
