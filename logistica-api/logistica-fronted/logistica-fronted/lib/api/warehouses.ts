import { apiClient } from "@/lib/api/client";
import type { Warehouse, WarehousePayload, PaginatedResponse } from "@/lib/types";

interface GetWarehousesParams {
  page?: string;
  search?: string;
  ordering?: string;
  city?: string;
  country?: string;
}

export async function getWarehouses(
  params: GetWarehousesParams = {}
): Promise<PaginatedResponse<Warehouse>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.city) qs.set("city", params.city);
  if (params.country) qs.set("country", params.country);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<Warehouse>>(
    `/warehouses/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getWarehouse(id: number): Promise<Warehouse> {
  const { data } = await apiClient.get<Warehouse>(`/warehouses/${id}/`);
  return data;
}

export async function createWarehouse(payload: WarehousePayload): Promise<Warehouse> {
  const { data } = await apiClient.post<Warehouse>("/warehouses/", payload);
  return data;
}

export async function updateWarehouse(
  id: number,
  payload: WarehousePayload
): Promise<Warehouse> {
  const { data } = await apiClient.put<Warehouse>(`/warehouses/${id}/`, payload);
  return data;
}

export async function deleteWarehouse(id: number): Promise<void> {
  await apiClient.delete(`/warehouses/${id}/`);
}
