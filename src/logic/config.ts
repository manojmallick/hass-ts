import type { BaseClient } from "../client.js";
import type { HassConfig } from "../types.js";

export interface ApiStatus {
  message: string;
}

export function getApiStatus(client: BaseClient): Promise<ApiStatus> {
  return client.request<ApiStatus>("/api/");
}

export function getConfig(client: BaseClient): Promise<HassConfig> {
  return client.request<HassConfig>("/api/config");
}
