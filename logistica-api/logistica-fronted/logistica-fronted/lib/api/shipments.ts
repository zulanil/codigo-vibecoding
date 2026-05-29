import { apiClient } from "@/lib/api/client";
import type {
  Shipment,
  ShipmentPayload,
  ShipmentProduct,
  ShipmentProductPayload,
  PaginatedResponse,
} from "@/lib/types";

interface GetShipmentsParams {
  page?: string;
  search?: string;
  ordering?: string;
  status?: string;
  customer?: string;
  origin_warehouse?: string;
  route?: string;
}

export async function getShipments(
  params: GetShipmentsParams = {}
): Promise<PaginatedResponse<Shipment>> {
  const { data } = await apiClient.get<PaginatedResponse<Shipment>>(
    "/shipments/",
    { params }
  );
  return data;
}

export async function getShipment(id: number): Promise<Shipment> {
  const { data } = await apiClient.get<Shipment>(`/shipments/${id}/`);
  return data;
}

export async function createShipment(
  payload: ShipmentPayload
): Promise<Shipment> {
  const { data } = await apiClient.post<Shipment>("/shipments/", payload);
  return data;
}

export async function updateShipment(
  id: number,
  payload: ShipmentPayload
): Promise<Shipment> {
  const { data } = await apiClient.put<Shipment>(`/shipments/${id}/`, payload);
  return data;
}

export async function deleteShipment(id: number): Promise<void> {
  await apiClient.delete(`/shipments/${id}/`);
}

export async function getShipmentItems(
  shipmentId: number
): Promise<ShipmentProduct[]> {
  const { data } = await apiClient.get<ShipmentProduct[]>(
    `/shipments/${shipmentId}/items/`
  );
  return data;
}

export async function createShipmentItem(
  shipmentId: number,
  payload: ShipmentProductPayload
): Promise<ShipmentProduct> {
  const { data } = await apiClient.post<ShipmentProduct>(
    `/shipments/${shipmentId}/items/`,
    payload
  );
  return data;
}
