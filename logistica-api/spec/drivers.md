# Spec: Drivers

## Información del módulo
- App Django: `apps.drivers`
- Tabla en BD: `drivers`
- Dependencias: `auth_user` (Django nativo)

## Tareas

### 1. Model — `apps/drivers/models.py`
- [x] FK `user`: `OneToOneField(User, on_delete=CASCADE, related_name='driver')`
- [x] Campo `license_number`: `CharField(max_length=50, unique=True)`
- [x] Campo `phone`: `CharField(max_length=30)`
- [x] Campo `status`: `CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)`
- [x] Choices: `AVAILABLE`, `ON_ROUTE`, `OFF_DUTY` como atributos de clase
- [x] Campo `is_active`: `BooleanField(default=True)`
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'drivers'`
- [ ] Meta: `ordering = ['user__last_name']`
- [x] `__str__` retorna `f"{self.user.get_full_name()} ({self.license_number})"`

### 2. Migración
- [x] Migración inicial generada

### 3. Admin — `apps/drivers/admin.py`
- [ ] Usar `@admin.register(Driver)` con clase `DriverAdmin`
- [ ] `list_display = ['user', 'license_number', 'phone', 'status', 'is_active']`
- [ ] `search_fields = ['user__first_name', 'user__last_name', 'license_number']`
- [ ] `list_filter = ['status']`

### 4. Serializer — `apps/drivers/serializers.py`
- [x] Campos explícitos: `['id', 'user', 'license_number', 'phone', 'status', 'created_at', 'updated_at']`
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 5. ViewSet — `apps/drivers/views.py`
- [x] Clase: `ModelViewSet`
- [x] Queryset filtra `is_active=True` y `select_related('user')`
- [x] `filterset_fields = ['status']`
- [x] `search_fields = ['user__first_name', 'user__last_name', 'license_number']`

### 6. URLs — `apps/drivers/urls.py`
- [x] `DefaultRouter` con prefijo `drivers`
- [x] Incluido en `config/urls.py`

### 7. Verificación
- [ ] `python manage.py check` sin errores
