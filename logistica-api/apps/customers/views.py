from rest_framework import viewsets
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True).order_by('name')
    serializer_class = CustomerSerializer
    filterset_fields = ['customer_type']
    search_fields = ['name', 'email', 'company_name']
    ordering_fields = ['name', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
