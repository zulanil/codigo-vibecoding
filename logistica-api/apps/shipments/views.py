from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Shipment, ShipmentProduct
from .serializers import ShipmentSerializer, ShipmentProductSerializer


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.filter(is_active=True).select_related(
        'customer', 'origin_warehouse', 'route'
    ).prefetch_related('shipment_products')
    serializer_class = ShipmentSerializer
    filterset_fields = ['status', 'customer', 'origin_warehouse', 'route']
    search_fields = ['tracking_number', 'destination_address']
    ordering_fields = ['status', 'scheduled_delivery_date', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['get', 'post'], url_path='items')
    def items(self, request, pk=None):
        shipment = self.get_object()
        if request.method == 'GET':
            items = ShipmentProduct.objects.filter(shipment=shipment).select_related('product')
            serializer = ShipmentProductSerializer(items, many=True)
            return Response(serializer.data)
        serializer = ShipmentProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(shipment=shipment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
