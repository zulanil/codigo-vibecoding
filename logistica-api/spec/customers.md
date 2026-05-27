# Spec: Customers

## Información del módulo
- App Django: `apps.customers`
- Tabla en BD: `customers`
- Dependencias: `auth_user` (Django nativo)

## Estado
- [ ] Pendiente de aprobación
- [ ] Aprobado — listo para implementar
- [x] Implementado
- [ ] Validado

## Tareas

### 1. Model — `apps/customers/models.py`
- [x] FK `user`: `OneToOneField(User, null=True, blank=True, on_delete=SET_NULL)`
- [x] Campo `name`: `CharField(max_length=200)`
- [x] Campo `company_name`: `CharField(max_length=200, null=True, blank=True)`
- [x] Campo `customer_type`: `CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES)`
- [x] Choices: `INDIVIDUAL = 'individual'`, `COMPANY = 'company'` como atributos de clase
- [x] Campo `email`: `EmailField(unique=True)`
- [x] Campo `phone`: `CharField(max_length=30)`
- [x] Campo `address`: `TextField()`
- [x] Campo `is_active`: `BooleanField(default=True)`
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'customers'`
- [x] Meta: `ordering = ['name']`
- [x] `__str__` retorna `self.name`

### 2. Migración
- [x] Migración inicial generada

### 3. Admin — `apps/customers/admin.py`
- [x] `@admin.register(Customer)` con clase `CustomerAdmin`
- [x] `list_display = ['name', 'email', 'customer_type', 'phone', 'is_active']`
- [x] `search_fields = ['name', 'email', 'company_name']`
- [x] `list_filter = ['customer_type', 'is_active']`

### 4. Serializer — `apps/customers/serializers.py`
- [x] Campos explícitos: `['id', 'user', 'name', 'company_name', 'customer_type', 'email', 'phone', 'address', 'created_at', 'updated_at']`
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 5. ViewSet — `apps/customers/views.py`
- [x] Clase: `ModelViewSet`
- [x] Queryset filtra `is_active=True`
- [x] `filterset_fields = ['customer_type']`
- [x] `search_fields = ['name', 'email', 'company_name']`

### 6. URLs — `apps/customers/urls.py`
- [x] `DefaultRouter` con prefijo `customers`
- [x] Incluido en `config/urls.py`

### 7. Verificación
- [x] `python manage.py check` sin errores
