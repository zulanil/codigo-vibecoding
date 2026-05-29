import { apiClient } from "@/lib/api/client";
import type {
  Route,
  RoutePayload,
  RouteStop,
  RouteStopPayload,
  PaginatedResponse,
} from "@/lib/types";

interface GetRoutesParams {
  page?: string;
  search?: string;
  ordering?: string;
  status?: string;
  transport?: string;
  origin_warehouse?: string;
}

export async function getRoutes(
  params: GetRoutesParams = {}
): Promise<PaginatedResponse<Route>> {
  const { data } = await apiClient.get<PaginatedResponse<Route>>("/routes/", { params });
  return data;
}

export async function getRoute(id: number): Promise<Route> {
  const { data } = await apiClient.get<Route>(`/routes/${id}/`);
  return data;
}

export async function createRoute(payload: RoutePayload): Promise<Route> {
  const { data } = await apiClient.post<Route>("/routes/", payload);
  return data;
}

export async function updateRoute(
  id: number,
  payload: RoutePayload
): Promise<Route> {
  const { data } = await apiClient.put<Route>(`/routes/${id}/`, payload);
  return data;
}

export async function deleteRoute(id: number): Promise<void> {
  await apiClient.delete(`/routes/${id}/`);
}

export async function getRouteStops(routeId: number): Promise<RouteStop[]> {
  const { data } = await apiClient.get<RouteStop[]>(`/routes/${routeId}/stops/`);
  return data;
}

export async function createRouteStop(
  routeId: number,
  payload: RouteStopPayload
): Promise<RouteStop> {
  const { data } = await apiClient.post<RouteStop>(
    `/routes/${routeId}/stops/`,
    payload
  );
  return data;
}
