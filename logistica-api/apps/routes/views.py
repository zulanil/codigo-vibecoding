from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.filter(is_active=True).select_related('transport', 'origin_warehouse').prefetch_related('stops')
    serializer_class = RouteSerializer
    filterset_fields = ['status', 'transport', 'origin_warehouse']
    search_fields = ['name']
    ordering_fields = ['scheduled_date', 'status', 'created_at']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['get', 'post'], url_path='stops')
    def stops(self, request, pk=None):
        route = self.get_object()
        if request.method == 'GET':
            stops = RouteStop.objects.filter(route=route).order_by('stop_order')
            serializer = RouteStopSerializer(stops, many=True)
            return Response(serializer.data)
        serializer = RouteStopSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(route=route)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
