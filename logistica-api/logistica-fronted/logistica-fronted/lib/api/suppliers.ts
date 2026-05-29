import { apiClient } from "@/lib/api/client";
import type { Supplier, SupplierPayload, PaginatedResponse } from "@/lib/types";

interface GetSuppliersParams {
  page?: string;
  search?: string;
  ordering?: string;
}

export async function getSuppliers(
  params: GetSuppliersParams = {}
): Promise<PaginatedResponse<Supplier>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<Supplier>>(
    `/suppliers/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getSupplier(id: number): Promise<Supplier> {
  const { data } = await apiClient.get<Supplier>(`/suppliers/${id}/`);
  return data;
}

export async function createSupplier(payload: SupplierPayload): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>("/suppliers/", payload);
  return data;
}

export async function updateSupplier(
  id: number,
  payload: SupplierPayload
): Promise<Supplier> {
  const { data } = await apiClient.put<Supplier>(`/suppliers/${id}/`, payload);
  return data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await apiClient.delete(`/suppliers/${id}/`);
}
