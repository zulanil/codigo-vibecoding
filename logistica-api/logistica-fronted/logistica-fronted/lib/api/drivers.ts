import { apiClient } from "@/lib/api/client";
import type { Driver, DriverPayload, PaginatedResponse } from "@/lib/types";

interface GetDriversParams {
  page?: string;
  search?: string;
  ordering?: string;
  status?: string;
}

export async function getDrivers(
  params: GetDriversParams = {}
): Promise<PaginatedResponse<Driver>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.status) qs.set("status", params.status);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<Driver>>(
    `/drivers/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getDriver(id: number): Promise<Driver> {
  const { data } = await apiClient.get<Driver>(`/drivers/${id}/`);
  return data;
}

export async function createDriver(payload: DriverPayload): Promise<Driver> {
  const { data } = await apiClient.post<Driver>("/drivers/", payload);
  return data;
}

export async function updateDriver(
  id: number,
  payload: DriverPayload
): Promise<Driver> {
  const { data } = await apiClient.put<Driver>(`/drivers/${id}/`, payload);
  return data;
}

export async function deleteDriver(id: number): Promise<void> {
  await apiClient.delete(`/drivers/${id}/`);
}
