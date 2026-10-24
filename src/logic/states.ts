import type { BaseClient } from "../client.js";
import type { HassState } from "../types.js";

export function getStates(client: BaseClient): Promise<HassState[]> {
  return client.request<HassState[]>("/api/states");
}

export function getState(
  client: BaseClient,
  entityId: string,
): Promise<HassState> {
  return client.request<HassState>(
    `/api/states/${encodeURIComponent(entityId)}`,
  );
}

export async function setState(
  client: BaseClient,
  entityId: string,
  state: string,
  attributes?: Record<string, unknown>,
): Promise<HassState> {
  return client.request<HassState>(
    `/api/states/${encodeURIComponent(entityId)}`,
    {
      method: "POST",
      body: JSON.stringify({ state, attributes: attributes ?? {} }),
    },
  );
}

export async function listByDomain(
  client: BaseClient,
  domain: string,
): Promise<HassState[]> {
  const all = await getStates(client);
  const prefix = `${domain}.`;
  return all.filter((s) => s.entity_id.startsWith(prefix));
}
