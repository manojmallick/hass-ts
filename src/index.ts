import { BaseClient, type ClientOptions } from "./client.js";
import { getApiStatus, getConfig } from "./logic/config.js";
import {
  createClimateApi,
  createCoverApi,
  createInputBooleanApi,
  createLightApi,
  createSceneApi,
  createScriptApi,
  createSensorApi,
  createSwitchApi,
} from "./logic/domains.js";
import { callService } from "./logic/services.js";
import {
  getState,
  getStates,
  listByDomain,
  setState,
} from "./logic/states.js";

export { ApiError, HassError } from "./errors.js";
export { BaseClient, type ClientOptions } from "./client.js";
export {
  domainOf,
  isEntityId,
  type CallServiceOptions,
  type ClimateAttributes,
  type EntityId,
  type HassConfig,
  type HassContext,
  type HassDomain,
  type HassState,
  type LightAttributes,
  type SensorAttributes,
  type ServiceData,
  type ServiceTarget,
} from "./types.js";
export { generateEntityTypes, parseStatesJson } from "./codegen/generate.js";
export {
  HASS_MCP_TOOLS,
  handleHassMcpTool,
  type HassToolClient,
  type McpToolDefinition,
  type McpToolHandlerResult,
} from "./mcp/tools.js";

/**
 * Fully typed Home Assistant client.
 *
 * ```ts
 * const ha = new HassClient({
 *   baseUrl: process.env.HASS_URL!,
 *   token: process.env.HASS_TOKEN!,
 * });
 * await ha.light.turnOn("light.kitchen", { brightness_pct: 40 });
 * ```
 *
 * Pair with codegen for instance-specific entity id unions:
 * `npx hass-ts codegen --url … --token … -o src/ha-entities.ts`
 */
export class HassClient extends BaseClient {
  constructor(options: ClientOptions) {
    super(options);
  }

  /** GET /api/ */
  status = () => getApiStatus(this);

  /** GET /api/config */
  config = () => getConfig(this);

  states = {
    list: () => getStates(this),
    get: (entityId: string) => getState(this, entityId),
    set: (
      entityId: string,
      state: string,
      attributes?: Record<string, unknown>,
    ) => setState(this, entityId, state, attributes),
    byDomain: (domain: string) => listByDomain(this, domain),
  };

  services = {
    call: (
      ...args: Parameters<typeof callService> extends [unknown, ...infer R]
        ? R
        : never
    ) => callService(this, ...args),
  };

  light = createLightApi(this);
  switch = createSwitchApi(this);
  climate = createClimateApi(this);
  sensor = createSensorApi(this);
  cover = createCoverApi(this);
  scene = createSceneApi(this);
  script = createScriptApi(this);
  inputBoolean = createInputBooleanApi(this);
}

/** @deprecated Use HassClient — kept for scaffold template compatibility */
export class ApiClient extends HassClient {}
