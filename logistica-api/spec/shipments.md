# Spec: Shipments

## Información del módulo
- App Django: `apps.shipments`
- Tablas en BD: `shipments`, `shipment_products`
- Dependencias: `apps.customers`, `apps.warehouses`, `apps.routes`, `apps.products`

## Tareas

### 1. Model Shipment — `apps/shipments/models.py`
- [x] Campo `tracking_number`: `CharField(max_length=50, unique=True)`
- [x] FK `customer`: `ForeignKey(Customer, on_delete=PROTECT, related_name='shipments')`
- [x] FK `origin_warehouse`: `ForeignKey(Warehouse, on_delete=PROTECT, related_name='shipments')`
- [x] FK `route`: `ForeignKey(Route, on_delete=SET_NULL, null=True, blank=True, related_name='shipments')`
- [x] Campo `status`: `CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)`
- [x] Choices: `PENDING`, `ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED` como atributos de clase
- [x] Campo `origin_address`: `TextField()`
- [x] Campo `destination_address`: `TextField()`
- [x] Campo `scheduled_delivery_date`: `DateField()`
- [x] Campo `actual_delivery_date`: `DateField(null=True, blank=True)`
- [x] Campo `weight_kg`: `DecimalField(max_digits=10, decimal_places=3)`
- [x] Campo `declared_value`: `DecimalField(max_digits=12, decimal_places=2)`
- [x] Campo `shipping_cost`: `DecimalField(max_digits=12, decimal_places=2)`
- [x] Campo `notes`: `TextField(null=True, blank=True)`
- [ ] Campo `is_active`: `BooleanField(default=True)` ← **FALTANTE**
- [x] Campo `created_at`: `DateTimeField(auto_now_add=True)`
- [x] Campo `updated_at`: `DateTimeField(auto_now=True)`
- [x] Meta: `db_table = 'shipments'`
- [ ] Meta: `ordering = ['-created_at']`
- [x] `__str__` retorna `self.tracking_number`

### 2. Model ShipmentProduct — `apps/shipments/models.py`
- [x] FK `shipment`: `ForeignKey(Shipment, on_delete=CASCADE, related_name='shipment_products')`
- [x] FK `product`: `ForeignKey(Product, on_delete=PROTECT, related_name='shipment_products')`
- [x] Campo `quantity`: `PositiveIntegerField()`
- [x] Campo `unit_price`: `DecimalField(max_digits=12, decimal_places=2)`
- [x] Meta: `db_table = 'shipment_products'`
- [x] Meta: `unique_together = ('shipment', 'product')`
- [x] `__str__` definido

### 3. Migración
- [x] Migración inicial generada
- [ ] Migración para agregar `is_active` a Shipment

### 4. Admin — `apps/shipments/admin.py`
- [x] `@admin.register(Shipment)` con `ShipmentProductInline`
- [ ] `list_display = ['tracking_number', 'customer', 'status', 'scheduled_delivery_date', 'is_active']`
- [ ] `search_fields = ['tracking_number', 'destination_address']`
- [ ] `list_filter = ['status']`

### 5. Serializers — `apps/shipments/serializers.py`
- [x] `ShipmentProductSerializer` con campos explícitos
- [x] `ShipmentSerializer` con `shipment_products` nested (read_only)
- [x] `read_only_fields = ['created_at', 'updated_at']`

### 6. ViewSet — `apps/shipments/views.py`
- [x] Clase: `ModelViewSet`
- [ ] Queryset debe filtrar `is_active=True` ← **FALTANTE**
- [x] `select_related('customer', 'origin_warehouse', 'route')` + `prefetch_related('shipment_products')`
- [x] `filterset_fields = ['status', 'customer', 'origin_warehouse', 'route']`
- [x] `@action` para `/items/` (GET + POST)

### 7. URLs — `apps/shipments/urls.py`
- [x] `DefaultRouter` con prefijo `shipments`
- [x] Incluido en `config/urls.py`

### 8. Verificación
- [ ] `python manage.py check` sin errores
- [ ] `python manage.py makemigrations shipments` genera migración para `is_active`
