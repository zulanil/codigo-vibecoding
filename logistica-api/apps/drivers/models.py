from django.db import models
from django.contrib.auth.models import User


class Driver(models.Model):
    AVAILABLE = 'available'
    ON_ROUTE = 'on_route'
    OFF_DUTY = 'off_duty'
    STATUS_CHOICES = [
        (AVAILABLE, 'Available'),
        (ON_ROUTE, 'On Route'),
        (OFF_DUTY, 'Off Duty'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver')
    license_number = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'drivers'
        ordering = ['user__last_name']

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.license_number})"
