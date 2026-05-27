# Spec: Warehouses

## Información del módulo
- App Django: `apps.warehouses`
- Tabla en BD: `warehouses`
- Dependencias: ninguna

## Estado
- [ ] Pendiente de aprobación
- [ ] Aprobado — listo para implementar
- [x] Implementado
- [ ] Validado

## Tareas

### 1. Model — `apps/warehouses/models.py`
- [x] Campo `name`: `CharField(max_length=200)`
- [x] Campo `address`: `TextField()`
- [x] Campo `city`: `CharField(max_length=100)`
- [x] Campo `country`: `CharField(max_length=100)`
- [x] Campo `capacity_kg`: `DecimalField(max_digits=10, decimal_places=2)`
- [x] Campo `is_active`: `BooleanField(default=True)`
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'warehouses'`
- [x] Meta: `ordering = ['name']`
- [x] `__str__` retorna `self.name`

### 2. Migración
- [x] Migración inicial generada

### 3. Admin — `apps/warehouses/admin.py`
- [x] `@admin.register(Warehouse)` con clase `WarehouseAdmin`
- [x] `list_display = ['name', 'city', 'country', 'capacity_kg', 'is_active']`
- [x] `search_fields = ['name', 'city', 'country']`
- [x] `list_filter = ['city', 'country', 'is_active']`

### 4. Serializer — `apps/warehouses/serializers.py`
- [x] Campos explícitos: `['id', 'name', 'address', 'city', 'country', 'capacity_kg', 'created_at', 'updated_at']`
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 5. ViewSet — `apps/warehouses/views.py`
- [x] Clase: `ModelViewSet`
- [x] Queryset filtra `is_active=True`
- [x] `filterset_fields = ['city', 'country']`
- [x] `search_fields = ['name', 'city', 'country']`

### 6. URLs — `apps/warehouses/urls.py`
- [x] `DefaultRouter` con prefijo `warehouses`
- [x] Incluido en `config/urls.py`

### 7. Verificación
- [x] `python manage.py check` sin errores
