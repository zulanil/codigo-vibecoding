import { apiClient } from "@/lib/api/client";
import type { Customer, CustomerPayload, PaginatedResponse } from "@/lib/types";

interface GetCustomersParams {
  page?: string;
  search?: string;
  ordering?: string;
  customer_type?: string;
}

export async function getCustomers(
  params: GetCustomersParams = {}
): Promise<PaginatedResponse<Customer>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.customer_type) qs.set("customer_type", params.customer_type);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<Customer>>(
    `/customers/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/customers/${id}/`);
  return data;
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const { data } = await apiClient.post<Customer>("/customers/", payload);
  return data;
}

export async function updateCustomer(
  id: number,
  payload: CustomerPayload
): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/customers/${id}/`, payload);
  return data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}/`);
}
