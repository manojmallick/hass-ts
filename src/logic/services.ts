import type { BaseClient } from "../client.js";
import type { CallServiceOptions, ServiceData, ServiceTarget } from "../types.js";

export interface ServiceCallResult {
  /** HA may return changed states depending on service */
  raw: unknown;
}

export async function callService(
  client: BaseClient,
  options: CallServiceOptions,
): Promise<ServiceCallResult> {
  const { domain, service, serviceData, target, returnResponse } = options;
  const body: Record<string, unknown> = { ...(serviceData ?? {}) };
  if (target) body.target = target;

  const qs = returnResponse ? "?return_response" : "";
  const raw = await client.request<unknown>(
    `/api/services/${encodeURIComponent(domain)}/${encodeURIComponent(service)}${qs}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return { raw };
}

export function callDomainService(
  client: BaseClient,
  domain: string,
  service: string,
  data?: ServiceData,
  target?: ServiceTarget,
): Promise<ServiceCallResult> {
  return callService(client, {
    domain,
    service,
    serviceData: data,
    target,
  });
}
