import { apiClient } from "@/lib/api/client";
import type { Transport, TransportPayload, PaginatedResponse } from "@/lib/types";

interface GetTransportsParams {
  page?: string;
  search?: string;
  ordering?: string;
  status?: string;
  vehicle_type?: string;
  driver?: string;
}

export async function getTransports(
  params: GetTransportsParams = {}
): Promise<PaginatedResponse<Transport>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.status) qs.set("status", params.status);
  if (params.vehicle_type) qs.set("vehicle_type", params.vehicle_type);
  if (params.driver) qs.set("driver", params.driver);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<Transport>>(
    `/transports/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getTransport(id: number): Promise<Transport> {
  const { data } = await apiClient.get<Transport>(`/transports/${id}/`);
  return data;
}

export async function createTransport(payload: TransportPayload): Promise<Transport> {
  const { data } = await apiClient.post<Transport>("/transports/", payload);
  return data;
}

export async function updateTransport(
  id: number,
  payload: TransportPayload
): Promise<Transport> {
  const { data } = await apiClient.put<Transport>(`/transports/${id}/`, payload);
  return data;
}

export async function deleteTransport(id: number): Promise<void> {
  await apiClient.delete(`/transports/${id}/`);
}
