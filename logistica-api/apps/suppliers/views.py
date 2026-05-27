from rest_framework import viewsets
from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True).order_by('name')
    serializer_class = SupplierSerializer
    search_fields = ['name', 'email', 'contact_name']
    ordering_fields = ['name', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
