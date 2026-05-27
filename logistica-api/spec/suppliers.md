# Spec: Suppliers

## Información del módulo
- App Django: `apps.suppliers`
- Tabla en BD: `suppliers`
- Dependencias: ninguna

## Estado
- [ ] Pendiente de aprobación
- [ ] Aprobado — listo para implementar
- [x] Implementado
- [ ] Validado

## Tareas

### 1. Model — `apps/suppliers/models.py`
- [x] Campo `name`: `CharField(max_length=200)`
- [x] Campo `contact_name`: `CharField(max_length=200)`
- [x] Campo `email`: `EmailField(unique=True)`
- [x] Campo `phone`: `CharField(max_length=30)`
- [x] Campo `address`: `TextField()`
- [x] Campo `is_active`: `BooleanField(default=True)`
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'suppliers'`
- [x] Meta: `ordering = ['name']`
- [x] `__str__` retorna `self.name`

### 2. Migración
- [x] Migración inicial generada (`0001_initial.py`)

### 3. Admin — `apps/suppliers/admin.py`
- [x] `@admin.register(Supplier)` con clase `SupplierAdmin`
- [x] `list_display = ['name', 'contact_name', 'email', 'phone', 'is_active']`
- [x] `search_fields = ['name', 'email', 'contact_name']`
- [x] `list_filter = ['is_active']`

### 4. Serializer — `apps/suppliers/serializers.py`
- [x] Campos explícitos: `['id', 'name', 'contact_name', 'email', 'phone', 'address', 'created_at', 'updated_at']`
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 5. ViewSet — `apps/suppliers/views.py`
- [x] Clase: `ModelViewSet`
- [x] Queryset filtra `is_active=True`
- [x] `search_fields = ['name', 'email', 'contact_name']`
- [x] `ordering_fields = ['name', 'created_at']`

### 6. URLs — `apps/suppliers/urls.py`
- [x] `DefaultRouter` con prefijo `suppliers`
- [x] Incluido en `config/urls.py` bajo `/api/v1/`

### 7. Verificación
- [x] `python manage.py check` sin errores
