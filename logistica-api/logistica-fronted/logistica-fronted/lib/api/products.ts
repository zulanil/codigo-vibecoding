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

export async function createProduct(payload: ProductPayload, image?: File): Promise<Product> {
  const fd = new FormData();
  (Object.keys(payload) as (keyof ProductPayload)[]).forEach((k) => {
    const v = payload[k];
    if (v !== undefined && v !== null) fd.append(k, String(v));
  });
  if (image) fd.append("image", image);
  const { data } = await apiClient.post<Product>("/products/", fd);
  return data;
}

export async function updateProduct(
  id: number,
  payload: ProductPayload,
  image?: File | null
): Promise<Product> {
  if (image instanceof File) {
    const fd = new FormData();
    (Object.keys(payload) as (keyof ProductPayload)[]).forEach((k) => {
      const v = payload[k];
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    fd.append("image", image);
    const { data } = await apiClient.patch<Product>(`/products/${id}/`, fd);
    return data;
  }
  if (image === null) {
    const { data } = await apiClient.patch<Product>(`/products/${id}/`, {
      ...payload,
      image: null,
    });
    return data;
  }
  const { data } = await apiClient.put<Product>(`/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}/`);
}
