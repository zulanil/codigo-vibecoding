from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('supplier').order_by('name')
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['supplier']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'sku', 'unit_price', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        product = self.get_object()

        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if product.image:
            product.image.delete(save=False)

        product.image = request.FILES['image']
        product.save()

        serializer = self.get_serializer(product)
        return Response(serializer.data)
