// Interfaces TypeScript para los 8 módulos del backend Logística API.
// Todos los campos DecimalField del backend llegan como string — NO usar number para precios/pesos.
// Los campos read-only (id, created_at, updated_at) no se envían en payloads de creación.

// ---- Paginación genérica ----

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- Auth ----

export interface TokenObtainPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  is_superuser: boolean;
  groups: string[];
  permissions: string[];
}

export interface AuthPermission {
  id: number;
  codename: string;
  name: string;
  module: string;
  full_codename: string;
}

export interface TokenRefreshPayload {
  refresh: string;
}

export interface TokenVerifyPayload {
  token: string;
}

export interface AuthGroup {
  id: number;
  name: string;
  permissions: AuthPermission[];
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  groups: AuthGroup[];
}

export interface AuthUserPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  groups: number[];
  password?: string;
}

// ---- Base común ----

interface BaseEntity {
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Suppliers ----

export interface Supplier extends BaseEntity {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
}

export type SupplierPayload = Omit<Supplier, keyof BaseEntity>;

// ---- Warehouses ----

export interface Warehouse extends BaseEntity {
  name: string;
  address: string;
  city: string;
  country: string;
  capacity_kg: string;
}

export type WarehousePayload = Omit<Warehouse, keyof BaseEntity>;

// ---- Customers ----

export type CustomerType = "individual" | "company";

export interface Customer extends BaseEntity {
  user: number | null;
  name: string;
  company_name: string;
  customer_type: CustomerType;
  email: string;
  phone: string;
  address: string;
}

export type CustomerPayload = Omit<Customer, keyof BaseEntity>;

// ---- Products ----

export interface Product extends BaseEntity {
  supplier: number;
  name: string;
  sku: string;
  description: string;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  unit_price: string;
  image_url: string | null;
}

export type ProductPayload = Omit<Product, keyof BaseEntity | "image_url">;

// ---- Drivers ----

export type DriverStatus = "available" | "on_route" | "off_duty";

export interface Driver extends BaseEntity {
  user: number;
  license_number: string;
  phone: string;
  status: DriverStatus;
}

export type DriverPayload = Omit<Driver, keyof BaseEntity>;

// ---- Transport ----

export type VehicleType = "truck" | "van" | "motorcycle";
export type TransportStatus = "available" | "in_use" | "maintenance";

export interface Transport extends BaseEntity {
  driver: number | null;
  plate_number: string;
  vehicle_type: VehicleType;
  capacity_kg: string;
  status: TransportStatus;
}

export type TransportPayload = Omit<Transport, keyof BaseEntity>;

// ---- Routes ----

export type RouteStatus = "planned" | "in_progress" | "completed" | "cancelled";

export interface RouteStop {
  id: number;
  stop_order: number;
  address: string;
  city: string;
  estimated_arrival: string | null;
  actual_arrival: string | null;
}

export interface Route extends BaseEntity {
  transport: number;
  origin_warehouse: number;
  name: string;
  status: RouteStatus;
  scheduled_date: string;
  stops: RouteStop[];
}

// stops es read-only en el backend — no se incluye en el payload de creación/edición
export type RoutePayload = Omit<Route, keyof BaseEntity | "stops">;
export type RouteStopPayload = Omit<RouteStop, "id">;

// ---- Shipments ----

export type ShipmentStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface ShipmentProduct {
  id: number;
  product: number;
  quantity: number;
  unit_price: string;
}

export interface Shipment extends BaseEntity {
  tracking_number: string;
  customer: number;
  origin_warehouse: number;
  route: number | null;
  status: ShipmentStatus;
  origin_address: string;
  destination_address: string;
  scheduled_delivery_date: string | null;
  actual_delivery_date: string | null;
  weight_kg: string;
  declared_value: string;
  shipping_cost: string;
  notes: string;
  shipment_products: ShipmentProduct[];
}

// tracking_number y shipment_products son generados/read-only — no se envían en payload
export type ShipmentPayload = Omit<
  Shipment,
  keyof BaseEntity | "tracking_number" | "shipment_products"
>;
export type ShipmentProductPayload = Omit<ShipmentProduct, "id">;
