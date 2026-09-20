/*
 * Scans public/models/ for .glb files and writes public/models/manifest.json.
 *
 * Run it after dropping new downloads in; `npm run dev` and `npm run build`
 * both run it first, so adding a model never needs a code change.
 */
import { readdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DIR = "public/models";
const BUDGET_MB = 40;

let files = [];
try {
  files = await readdir(DIR);
} catch {
  console.log(`${DIR} does not exist yet; writing an empty manifest.`);
}

const uids = [];
let bytes = 0;
for (const f of files) {
  if (!f.toLowerCase().endsWith(".glb")) continue;
  const uid = f.slice(0, -4);
  if (!/^[0-9a-f]{32}$/i.test(uid)) {
    console.warn(`  skipping ${f}: filename is not a 32-char Sketchfab UID`);
    continue;
  }
  const { size } = await stat(join(DIR, f));
  bytes += size;
  uids.push(uid.toLowerCase());
}

await writeFile(join(DIR, "manifest.json"), JSON.stringify(uids, null, 2) + "\n");

const mb = bytes / 1024 / 1024;
console.log(`manifest.json: ${uids.length} local models, ${mb.toFixed(1)} MB`);
if (mb > BUDGET_MB) {
  console.warn(
    `  WARNING: over the ${BUDGET_MB} MB payload budget. Remove the largest ` +
      `.glb files rather than compressing on the fly.`
  );
}
