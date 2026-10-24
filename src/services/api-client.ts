import axios from "axios";
import { toApiError } from "@/lib/api-error";
import type { ApiEnvelope, Paginated } from "@/types/api";

/**
 * All browser requests go through the Next.js BFF proxy (/api/backend), which attaches the
 * httpOnly session token. The token is never exposed to client-side JavaScript.
 */
export const apiClient = axios.create({
  baseURL: "/api/backend/v1",
  headers: { Accept: "application/json" },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    if (apiError.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    // Actions blocked by the plan open the upgrade prompt; failed page loads render their own.
    const method = (error as { config?: { method?: string } }).config?.method ?? "get";
    if (apiError.needsUpgrade && method !== "get" && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("plan:upgrade-required", { detail: apiError }));
    }
    return Promise.reject(apiError);
  },
);

export async function get<T>(url: string, params?: object): Promise<T> {
  const { data } = await apiClient.get<ApiEnvelope<T>>(url, { params });
  return data.data;
}

export async function getPaginated<T>(url: string, params?: object): Promise<Paginated<T>> {
  const { data } = await apiClient.get<ApiEnvelope<T[]>>(url, { params });
  return {
    items: data.data,
    meta: data.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: data.data.length,
      total: data.data.length,
    },
  };
}

export async function send<T>(
  method: "post" | "put" | "patch" | "delete",
  url: string,
  body?: unknown,
): Promise<{ data: T; message: string }> {
  const { data } = await apiClient.request<ApiEnvelope<T>>({ method, url, data: body });
  return { data: data.data, message: data.message };
}
