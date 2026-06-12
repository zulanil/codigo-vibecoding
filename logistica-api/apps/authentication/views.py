from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User, Group, Permission

from .permissions import IsSuperUser
from .serializers import (
    LOGISTICA_APPS,
    CustomTokenObtainPairSerializer,
    GroupReadSerializer,
    GroupWriteSerializer,
    PermissionSerializer,
    ProfileUpdateSerializer,
    UserReadSerializer,
    UserWriteSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserReadSerializer(user).data
        data['permissions'] = ['*'] if user.is_superuser else list(user.get_all_permissions())
        return Response(data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user = request.user
        data = UserReadSerializer(user).data
        data['permissions'] = ['*'] if user.is_superuser else list(user.get_all_permissions())
        return Response(data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related('groups').order_by('username')
    permission_classes = [IsSuperUser]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return UserReadSerializer
        return UserWriteSerializer

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'deactivado'})


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related(
        'permissions__content_type'
    ).order_by('name')
    permission_classes = [IsSuperUser]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return GroupReadSerializer
        return GroupWriteSerializer


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.filter(
        content_type__app_label__in=LOGISTICA_APPS
    ).select_related('content_type').order_by('content_type__app_label', 'codename')
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperUser]
    pagination_class = None
