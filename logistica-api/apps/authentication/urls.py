from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import UserViewSet, GroupViewSet, CurrentUserView, PermissionViewSet

router = DefaultRouter()
router.register(r'auth/users', UserViewSet, basename='auth-users')
router.register(r'auth/groups', GroupViewSet, basename='auth-groups')
router.register(r'auth/permissions', PermissionViewSet, basename='auth-permissions')

urlpatterns = [
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
] + router.urls
