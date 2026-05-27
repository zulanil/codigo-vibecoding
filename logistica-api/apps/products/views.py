from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('supplier').order_by('name')
    serializer_class = ProductSerializer
    filterset_fields = ['supplier']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'sku', 'unit_price', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
