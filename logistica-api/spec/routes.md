# Spec: Routes

## Información del módulo
- App Django: `apps.routes`
- Tablas en BD: `routes`, `route_stops`
- Dependencias: `apps.transport`, `apps.warehouses`

## Tareas

### 1. Model Route — `apps/routes/models.py`
- [x] FK `transport`: `ForeignKey(Transport, on_delete=PROTECT, related_name='routes')`
- [x] FK `origin_warehouse`: `ForeignKey(Warehouse, on_delete=PROTECT, related_name='routes')`
- [x] Campo `name`: `CharField(max_length=200)`
- [x] Campo `status`: `CharField(max_length=20, choices=STATUS_CHOICES, default=PLANNED)`
- [x] Choices: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` como atributos de clase
- [x] Campo `scheduled_date`: `DateField()`
- [ ] Campo `is_active`: `BooleanField(default=True)` ← **FALTANTE**
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'routes'`
- [ ] Meta: `ordering = ['-scheduled_date']`
- [x] `__str__` retorna `self.name`

### 2. Model RouteStop — `apps/routes/models.py`
- [x] FK `route`: `ForeignKey(Route, on_delete=CASCADE, related_name='stops')`
- [x] Campo `stop_order`: `PositiveIntegerField()`
- [x] Campo `address`: `TextField()`
- [x] Campo `city`: `CharField(max_length=100)`
- [x] Campo `estimated_arrival`: `DateTimeField()`
- [x] Campo `actual_arrival`: `DateTimeField(null=True, blank=True)`
- [x] Meta: `db_table = 'route_stops'`
- [x] Meta: `unique_together = ('route', 'stop_order')`
- [x] Meta: `ordering = ['stop_order']`
- [x] `__str__` definido

### 3. Migración
- [x] Migración inicial generada
- [ ] Migración para agregar `is_active` a Route

### 4. Admin — `apps/routes/admin.py`
- [x] `@admin.register(Route)` con `RouteStopInline`
- [ ] `list_display = ['name', 'transport', 'origin_warehouse', 'status', 'scheduled_date', 'is_active']`
- [ ] `search_fields = ['name']`
- [ ] `list_filter = ['status']`

### 5. Serializers — `apps/routes/serializers.py`
- [x] `RouteStopSerializer` con campos explícitos
- [x] `RouteSerializer` con `stops` nested (read_only)
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 6. ViewSet — `apps/routes/views.py`
- [x] Clase: `ModelViewSet`
- [ ] Queryset debe filtrar `is_active=True` ← **FALTANTE**
- [x] `select_related('transport', 'origin_warehouse')` + `prefetch_related('stops')`
- [x] `filterset_fields = ['status', 'transport', 'origin_warehouse']`
- [x] `@action` para `/stops/` (GET + POST)

### 7. URLs — `apps/routes/urls.py`
- [x] `DefaultRouter` con prefijo `routes`
- [x] Incluido en `config/urls.py`

### 8. Verificación
- [ ] `python manage.py check` sin errores
- [ ] `python manage.py makemigrations routes` genera migración para `is_active`
