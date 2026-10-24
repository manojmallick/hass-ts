import { describe, expect, it } from "vitest";
import { generateEntityTypes, parseStatesJson } from "./generate.js";

describe("parseStatesJson", () => {
  it("parses array JSON", () => {
    const states = parseStatesJson(
      JSON.stringify([
        {
          entity_id: "light.a",
          state: "on",
          attributes: {},
          last_changed: "",
          last_updated: "",
          context: { id: "1", parent_id: null, user_id: null },
        },
      ]),
    );
    expect(states).toHaveLength(1);
  });

  it("rejects non-array", () => {
    expect(() => parseStatesJson("{}")).toThrow(/array/);
  });
});

describe("generateEntityTypes formatting", () => {
  it("dedupes entity ids", () => {
    const state = {
      entity_id: "light.a",
      state: "on",
      attributes: {},
      last_changed: "",
      last_updated: "",
      context: { id: "1", parent_id: null, user_id: null },
    };
    const code = generateEntityTypes([state, state]);
    expect(code.match(/"light\.a"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(code).toContain("ENTITY_COUNT = 1");
  });
});
