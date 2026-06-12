import { apiClient } from "@/lib/api/client";
import type { AuthUser, AuthUserPayload, AuthGroup, AuthPermission, PaginatedResponse } from "@/lib/types";

interface GetUsersParams {
  page?: string;
  search?: string;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me/");
  return data;
}

export interface ProfileUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  confirm_password?: string;
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>("/auth/me/", payload);
  return data;
}

export async function getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<AuthUser>> {
  const qs = new URLSearchParams();
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  const query = qs.toString();
  const { data } = await apiClient.get<PaginatedResponse<AuthUser>>(
    `/auth/users/${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getUser(id: number): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>(`/auth/users/${id}/`);
  return data;
}

export async function createUser(payload: AuthUserPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>("/auth/users/", payload);
  return data;
}

export async function updateUser(id: number, payload: Partial<AuthUserPayload>): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>(`/auth/users/${id}/`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/auth/users/${id}/`);
}

export async function deactivateUser(id: number): Promise<void> {
  await apiClient.post(`/auth/users/${id}/deactivate/`);
}

export async function getPermissions(): Promise<AuthPermission[]> {
  const { data } = await apiClient.get<AuthPermission[]>("/auth/permissions/");
  return data;
}

export async function getGroups(): Promise<AuthGroup[]> {
  const { data } = await apiClient.get<AuthGroup[]>("/auth/groups/");
  return data;
}

export async function createGroup(name: string): Promise<AuthGroup> {
  const { data } = await apiClient.post<AuthGroup>("/auth/groups/", { name });
  return data;
}

export async function updateGroup(id: number, name: string, permissions?: number[]): Promise<AuthGroup> {
  const payload: Record<string, unknown> = { name };
  if (permissions !== undefined) payload.permissions = permissions;
  const { data } = await apiClient.patch<AuthGroup>(`/auth/groups/${id}/`, payload);
  return data;
}

export async function deleteGroup(id: number): Promise<void> {
  await apiClient.delete(`/auth/groups/${id}/`);
}
