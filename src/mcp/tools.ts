/**
 * First-class MCP tool descriptors for Home Assistant.
 * Wire these into any MCP server; hass-ts stays the typed core.
 */

import type { HassState } from "../types.js";
import type { ServiceCallResult } from "../logic/services.js";

/** Minimal surface needed by MCP handlers (satisfied by HassClient). */
export interface HassToolClient {
  states: {
    list: () => Promise<HassState[]>;
    get: (entityId: string) => Promise<HassState>;
    byDomain: (domain: string) => Promise<HassState[]>;
  };
  services: {
    call: (options: {
      domain: string;
      service: string;
      serviceData?: Record<string, unknown>;
    }) => Promise<ServiceCallResult>;
  };
  light: {
    turnOn: (
      entityId: string | string[],
      data?: { brightness_pct?: number },
    ) => Promise<ServiceCallResult>;
    turnOff: (entityId: string | string[]) => Promise<ServiceCallResult>;
    toggle: (entityId: string | string[]) => Promise<ServiceCallResult>;
  };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const HASS_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "ha_list_entities",
    description:
      "List Home Assistant entities, optionally filtered by domain (light, switch, sensor, …).",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Optional domain filter, e.g. light",
        },
      },
    },
  },
  {
    name: "ha_get_state",
    description: "Get the current state and attributes of one entity_id.",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: { type: "string", description: "e.g. light.kitchen" },
      },
      required: ["entity_id"],
    },
  },
  {
    name: "ha_call_service",
    description:
      "Call a Home Assistant service (domain + service + optional service_data).",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string" },
        service: { type: "string" },
        service_data: { type: "object" },
        entity_id: {
          type: "string",
          description: "Convenience: sets service_data.entity_id",
        },
      },
      required: ["domain", "service"],
    },
  },
  {
    name: "ha_light_control",
    description: "Turn on/off/toggle a light with optional brightness.",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: { type: "string" },
        action: { type: "string", enum: ["turn_on", "turn_off", "toggle"] },
        brightness_pct: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["entity_id", "action"],
    },
  },
];

export type McpToolHandlerResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

/**
 * Execute an MCP tool against a HassClient (or compatible) instance.
 * Wrap with your own permission / dry-run layer for agent safety.
 */
export async function handleHassMcpTool(
  client: HassToolClient,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolHandlerResult> {
  try {
    switch (name) {
      case "ha_list_entities": {
        const domain =
          typeof args.domain === "string" ? args.domain : undefined;
        const states = domain
          ? await client.states.byDomain(domain)
          : await client.states.list();
        const summary = states.map((s) => ({
          entity_id: s.entity_id,
          state: s.state,
          friendly_name: s.attributes?.friendly_name,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      }
      case "ha_get_state": {
        const entityId = String(args.entity_id ?? "");
        const state = await client.states.get(entityId);
        return {
          content: [{ type: "text", text: JSON.stringify(state, null, 2) }],
        };
      }
      case "ha_call_service": {
        const domain = String(args.domain ?? "");
        const service = String(args.service ?? "");
        const serviceData: Record<string, unknown> = {
          ...((args.service_data as Record<string, unknown>) ?? {}),
        };
        if (args.entity_id) serviceData.entity_id = args.entity_id;
        const result = await client.services.call({
          domain,
          service,
          serviceData,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.raw ?? { ok: true }),
            },
          ],
        };
      }
      case "ha_light_control": {
        const entityId = String(args.entity_id ?? "");
        const action = String(args.action ?? "toggle");
        if (action === "turn_on") {
          const pct =
            typeof args.brightness_pct === "number"
              ? args.brightness_pct
              : undefined;
          await client.light.turnOn(
            entityId,
            pct != null ? { brightness_pct: pct } : undefined,
          );
        } else if (action === "turn_off") {
          await client.light.turnOff(entityId);
        } else {
          await client.light.toggle(entityId);
        }
        const state = await client.states.get(entityId);
        return {
          content: [{ type: "text", text: JSON.stringify(state, null, 2) }],
        };
      }
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (e) {
    return {
      content: [
        {
          type: "text",
          text: e instanceof Error ? e.message : String(e),
        },
      ],
      isError: true,
    };
  }
}
