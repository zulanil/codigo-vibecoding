# Spec: Products

## Información del módulo
- App Django: `apps.products`
- Tabla en BD: `products`
- Dependencias: `apps.suppliers`

## Tareas

### 1. Model — `apps/products/models.py`
- [x] FK `supplier`: `ForeignKey(Supplier, on_delete=PROTECT, related_name='products')`
- [x] Campo `name`: `CharField(max_length=200)`
- [x] Campo `sku`: `CharField(max_length=100, unique=True)`
- [x] Campo `description`: `TextField(null=True, blank=True)`
- [x] Campo `weight_kg`: `DecimalField(max_digits=8, decimal_places=3)`
- [x] Campo `length_cm`: `DecimalField(max_digits=8, decimal_places=2)`
- [x] Campo `width_cm`: `DecimalField(max_digits=8, decimal_places=2)`
- [x] Campo `height_cm`: `DecimalField(max_digits=8, decimal_places=2)`
- [x] Campo `unit_price`: `DecimalField(max_digits=12, decimal_places=2)`
- [x] Campo `is_active`: `BooleanField(default=True)`
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'products'`
- [ ] Meta: `ordering = ['name']`
- [x] `__str__` retorna `f"{self.name} ({self.sku})"`

### 2. Migración
- [x] Migración inicial generada

### 3. Admin — `apps/products/admin.py`
- [ ] Usar `@admin.register(Product)` con clase `ProductAdmin`
- [ ] `list_display = ['name', 'sku', 'supplier', 'unit_price', 'weight_kg', 'is_active']`
- [ ] `search_fields = ['name', 'sku', 'description']`
- [ ] `list_filter = ['supplier']`

### 4. Serializer — `apps/products/serializers.py`
- [x] Campos explícitos listados
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 5. ViewSet — `apps/products/views.py`
- [x] Clase: `ModelViewSet`
- [x] Queryset filtra `is_active=True` y `select_related('supplier')`
- [x] `filterset_fields = ['supplier']`
- [x] `search_fields = ['name', 'sku', 'description']`

### 6. URLs — `apps/products/urls.py`
- [x] `DefaultRouter` con prefijo `products`
- [x] Incluido en `config/urls.py`

### 7. Verificación
- [ ] `python manage.py check` sin errores
