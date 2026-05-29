import { apiClient } from "@/lib/api/client";
import type { Product, ProductPayload, PaginatedResponse } from "@/lib/types";

interface GetProductsParams {
  page?: string;
  search?: string;
  ordering?: string;
  supplier?: string;
}

export async function getProducts(
  params: GetProductsParams = {}
): Promise<PaginatedResponse<Product>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);
  if (params.supplier) qs.set("supplier", params.supplier);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<Product>>(
    `/products/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/products/${id}/`);
  return data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.post<Product>("/products/", payload);
  return data;
}

export async function updateProduct(
  id: number,
  payload: ProductPayload
): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}/`);
}
