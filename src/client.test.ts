import { beforeEach, describe, expect, it, vi } from "vitest";
import { HassClient, ApiError, generateEntityTypes } from "./index.js";
import type { HassState } from "./types.js";

const base = { baseUrl: "http://ha.test:8123", token: "test-token" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HassClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires baseUrl and token", () => {
    expect(() => new HassClient({ baseUrl: "", token: "x" })).toThrow(
      /baseUrl/,
    );
    expect(() => new HassClient({ baseUrl: "http://x", token: "" })).toThrow(
      /token/,
    );
  });

  it("lists states with bearer auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          entity_id: "light.kitchen",
          state: "on",
          attributes: { friendly_name: "Kitchen" },
          last_changed: "2026-01-01T00:00:00Z",
          last_updated: "2026-01-01T00:00:00Z",
          context: { id: "1", parent_id: null, user_id: null },
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HassClient(base);
    const states = await client.states.list();
    expect(states[0].entity_id).toBe("light.kitchen");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://ha.test:8123/api/states",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("turns on a light via service call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HassClient(base);
    await client.light.turnOn("light.kitchen", { brightness_pct: 40 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://ha.test:8123/api/services/light/turn_on",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({
      entity_id: "light.kitchen",
      brightness_pct: 40,
    });
  });

  it("retries on 5xx then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }))
      .mockResolvedValueOnce(jsonResponse({ message: "API running." }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HassClient({ ...base, maxRetries: 1 });
    const status = await client.status();
    expect(status.message).toBe("API running.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws ApiError on 4xx without retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("unauthorized", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HassClient(base);
    await expect(client.states.get("light.x")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("filters states by domain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          mockState("light.a", "on"),
          mockState("switch.b", "off"),
          mockState("light.c", "off"),
        ]),
      ),
    );
    const client = new HassClient(base);
    const lights = await client.states.byDomain("light");
    expect(lights.map((s) => s.entity_id)).toEqual(["light.a", "light.c"]);
  });
});

describe("generateEntityTypes", () => {
  it("emits entity id union and domain groups", () => {
    const code = generateEntityTypes([
      mockState("light.kitchen", "on", "Kitchen"),
      mockState("switch.porch", "off", "Porch"),
      mockState("sensor.temp", "21.5", "Temp"),
    ]);
    expect(code).toContain('"light.kitchen"');
    expect(code).toContain("export type LightEntityId");
    expect(code).toContain("export type SwitchEntityId");
    expect(code).toContain("FRIENDLY_NAMES");
    expect(code).toContain("Kitchen");
    expect(code).toContain("isEntityId");
  });

  it("handles empty state list", () => {
    const code = generateEntityTypes([]);
    expect(code).toContain("export type EntityId = string");
    expect(code).toContain("ENTITY_COUNT = 0");
  });
});

function mockState(
  entity_id: string,
  state: string,
  friendly_name?: string,
): HassState {
  return {
    entity_id,
    state,
    attributes: friendly_name ? { friendly_name } : {},
    last_changed: "2026-01-01T00:00:00.000Z",
    last_updated: "2026-01-01T00:00:00.000Z",
    context: { id: "c1", parent_id: null, user_id: null },
  };
}
