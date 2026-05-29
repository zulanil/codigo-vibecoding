"""Seed script — run via: python manage.py shell < seed_data.py"""
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

from datetime import datetime
from decimal import Decimal
from django.contrib.auth.models import User
from django.utils import timezone
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from apps.customers.models import Customer
from apps.products.models import Product
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentProduct


def dt(year, month, day):
    return timezone.make_aware(datetime(year, month, day, 10, 0, 0))


print("=== Seeding data ===")

# --- Suppliers (10) ---
suppliers_data = [
    {"name": "TechWorld S.A.", "contact_name": "Carlos Méndez", "email": "carlos@techworld.co", "phone": "3001234567", "address": "Cra 15 #45-20, Bogotá"},
    {"name": "ElectroParts Ltda.", "contact_name": "Ana Gutiérrez", "email": "ana@electroparts.co", "phone": "3017654321", "address": "Av 80 #32-10, Medellín"},
    {"name": "DigitalHub Corp.", "contact_name": "Roberto Silva", "email": "roberto@digitalhub.co", "phone": "3025551234", "address": "Cl 72 #12-30, Bogotá"},
    {"name": "MicroChip Express", "contact_name": "Laura Fernández", "email": "laura@microchip.co", "phone": "3039876543", "address": "Cra 43 #55-60, Barranquilla"},
    {"name": "Global Tech Imports", "contact_name": "Miguel Torres", "email": "miguel@globaltech.co", "phone": "3044443210", "address": "Cl 5 #8-90, Cali"},
    {"name": "Samsung Colombia S.A.S.", "contact_name": "Diana Ramos", "email": "diana@samsungco.co", "phone": "3055557890", "address": "Av El Dorado #115-45, Bogotá"},
    {"name": "Apple Store Colombia", "contact_name": "Felipe Ospina", "email": "felipe@applestore.co", "phone": "3066661234", "address": "Cra 11 #82-71, Bogotá"},
    {"name": "HP Inc. Colombia", "contact_name": "Sandra Morales", "email": "sandra@hpcolombia.co", "phone": "3077772345", "address": "Cl 26 #92-32, Bogotá"},
    {"name": "Lenovo Colombia", "contact_name": "Andrés Herrera", "email": "andres@lenovoco.co", "phone": "3088883456", "address": "Av Cali #48-29, Bogotá"},
    {"name": "Xiaomi Colombia", "contact_name": "Valentina Cruz", "email": "valentina@xiaomico.co", "phone": "3099994567", "address": "Cra 15 #93-75, Bogotá"},
]
suppliers = []
for d in suppliers_data:
    s, created = Supplier.objects.get_or_create(email=d["email"], defaults=d)
    suppliers.append(s)
    print(f"  Supplier: {s.name} ({'created' if created else 'exists'})")

# --- Warehouses (8) ---
warehouses_data = [
    {"name": "Bodega Central Bogotá", "address": "Zona Industrial Cl 13 #42-15", "city": "Bogotá", "country": "Colombia", "capacity_kg": "50000.00"},
    {"name": "Bodega Norte Medellín", "address": "Parque Industrial Bello", "city": "Medellín", "country": "Colombia", "capacity_kg": "35000.00"},
    {"name": "Bodega Caribe Barranquilla", "address": "Puerto Colombia Km 5", "city": "Barranquilla", "country": "Colombia", "capacity_kg": "40000.00"},
    {"name": "Bodega Sur Cali", "address": "Zona Franca Palmaseca", "city": "Cali", "country": "Colombia", "capacity_kg": "28000.00"},
    {"name": "Bodega Eje Cafetero", "address": "Autopista del Café Km 3", "city": "Pereira", "country": "Colombia", "capacity_kg": "15000.00"},
    {"name": "Bodega Oriente Bucaramanga", "address": "Zona Industrial Girón Km 2", "city": "Bucaramanga", "country": "Colombia", "capacity_kg": "22000.00"},
    {"name": "Bodega Costa Cartagena", "address": "Zona Franca La Candelaria", "city": "Cartagena", "country": "Colombia", "capacity_kg": "18000.00"},
    {"name": "Bodega Andina Manizales", "address": "Parque Empresarial Los Fundadores", "city": "Manizales", "country": "Colombia", "capacity_kg": "12000.00"},
]
warehouses = []
for d in warehouses_data:
    w, created = Warehouse.objects.get_or_create(name=d["name"], defaults=d)
    warehouses.append(w)
    print(f"  Warehouse: {w.name} ({'created' if created else 'exists'})")

# --- Customers (15) ---
customers_data = [
    {"name": "Juan Pérez", "company_name": "", "customer_type": "individual", "email": "juan.perez@gmail.com", "phone": "3101112233", "address": "Cl 100 #15-20, Bogotá"},
    {"name": "TechSol S.A.S.", "company_name": "TechSol S.A.S.", "customer_type": "company", "email": "compras@techsol.co", "phone": "6014455667", "address": "Av El Dorado #68-90, Bogotá"},
    {"name": "María García", "company_name": "", "customer_type": "individual", "email": "maria.garcia@hotmail.com", "phone": "3152223344", "address": "Cra 70 #45-10, Medellín"},
    {"name": "Inversiones Digitales Ltda.", "company_name": "Inversiones Digitales Ltda.", "customer_type": "company", "email": "info@invdigitales.co", "phone": "6024556677", "address": "Cl 8 #36-50, Cali"},
    {"name": "Carlos Rodríguez", "company_name": "", "customer_type": "individual", "email": "carlos.rodriguez@yahoo.com", "phone": "3163334455", "address": "Cra 50 #22-30, Barranquilla"},
    {"name": "Electrónica del Norte S.A.S.", "company_name": "Electrónica del Norte S.A.S.", "customer_type": "company", "email": "pedidos@electronorte.co", "phone": "6075566778", "address": "Cl 10 #14-25, Bucaramanga"},
    {"name": "Sofía Martínez", "company_name": "", "customer_type": "individual", "email": "sofia.martinez@gmail.com", "phone": "3174445566", "address": "Av 4N #11-45, Cali"},
    {"name": "Distribuidora TechMax S.A.", "company_name": "Distribuidora TechMax S.A.", "customer_type": "company", "email": "compras@techmax.co", "phone": "6026677889", "address": "Cl 5 #3-42, Cali"},
    {"name": "Andrés Gómez", "company_name": "", "customer_type": "individual", "email": "andres.gomez@outlook.com", "phone": "3185556677", "address": "Cra 38 #75-20, Barranquilla"},
    {"name": "Global Systems S.A.S.", "company_name": "Global Systems S.A.S.", "customer_type": "company", "email": "info@globalsystems.co", "phone": "6013344556", "address": "Cra 9 #72-51, Bogotá"},
    {"name": "Laura Sánchez", "company_name": "", "customer_type": "individual", "email": "laura.sanchez@gmail.com", "phone": "3196667788", "address": "Cl 49 #73-45, Medellín"},
    {"name": "Innovatech Ltda.", "company_name": "Innovatech Ltda.", "customer_type": "company", "email": "ventas@innovatech.co", "phone": "6047788990", "address": "Cl 50 #45-29, Medellín"},
    {"name": "Diego Herrera", "company_name": "", "customer_type": "individual", "email": "diego.herrera@hotmail.com", "phone": "3207778899", "address": "Cra 27 #56-15, Manizales"},
    {"name": "ProTech Colombia S.A.", "company_name": "ProTech Colombia S.A.", "customer_type": "company", "email": "admin@protechco.co", "phone": "6058899001", "address": "Av Circunvalar #35-10, Pereira"},
    {"name": "Isabella Vargas", "company_name": "", "customer_type": "individual", "email": "isabella.vargas@gmail.com", "phone": "3218889900", "address": "Cl 34 #15-20, Cartagena"},
]
customers = []
for d in customers_data:
    c, created = Customer.objects.get_or_create(email=d["email"], defaults=d)
    customers.append(c)
    print(f"  Customer: {c.name} ({'created' if created else 'exists'})")

# --- Products (12) ---
products_data = [
    {"supplier": suppliers[0], "name": "Laptop Dell XPS 15", "sku": "LAP-DELL-XPS15", "description": "Laptop profesional 15 pulgadas, Core i7, 16GB RAM", "weight_kg": "2.10", "length_cm": "35.70", "width_cm": "23.50", "height_cm": "1.80", "unit_price": "4500000.00"},
    {"supplier": suppliers[1], "name": "iPhone 15 Pro 256GB", "sku": "PHN-APL-IP15P", "description": "Smartphone Apple iPhone 15 Pro, 256GB, titanio negro", "weight_kg": "0.19", "length_cm": "14.67", "width_cm": "7.10", "height_cm": "0.83", "unit_price": "5200000.00"},
    {"supplier": suppliers[2], "name": 'Monitor Samsung 27" 4K', "sku": "MON-SAM-27UHD", "description": "Monitor UHD 4K, panel IPS, 144Hz", "weight_kg": "5.60", "length_cm": "61.40", "width_cm": "36.40", "height_cm": "5.30", "unit_price": "1800000.00"},
    {"supplier": suppliers[3], "name": "Teclado Mecánico Logitech G Pro", "sku": "KBD-LOG-GPRO", "description": "Teclado mecánico gaming, switches GX Blue, RGB", "weight_kg": "0.98", "length_cm": "36.00", "width_cm": "15.00", "height_cm": "3.40", "unit_price": "520000.00"},
    {"supplier": suppliers[4], "name": "Webcam Logitech Brio 4K", "sku": "CAM-LOG-BRIO4K", "description": "Webcam 4K Ultra HD, HDR, campo visual 90°", "weight_kg": "0.26", "length_cm": "10.00", "width_cm": "3.30", "height_cm": "3.30", "unit_price": "750000.00"},
    {"supplier": suppliers[5], "name": "Samsung Galaxy S24 Ultra", "sku": "PHN-SAM-S24U", "description": "Smartphone Samsung Galaxy S24 Ultra, 256GB", "weight_kg": "0.23", "length_cm": "16.28", "width_cm": "7.92", "height_cm": "0.86", "unit_price": "4800000.00"},
    {"supplier": suppliers[6], "name": 'MacBook Pro 14" M3', "sku": "LAP-APL-MBP14M3", "description": "MacBook Pro 14 pulgadas, chip M3 Pro, 18GB RAM, 512GB SSD", "weight_kg": "1.61", "length_cm": "31.26", "width_cm": "22.12", "height_cm": "1.55", "unit_price": "8200000.00"},
    {"supplier": suppliers[7], "name": "HP EliteBook 840 G11", "sku": "LAP-HP-EB840G11", "description": "Laptop empresarial HP EliteBook 840 G11, Core Ultra 5, 16GB RAM", "weight_kg": "1.40", "length_cm": "32.00", "width_cm": "21.80", "height_cm": "1.82", "unit_price": "5800000.00"},
    {"supplier": suppliers[8], "name": "Lenovo ThinkPad X1 Carbon", "sku": "LAP-LEN-X1C12", "description": "Laptop ultraligera ThinkPad X1 Carbon Gen 12, Core Ultra 7", "weight_kg": "1.12", "length_cm": "31.50", "width_cm": "22.40", "height_cm": "1.49", "unit_price": "7200000.00"},
    {"supplier": suppliers[9], "name": "Xiaomi Redmi Note 13 Pro", "sku": "PHN-XIA-RN13P", "description": "Smartphone Xiaomi Redmi Note 13 Pro, 256GB, 200MP", "weight_kg": "0.20", "length_cm": "16.17", "width_cm": "7.45", "height_cm": "0.80", "unit_price": "1250000.00"},
    {"supplier": suppliers[5], "name": 'Samsung Odyssey G7 32" QHD', "sku": "MON-SAM-OG732", "description": "Monitor gaming curvo 32 pulgadas QHD, 240Hz, 1ms", "weight_kg": "8.20", "length_cm": "71.20", "width_cm": "33.60", "height_cm": "5.50", "unit_price": "2800000.00"},
    {"supplier": suppliers[3], "name": "Mouse Logitech MX Master 3S", "sku": "MOU-LOG-MXM3S", "description": "Mouse inalámbrico Logitech MX Master 3S, sensor 8000DPI", "weight_kg": "0.14", "length_cm": "12.50", "width_cm": "8.40", "height_cm": "5.10", "unit_price": "320000.00"},
]
products = []
for d in products_data:
    p, created = Product.objects.get_or_create(sku=d["sku"], defaults=d)
    products.append(p)
    print(f"  Product: {p.name} ({'created' if created else 'exists'})")

# --- Users + Drivers (10) ---
driver_users_data = [
    {"username": "driver_alvarez", "first_name": "Pedro", "last_name": "Álvarez", "license": "B1-001234", "phone": "3100000000", "status": "available"},
    {"username": "driver_gomez", "first_name": "Luz", "last_name": "Gómez", "license": "B1-005678", "phone": "3101000000", "status": "on_route"},
    {"username": "driver_martinez", "first_name": "Andrés", "last_name": "Martínez", "license": "C2-009876", "phone": "3102000000", "status": "available"},
    {"username": "driver_lopez", "first_name": "Sandra", "last_name": "López", "license": "C2-004321", "phone": "3103000000", "status": "off_duty"},
    {"username": "driver_ramirez", "first_name": "Jorge", "last_name": "Ramírez", "license": "B1-007890", "phone": "3104000000", "status": "available"},
    {"username": "driver_vargas", "first_name": "Patricia", "last_name": "Vargas", "license": "B1-011111", "phone": "3105000000", "status": "available"},
    {"username": "driver_castillo", "first_name": "Héctor", "last_name": "Castillo", "license": "C2-022222", "phone": "3106000000", "status": "on_route"},
    {"username": "driver_moreno", "first_name": "Rosa", "last_name": "Moreno", "license": "B1-033333", "phone": "3107000000", "status": "available"},
    {"username": "driver_jimenez", "first_name": "Luis", "last_name": "Jiménez", "license": "C2-044444", "phone": "3108000000", "status": "off_duty"},
    {"username": "driver_torres", "first_name": "Carmen", "last_name": "Torres", "license": "B1-055555", "phone": "3109000000", "status": "available"},
]
drivers = []
for ud in driver_users_data:
    user, _ = User.objects.get_or_create(username=ud["username"], defaults={
        "first_name": ud["first_name"], "last_name": ud["last_name"],
        "email": f"{ud['username']}@logistica.co"
    })
    d, created = Driver.objects.get_or_create(license_number=ud["license"], defaults={
        "user": user, "phone": ud["phone"], "status": ud["status"]
    })
    drivers.append(d)
    print(f"  Driver: {user.get_full_name()} / {d.license_number} ({'created' if created else 'exists'})")

# --- Transport (10) ---
transports_data = [
    {"driver": drivers[0], "plate_number": "ABC-123", "vehicle_type": "truck", "capacity_kg": "10000.00", "status": "available"},
    {"driver": drivers[1], "plate_number": "DEF-456", "vehicle_type": "van", "capacity_kg": "2500.00", "status": "in_use"},
    {"driver": drivers[2], "plate_number": "GHI-789", "vehicle_type": "truck", "capacity_kg": "8000.00", "status": "available"},
    {"driver": drivers[3], "plate_number": "JKL-012", "vehicle_type": "van", "capacity_kg": "3000.00", "status": "maintenance"},
    {"driver": drivers[4], "plate_number": "MNO-345", "vehicle_type": "motorcycle", "capacity_kg": "150.00", "status": "available"},
    {"driver": drivers[5], "plate_number": "PQR-678", "vehicle_type": "truck", "capacity_kg": "12000.00", "status": "available"},
    {"driver": drivers[6], "plate_number": "STU-901", "vehicle_type": "truck", "capacity_kg": "9000.00", "status": "in_use"},
    {"driver": drivers[7], "plate_number": "VWX-234", "vehicle_type": "van", "capacity_kg": "2800.00", "status": "available"},
    {"driver": drivers[8], "plate_number": "YZA-567", "vehicle_type": "motorcycle", "capacity_kg": "120.00", "status": "available"},
    {"driver": drivers[9], "plate_number": "BCD-890", "vehicle_type": "van", "capacity_kg": "3500.00", "status": "maintenance"},
]
transports = []
for d in transports_data:
    t, created = Transport.objects.get_or_create(plate_number=d["plate_number"], defaults=d)
    transports.append(t)
    print(f"  Transport: {t.plate_number} ({t.vehicle_type}) ({'created' if created else 'exists'})")

# --- Routes (10) ---
routes_data = [
    {"transport": transports[0], "origin_warehouse": warehouses[0], "name": "Ruta Bogotá-Medellín", "status": "completed", "scheduled_date": "2025-05-10"},
    {"transport": transports[1], "origin_warehouse": warehouses[1], "name": "Ruta Medellín-Barranquilla", "status": "in_progress", "scheduled_date": "2025-05-28"},
    {"transport": transports[2], "origin_warehouse": warehouses[0], "name": "Ruta Bogotá-Cali", "status": "planned", "scheduled_date": "2025-06-02"},
    {"transport": transports[4], "origin_warehouse": warehouses[3], "name": "Ruta Cali-Pereira Express", "status": "planned", "scheduled_date": "2025-06-05"},
    {"transport": transports[0], "origin_warehouse": warehouses[2], "name": "Ruta Barranquilla-Bogotá", "status": "cancelled", "scheduled_date": "2025-05-15"},
    {"transport": transports[5], "origin_warehouse": warehouses[0], "name": "Ruta Bogotá-Bucaramanga", "status": "completed", "scheduled_date": "2025-02-15"},
    {"transport": transports[6], "origin_warehouse": warehouses[1], "name": "Ruta Medellín-Cali", "status": "completed", "scheduled_date": "2025-03-20"},
    {"transport": transports[7], "origin_warehouse": warehouses[2], "name": "Ruta Barranquilla-Cartagena", "status": "completed", "scheduled_date": "2025-04-10"},
    {"transport": transports[8], "origin_warehouse": warehouses[5], "name": "Ruta Bucaramanga-Bogotá Express", "status": "in_progress", "scheduled_date": "2025-05-25"},
    {"transport": transports[9], "origin_warehouse": warehouses[6], "name": "Ruta Cartagena-Barranquilla", "status": "planned", "scheduled_date": "2025-06-10"},
]
routes = []
for d in routes_data:
    r, created = Route.objects.get_or_create(name=d["name"], defaults=d)
    routes.append(r)
    print(f"  Route: {r.name} ({r.status}) ({'created' if created else 'exists'})")

# --- Shipments (25) ---
Shipment.objects.filter(tracking_number="").update(tracking_number="TRK-2025-00001")

shipments_data = [
    # Existing 5 — updated to May 2025
    {"tracking_number": "TRK-2025-00001", "customer": customers[0], "origin_warehouse": warehouses[0], "route": routes[0], "status": "delivered", "origin_address": "Cl 13 #42-15, Bogotá", "destination_address": "Av El Poblado #25-10, Medellín", "scheduled_delivery_date": "2025-05-12", "actual_delivery_date": "2025-05-11", "weight_kg": "2.10", "declared_value": "4500000.00", "shipping_cost": "85000.00", "notes": "Entrega en porteria edificio"},
    {"tracking_number": "TRK-2025-00002", "customer": customers[1], "origin_warehouse": warehouses[1], "route": routes[1], "status": "in_transit", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Puerto Colombia Km 5, Barranquilla", "scheduled_delivery_date": "2025-05-30", "actual_delivery_date": None, "weight_kg": "5.79", "declared_value": "7000000.00", "shipping_cost": "120000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00003", "customer": customers[2], "origin_warehouse": warehouses[0], "route": None, "status": "assigned", "origin_address": "Cl 13 #42-15, Bogotá", "destination_address": "Cra 70 #45-10, Medellín", "scheduled_delivery_date": "2025-06-01", "actual_delivery_date": None, "weight_kg": "0.98", "declared_value": "520000.00", "shipping_cost": "45000.00", "notes": "Llamar antes de entregar"},
    {"tracking_number": "TRK-2025-00004", "customer": customers[3], "origin_warehouse": warehouses[3], "route": routes[3], "status": "pending", "origin_address": "Zona Franca Palmaseca, Cali", "destination_address": "Autopista del Café Km 3, Pereira", "scheduled_delivery_date": "2025-06-07", "actual_delivery_date": None, "weight_kg": "0.26", "declared_value": "750000.00", "shipping_cost": "38000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00005", "customer": customers[4], "origin_warehouse": warehouses[2], "route": None, "status": "cancelled", "origin_address": "Puerto Colombia Km 5, Barranquilla", "destination_address": "Cra 50 #22-30, Barranquilla", "scheduled_delivery_date": "2025-05-20", "actual_delivery_date": None, "weight_kg": "0.19", "declared_value": "5200000.00", "shipping_cost": "25000.00", "notes": "Cancelado por cliente"},
    # January 2025
    {"tracking_number": "TRK-2025-00006", "customer": customers[1], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Av El Dorado #68-90, Bogotá", "scheduled_delivery_date": "2025-01-10", "actual_delivery_date": "2025-01-10", "weight_kg": "2.10", "declared_value": "4500000.00", "shipping_cost": "45000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00007", "customer": customers[9], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Cra 9 #72-51, Bogotá", "scheduled_delivery_date": "2025-01-15", "actual_delivery_date": "2025-01-14", "weight_kg": "1.61", "declared_value": "8200000.00", "shipping_cost": "75000.00", "notes": "Firma requerida"},
    {"tracking_number": "TRK-2025-00008", "customer": customers[7], "origin_warehouse": warehouses[1], "route": None, "status": "delivered", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Cl 5 #3-42, Cali", "scheduled_delivery_date": "2025-01-20", "actual_delivery_date": "2025-01-20", "weight_kg": "0.23", "declared_value": "4800000.00", "shipping_cost": "105000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00009", "customer": customers[5], "origin_warehouse": warehouses[5], "route": None, "status": "delivered", "origin_address": "Zona Industrial Girón Km 2, Bucaramanga", "destination_address": "Cl 10 #14-25, Bucaramanga", "scheduled_delivery_date": "2025-01-25", "actual_delivery_date": "2025-01-24", "weight_kg": "8.20", "declared_value": "2800000.00", "shipping_cost": "65000.00", "notes": ""},
    # February 2025
    {"tracking_number": "TRK-2025-00010", "customer": customers[11], "origin_warehouse": warehouses[1], "route": None, "status": "delivered", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Cl 50 #45-29, Medellín", "scheduled_delivery_date": "2025-02-08", "actual_delivery_date": "2025-02-08", "weight_kg": "1.40", "declared_value": "5800000.00", "shipping_cost": "55000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00011", "customer": customers[1], "origin_warehouse": warehouses[0], "route": routes[5], "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Cl 10 #14-25, Bucaramanga", "scheduled_delivery_date": "2025-02-15", "actual_delivery_date": "2025-02-15", "weight_kg": "5.60", "declared_value": "1800000.00", "shipping_cost": "95000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00012", "customer": customers[9], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Cra 9 #72-51, Bogotá", "scheduled_delivery_date": "2025-02-20", "actual_delivery_date": "2025-02-19", "weight_kg": "1.12", "declared_value": "7200000.00", "shipping_cost": "38000.00", "notes": "Entrega urgente"},
    {"tracking_number": "TRK-2025-00013", "customer": customers[13], "origin_warehouse": warehouses[4], "route": None, "status": "cancelled", "origin_address": "Autopista del Café Km 3, Pereira", "destination_address": "Av Circunvalar #35-10, Pereira", "scheduled_delivery_date": "2025-02-25", "actual_delivery_date": None, "weight_kg": "0.98", "declared_value": "520000.00", "shipping_cost": "22000.00", "notes": "Dirección incorrecta"},
    # March 2025
    {"tracking_number": "TRK-2025-00014", "customer": customers[7], "origin_warehouse": warehouses[1], "route": routes[6], "status": "delivered", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Zona Franca Palmaseca, Cali", "scheduled_delivery_date": "2025-03-10", "actual_delivery_date": "2025-03-11", "weight_kg": "2.30", "declared_value": "9450000.00", "shipping_cost": "145000.00", "notes": "2 unidades"},
    {"tracking_number": "TRK-2025-00015", "customer": customers[1], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Av El Dorado #68-90, Bogotá", "scheduled_delivery_date": "2025-03-18", "actual_delivery_date": "2025-03-17", "weight_kg": "4.20", "declared_value": "10400000.00", "shipping_cost": "55000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00016", "customer": customers[11], "origin_warehouse": warehouses[1], "route": None, "status": "delivered", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Cl 50 #45-29, Medellín", "scheduled_delivery_date": "2025-03-25", "actual_delivery_date": "2025-03-25", "weight_kg": "0.34", "declared_value": "1570000.00", "shipping_cost": "32000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00017", "customer": customers[14], "origin_warehouse": warehouses[6], "route": routes[7], "status": "delivered", "origin_address": "Zona Franca La Candelaria, Cartagena", "destination_address": "Cl 34 #15-20, Cartagena", "scheduled_delivery_date": "2025-03-28", "actual_delivery_date": "2025-03-28", "weight_kg": "0.20", "declared_value": "1250000.00", "shipping_cost": "18000.00", "notes": ""},
    # April 2025
    {"tracking_number": "TRK-2025-00018", "customer": customers[9], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Cra 9 #72-51, Bogotá", "scheduled_delivery_date": "2025-04-08", "actual_delivery_date": "2025-04-08", "weight_kg": "8.20", "declared_value": "2800000.00", "shipping_cost": "48000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00019", "customer": customers[1], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Av Circunvalar #35-10, Pereira", "scheduled_delivery_date": "2025-04-15", "actual_delivery_date": "2025-04-14", "weight_kg": "6.72", "declared_value": "14000000.00", "shipping_cost": "185000.00", "notes": "Pedido empresarial 3 unidades"},
    {"tracking_number": "TRK-2025-00020", "customer": customers[5], "origin_warehouse": warehouses[5], "route": None, "status": "delivered", "origin_address": "Zona Industrial Girón Km 2, Bucaramanga", "destination_address": "Cl 10 #14-25, Bucaramanga", "scheduled_delivery_date": "2025-04-22", "actual_delivery_date": "2025-04-22", "weight_kg": "1.12", "declared_value": "7200000.00", "shipping_cost": "32000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00021", "customer": customers[12], "origin_warehouse": warehouses[1], "route": None, "status": "in_transit", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Cl 8 #36-50, Cali", "scheduled_delivery_date": "2025-04-30", "actual_delivery_date": None, "weight_kg": "2.10", "declared_value": "4500000.00", "shipping_cost": "115000.00", "notes": ""},
    # May 2025 (additional)
    {"tracking_number": "TRK-2025-00022", "customer": customers[7], "origin_warehouse": warehouses[0], "route": None, "status": "delivered", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Av 4N #11-45, Cali", "scheduled_delivery_date": "2025-05-05", "actual_delivery_date": "2025-05-05", "weight_kg": "1.83", "declared_value": "8200000.00", "shipping_cost": "95000.00", "notes": "Requiere empaque especial"},
    {"tracking_number": "TRK-2025-00023", "customer": customers[11], "origin_warehouse": warehouses[1], "route": routes[8], "status": "in_transit", "origin_address": "Parque Industrial Bello, Medellín", "destination_address": "Cl 50 #45-29, Medellín", "scheduled_delivery_date": "2025-05-25", "actual_delivery_date": None, "weight_kg": "0.97", "declared_value": "6050000.00", "shipping_cost": "68000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00024", "customer": customers[14], "origin_warehouse": warehouses[6], "route": None, "status": "assigned", "origin_address": "Zona Franca La Candelaria, Cartagena", "destination_address": "Cl 34 #15-20, Cartagena", "scheduled_delivery_date": "2025-06-02", "actual_delivery_date": None, "weight_kg": "0.20", "declared_value": "1250000.00", "shipping_cost": "15000.00", "notes": ""},
    {"tracking_number": "TRK-2025-00025", "customer": customers[9], "origin_warehouse": warehouses[0], "route": None, "status": "pending", "origin_address": "Zona Industrial Cl 13 #42-15, Bogotá", "destination_address": "Cra 9 #72-51, Bogotá", "scheduled_delivery_date": "2025-06-05", "actual_delivery_date": None, "weight_kg": "5.60", "declared_value": "1800000.00", "shipping_cost": "42000.00", "notes": ""},
]

# created_at targets per tracking number
created_at_map = {
    "TRK-2025-00001": dt(2025, 5, 12), "TRK-2025-00002": dt(2025, 5, 28),
    "TRK-2025-00003": dt(2025, 5, 30), "TRK-2025-00004": dt(2025, 5, 31),
    "TRK-2025-00005": dt(2025, 5, 20), "TRK-2025-00006": dt(2025, 1, 8),
    "TRK-2025-00007": dt(2025, 1, 13), "TRK-2025-00008": dt(2025, 1, 18),
    "TRK-2025-00009": dt(2025, 1, 23), "TRK-2025-00010": dt(2025, 2, 5),
    "TRK-2025-00011": dt(2025, 2, 12), "TRK-2025-00012": dt(2025, 2, 18),
    "TRK-2025-00013": dt(2025, 2, 23), "TRK-2025-00014": dt(2025, 3, 7),
    "TRK-2025-00015": dt(2025, 3, 15), "TRK-2025-00016": dt(2025, 3, 22),
    "TRK-2025-00017": dt(2025, 3, 27), "TRK-2025-00018": dt(2025, 4, 5),
    "TRK-2025-00019": dt(2025, 4, 12), "TRK-2025-00020": dt(2025, 4, 20),
    "TRK-2025-00021": dt(2025, 4, 27), "TRK-2025-00022": dt(2025, 5, 3),
    "TRK-2025-00023": dt(2025, 5, 22), "TRK-2025-00024": dt(2025, 5, 28),
    "TRK-2025-00025": dt(2025, 5, 30),
}

shipments = []
for d in shipments_data:
    s, created = Shipment.objects.get_or_create(tracking_number=d["tracking_number"], defaults=d)
    shipments.append(s)
    target_dt = created_at_map.get(d["tracking_number"])
    if target_dt:
        Shipment.objects.filter(id=s.id).update(created_at=target_dt)
    print(f"  Shipment: {s.tracking_number} ({s.status}) ({'created' if created else 'exists'})")

# --- ShipmentProducts ---
items_data = [
    (shipments[0], products[0], 1, "4500000.00"),
    (shipments[1], products[1], 2, "5200000.00"),
    (shipments[1], products[2], 1, "1800000.00"),
    (shipments[2], products[3], 1, "520000.00"),
    (shipments[3], products[4], 1, "750000.00"),
    (shipments[5], products[0], 1, "4500000.00"),
    (shipments[6], products[6], 1, "8200000.00"),
    (shipments[7], products[5], 1, "4800000.00"),
    (shipments[8], products[10], 1, "2800000.00"),
    (shipments[9], products[7], 1, "5800000.00"),
    (shipments[10], products[2], 1, "1800000.00"),
    (shipments[10], products[3], 2, "520000.00"),
    (shipments[11], products[8], 1, "7200000.00"),
    (shipments[12], products[3], 1, "520000.00"),
    (shipments[13], products[0], 1, "4500000.00"),
    (shipments[13], products[1], 1, "4950000.00"),
    (shipments[14], products[1], 2, "5200000.00"),
    (shipments[15], products[9], 1, "1250000.00"),
    (shipments[15], products[11], 1, "320000.00"),
    (shipments[16], products[9], 1, "1250000.00"),
    (shipments[17], products[10], 1, "2800000.00"),
    (shipments[18], products[6], 1, "8200000.00"),
    (shipments[18], products[7], 1, "5800000.00"),
    (shipments[19], products[8], 1, "7200000.00"),
    (shipments[20], products[0], 1, "4500000.00"),
    (shipments[21], products[6], 1, "8200000.00"),
    (shipments[22], products[7], 1, "5800000.00"),
    (shipments[22], products[3], 1, "250000.00"),
    (shipments[23], products[9], 1, "1250000.00"),
    (shipments[24], products[2], 1, "1800000.00"),
]
for shipment, product, qty, price in items_data:
    item, created = ShipmentProduct.objects.get_or_create(
        shipment=shipment, product=product,
        defaults={"quantity": qty, "unit_price": Decimal(price)}
    )
    print(f"  ShipmentProduct: {product.name} x{qty} in {shipment.tracking_number} ({'created' if created else 'exists'})")

print("\n=== Seed complete ===")
print(f"  {len(suppliers)} suppliers, {len(warehouses)} warehouses, {len(customers)} customers")
print(f"  {len(products)} products, {len(drivers)} drivers, {len(transports)} transports")
print(f"  {len(routes)} routes, {len(shipments)} shipments")
