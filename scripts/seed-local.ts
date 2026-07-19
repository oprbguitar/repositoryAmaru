import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const pnpmCli = path.join(
  process.env.APPDATA ?? "",
  "npm",
  "node_modules",
  "pnpm",
  "bin",
  "pnpm.cjs",
);
const executable = process.platform === "win32" ? process.execPath : "pnpm";
const sql =
  "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('seed_status', 'ready-no-demo-data', CURRENT_TIMESTAMP);";
const result = spawnSync(
  executable,
  [
    ...(process.platform === "win32" ? [pnpmCli] : []),
    "wrangler",
    "d1",
    "execute",
    "DB",
    "--local",
    "--persist-to",
    ".wrangler/state",
    "--command",
    sql,
  ],
  { stdio: "inherit", windowsHide: true },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Base local preparada sin datos ficticios.");
