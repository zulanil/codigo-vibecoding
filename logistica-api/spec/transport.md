# Spec: Transport

## Información del módulo
- App Django: `apps.transport`
- Tabla en BD: `transports`
- Dependencias: `apps.drivers` (FK nullable — transport puede existir sin driver asignado)

## Estado
- [ ] Pendiente de aprobación
- [ ] Aprobado — listo para implementar
- [x] Implementado
- [ ] Validado

## Tareas

### 1. Model — `apps/transport/models.py`
- [x] FK `driver`: `ForeignKey(Driver, on_delete=SET_NULL, null=True, blank=True, related_name='transports')`
- [x] Campo `plate_number`: `CharField(max_length=20, unique=True)`
- [x] Campo `vehicle_type`: `CharField(max_length=30, choices=VEHICLE_TYPE_CHOICES)`
- [x] Choices: `TRUCK`, `VAN`, `MOTORCYCLE` como atributos de clase
- [x] Campo `capacity_kg`: `DecimalField(max_digits=10, decimal_places=2)`
- [x] Campo `status`: `CharField(max_length=20, choices=STATUS_CHOICES, default=AVAILABLE)`
- [x] Choices: `AVAILABLE`, `IN_USE`, `MAINTENANCE` como atributos de clase
- [x] Campo `is_active`: `BooleanField(default=True)`
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'transports'`
- [x] Meta: `ordering = ['plate_number']`
- [x] `__str__` retorna `f"{self.plate_number} ({self.vehicle_type})"`

### 2. Migración
- [x] Migración inicial generada

### 3. Admin — `apps/transport/admin.py`
- [x] `@admin.register(Transport)` con clase `TransportAdmin`
- [x] `list_display = ['plate_number', 'vehicle_type', 'driver', 'capacity_kg', 'status', 'is_active']`
- [x] `search_fields = ['plate_number']`
- [x] `list_filter = ['vehicle_type', 'status', 'is_active']`

### 4. Serializer — `apps/transport/serializers.py`
- [x] Campos explícitos: `['id', 'driver', 'plate_number', 'vehicle_type', 'capacity_kg', 'status', 'created_at', 'updated_at']`
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 5. ViewSet — `apps/transport/views.py`
- [x] Clase: `ModelViewSet`
- [x] Queryset filtra `is_active=True` y `select_related('driver')`
- [x] `filterset_fields = ['vehicle_type', 'status', 'driver']`
- [x] `search_fields = ['plate_number']`

### 6. URLs — `apps/transport/urls.py`
- [x] `DefaultRouter` con prefijo `transports`
- [x] Incluido en `config/urls.py`

### 7. Verificación
- [x] `python manage.py check` sin errores
