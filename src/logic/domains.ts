import type { BaseClient } from "../client.js";
import type {
  ClimateAttributes,
  HassState,
  LightAttributes,
  SensorAttributes,
} from "../types.js";
import { getState, listByDomain } from "./states.js";
import { callDomainService, type ServiceCallResult } from "./services.js";

/** Domain-scoped helpers with ergonomic methods */

export function createLightApi(client: BaseClient) {
  return {
    list: (): Promise<HassState<LightAttributes>[]> =>
      listByDomain(client, "light") as Promise<HassState<LightAttributes>[]>,
    get: (entityId: string): Promise<HassState<LightAttributes>> =>
      getState(client, entityId) as Promise<HassState<LightAttributes>>,
    turnOn: (
      entityId: string | string[],
      data?: {
        brightness?: number;
        brightness_pct?: number;
        rgb_color?: [number, number, number];
        color_temp_kelvin?: number;
        effect?: string;
        transition?: number;
      },
    ): Promise<ServiceCallResult> =>
      callDomainService(client, "light", "turn_on", {
        entity_id: entityId,
        ...data,
      }),
    turnOff: (
      entityId: string | string[],
      data?: { transition?: number },
    ): Promise<ServiceCallResult> =>
      callDomainService(client, "light", "turn_off", {
        entity_id: entityId,
        ...data,
      }),
    toggle: (entityId: string | string[]): Promise<ServiceCallResult> =>
      callDomainService(client, "light", "toggle", { entity_id: entityId }),
  };
}

export function createSwitchApi(client: BaseClient) {
  return {
    list: () => listByDomain(client, "switch"),
    get: (entityId: string) => getState(client, entityId),
    turnOn: (entityId: string | string[]) =>
      callDomainService(client, "switch", "turn_on", { entity_id: entityId }),
    turnOff: (entityId: string | string[]) =>
      callDomainService(client, "switch", "turn_off", { entity_id: entityId }),
    toggle: (entityId: string | string[]) =>
      callDomainService(client, "switch", "toggle", { entity_id: entityId }),
  };
}

export function createClimateApi(client: BaseClient) {
  return {
    list: (): Promise<HassState<ClimateAttributes>[]> =>
      listByDomain(client, "climate") as Promise<
        HassState<ClimateAttributes>[]
      >,
    get: (entityId: string) =>
      getState(client, entityId) as Promise<HassState<ClimateAttributes>>,
    setTemperature: (
      entityId: string,
      temperature: number,
      hvacMode?: string,
    ) =>
      callDomainService(client, "climate", "set_temperature", {
        entity_id: entityId,
        temperature,
        ...(hvacMode ? { hvac_mode: hvacMode } : {}),
      }),
    setHvacMode: (entityId: string, hvacMode: string) =>
      callDomainService(client, "climate", "set_hvac_mode", {
        entity_id: entityId,
        hvac_mode: hvacMode,
      }),
  };
}

export function createSensorApi(client: BaseClient) {
  return {
    list: (): Promise<HassState<SensorAttributes>[]> =>
      listByDomain(client, "sensor") as Promise<HassState<SensorAttributes>[]>,
    get: (entityId: string) =>
      getState(client, entityId) as Promise<HassState<SensorAttributes>>,
    /** Numeric state when possible, else null */
    async number(entityId: string): Promise<number | null> {
      const s = await getState(client, entityId);
      const n = Number(s.state);
      return Number.isFinite(n) ? n : null;
    },
  };
}

export function createCoverApi(client: BaseClient) {
  return {
    list: () => listByDomain(client, "cover"),
    open: (entityId: string | string[]) =>
      callDomainService(client, "cover", "open_cover", { entity_id: entityId }),
    close: (entityId: string | string[]) =>
      callDomainService(client, "cover", "close_cover", {
        entity_id: entityId,
      }),
    stop: (entityId: string | string[]) =>
      callDomainService(client, "cover", "stop_cover", { entity_id: entityId }),
    setPosition: (entityId: string, position: number) =>
      callDomainService(client, "cover", "set_cover_position", {
        entity_id: entityId,
        position,
      }),
  };
}

export function createSceneApi(client: BaseClient) {
  return {
    list: () => listByDomain(client, "scene"),
    turnOn: (entityId: string | string[]) =>
      callDomainService(client, "scene", "turn_on", { entity_id: entityId }),
  };
}

export function createScriptApi(client: BaseClient) {
  return {
    list: () => listByDomain(client, "script"),
    turnOn: (entityId: string | string[], variables?: Record<string, unknown>) =>
      callDomainService(client, "script", "turn_on", {
        entity_id: entityId,
        ...variables,
      }),
  };
}

export function createInputBooleanApi(client: BaseClient) {
  return {
    list: () => listByDomain(client, "input_boolean"),
    turnOn: (entityId: string | string[]) =>
      callDomainService(client, "input_boolean", "turn_on", {
        entity_id: entityId,
      }),
    turnOff: (entityId: string | string[]) =>
      callDomainService(client, "input_boolean", "turn_off", {
        entity_id: entityId,
      }),
    toggle: (entityId: string | string[]) =>
      callDomainService(client, "input_boolean", "toggle", {
        entity_id: entityId,
      }),
  };
}
