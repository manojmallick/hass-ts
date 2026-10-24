/** Core Home Assistant REST shapes used by hass-ts. */

export type HassDomain =
  | "light"
  | "switch"
  | "climate"
  | "sensor"
  | "binary_sensor"
  | "cover"
  | "media_player"
  | "fan"
  | "lock"
  | "input_boolean"
  | "input_number"
  | "input_select"
  | "input_text"
  | "scene"
  | "script"
  | "automation"
  | "person"
  | "device_tracker"
  | "weather"
  | "sun"
  | "zone"
  | "button"
  | "number"
  | "select"
  | "vacuum"
  | "camera"
  | "alarm_control_panel"
  | (string & {});

export interface HassContext {
  id: string;
  parent_id: string | null;
  user_id: string | null;
}

export interface HassState<
  TAttrs extends Record<string, unknown> = Record<string, unknown>,
> {
  entity_id: string;
  state: string;
  attributes: TAttrs;
  last_changed: string;
  last_updated: string;
  context: HassContext;
}

export interface HassConfig {
  location_name: string;
  time_zone: string;
  version: string;
  unit_system: {
    length: string;
    mass: string;
    temperature: string;
    volume: string;
  };
  components: string[];
  config_dir: string;
  whitelist_external_dirs: string[];
  allowlist_external_dirs: string[];
  latitude: number;
  longitude: number;
  elevation: number;
  state: string;
  external_url: string | null;
  internal_url: string | null;
  currency: string;
  country: string | null;
  language: string;
}

export interface ServiceTarget {
  entity_id?: string | string[];
  device_id?: string | string[];
  area_id?: string | string[];
}

export type ServiceData = Record<string, unknown> & {
  entity_id?: string | string[];
};

export interface CallServiceOptions {
  domain: string;
  service: string;
  serviceData?: ServiceData;
  target?: ServiceTarget;
  returnResponse?: boolean;
}

export interface LightAttributes {
  friendly_name?: string;
  brightness?: number;
  color_mode?: string;
  supported_color_modes?: string[];
  rgb_color?: [number, number, number];
  color_temp_kelvin?: number;
  min_color_temp_kelvin?: number;
  max_color_temp_kelvin?: number;
  effect?: string;
  effect_list?: string[];
  [key: string]: unknown;
}

export interface ClimateAttributes {
  friendly_name?: string;
  temperature?: number;
  current_temperature?: number;
  hvac_modes?: string[];
  hvac_action?: string;
  min_temp?: number;
  max_temp?: number;
  target_temp_high?: number;
  target_temp_low?: number;
  [key: string]: unknown;
}

export interface SensorAttributes {
  friendly_name?: string;
  unit_of_measurement?: string;
  device_class?: string;
  state_class?: string;
  [key: string]: unknown;
}

/** Default entity id type — replace via codegen with your instance's union */
export type EntityId = string;

export function domainOf(entityId: string): string {
  const i = entityId.indexOf(".");
  return i === -1 ? entityId : entityId.slice(0, i);
}

export function isEntityId(value: string): boolean {
  return /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(value);
}
