/**
 * hass-ts CLI
 *
 *   hass-ts codegen --url $HA_URL --token $HA_TOKEN -o ./src/ha-entities.ts
 *   hass-ts codegen --from-file ./states.json -o ./src/ha-entities.ts
 *   hass-ts ping --url $HA_URL --token $HA_TOKEN
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { HassClient } from "./index.js";
import { generateEntityTypes, parseStatesJson } from "./codegen/generate.js";

function usage(): never {
  console.log(`hass-ts — typed Home Assistant SDK

Usage:
  hass-ts codegen --url <ha-url> --token <token> [-o entities.ts]
  hass-ts codegen --from-file <states.json> [-o entities.ts]
  hass-ts ping --url <ha-url> --token <token>
  hass-ts help

Env defaults:
  HASS_URL / HA_URL
  HASS_TOKEN / HA_TOKEN
`);
  process.exit(1);
}

function arg(flag: string, argv: string[]): string | undefined {
  const i = argv.indexOf(flag);
  if (i === -1) return undefined;
  return argv[i + 1];
}

function has(flag: string, argv: string[]): boolean {
  return argv.includes(flag);
}

function envUrl(): string | undefined {
  return process.env.HASS_URL || process.env.HA_URL;
}

function envToken(): string | undefined {
  return process.env.HASS_TOKEN || process.env.HA_TOKEN;
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    usage();
  }

  if (cmd === "ping") {
    const url = arg("--url", argv) ?? envUrl();
    const token = arg("--token", argv) ?? envToken();
    if (!url || !token) {
      console.error("ping requires --url and --token (or HASS_URL / HASS_TOKEN)");
      process.exit(1);
    }
    const client = new HassClient({ baseUrl: url, token });
    const status = await client.status();
    const config = await client.config();
    console.log(JSON.stringify({ status, version: config.version, name: config.location_name }, null, 2));
    return;
  }

  if (cmd === "codegen") {
    const out = arg("-o", argv) ?? arg("--out", argv) ?? "ha-entities.ts";
    const fromFile = arg("--from-file", argv) ?? arg("--file", argv);
    let states;
    let source: string;

    if (fromFile) {
      const raw = readFileSync(resolve(fromFile), "utf8");
      states = parseStatesJson(raw);
      source = `file:${fromFile}`;
    } else {
      const url = arg("--url", argv) ?? envUrl();
      const token = arg("--token", argv) ?? envToken();
      if (!url || !token) {
        console.error(
          "codegen requires --url/--token or --from-file (or HASS_URL / HASS_TOKEN)",
        );
        process.exit(1);
      }
      const client = new HassClient({ baseUrl: url, token });
      states = await client.states.list();
      source = `${url}/api/states`;
    }

    const code = generateEntityTypes(states, { source });
    const outPath = resolve(out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, code, "utf8");
    console.log(
      `Wrote ${states.length} entities → ${outPath}${has("--stdout", argv) ? "" : ""}`,
    );
    if (has("--stdout", argv)) {
      process.stdout.write(code);
    }
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
