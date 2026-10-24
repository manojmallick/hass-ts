# hass-ts

A TypeScript client and code-generation toolkit for Home Assistant. It provides typed helpers for common domains, instance-specific entity ID types, and descriptors for MCP tools.

## Develop

Requirements: Node.js and pnpm.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## Use the client

```ts
import { HassClient } from "hass-ts";

const ha = new HassClient({
  baseUrl: process.env.HASS_URL!,
  token: process.env.HASS_TOKEN!,
});

await ha.light.turnOn("light.kitchen", { brightness_pct: 40 });
const states = await ha.states.byDomain("switch");
```

## Generate entity types

Generate entity ID types from a saved state dump without connecting to Home Assistant:

```bash
pnpm build
node dist/cli.js codegen --from-file fixtures/sample-states.json -o src/ha-entities.ts
```

To use a live instance, pass its base URL and long-lived access token with `--url` and `--token`. Keep tokens in environment variables and out of source control.

## MCP tools

`HASS_MCP_TOOLS` and `handleHassMcpTool` expose Home Assistant operations for an MCP server. Review and constrain tools before enabling live access. The related [HomeMCP Gateway](https://github.com/manojmallick/homemcp-gateway) adds per-entity policy and dry-run behavior.

## License

Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). This source-available license restricts commercial use; it is not an OSI-approved open-source license. See the license for terms and exceptions. Third-party dependencies retain their own licenses.
