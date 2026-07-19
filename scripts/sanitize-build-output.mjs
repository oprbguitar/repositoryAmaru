import { readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const outputRoot = path.resolve(projectRoot, "dist");

if (
  outputRoot === projectRoot ||
  !outputRoot.startsWith(`${projectRoot}${path.sep}`)
) {
  throw new Error("Unsafe build output path.");
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function secretValues(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/))
    .filter(Boolean)
    .filter(
      ([_, name, value]) =>
        /(?:API_KEY|TOKEN|SECRET|ENCRYPTION_KEY)$/.test(name) &&
        value.length >= 8,
    )
    .map(([_, __, value]) => value);
}

const localVarsPath = path.join(projectRoot, ".dev.vars");
const localVars = await readFile(localVarsPath, "utf8").catch(() => "");
const secrets = secretValues(localVars);
let removed = 0;

for (const file of await filesUnder(outputRoot)) {
  if (path.basename(file) === ".dev.vars") {
    const resolved = path.resolve(file);
    if (!resolved.startsWith(`${outputRoot}${path.sep}`))
      throw new Error("Refusing to remove a file outside dist.");
    await rm(resolved);
    removed += 1;
  }
}

for (const file of await filesUnder(outputRoot)) {
  if ((await stat(file)).size > 8_000_000) continue;
  const content = await readFile(file, "utf8").catch(() => "");
  if (secrets.some((secret) => content.includes(secret)))
    throw new Error("A local secret remains in the production build output.");
}

console.log(
  `Build secret audit passed; removed ${removed} local preview file(s).`,
);
