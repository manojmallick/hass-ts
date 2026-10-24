# hass-ts logic

Domain APIs and REST helpers for Home Assistant.

| Module | Role |
|--------|------|
| `states.ts` | `/api/states` list/get/set + domain filter |
| `services.ts` | `/api/services/{domain}/{service}` |
| `config.ts` | `/api/` + `/api/config` |
| `domains.ts` | Ergonomic `light`, `switch`, `climate`, … |

Codegen lives in `src/codegen/`. MCP tool surface in `src/mcp/`.
