/*
 * STEP 2 — Turn UIDs into models.json.
 *
 * Usage:
 *   node fetch_models.mjs
 *
 * Expects uids.json in the same folder: ["27c2c2c4...", "ad59dd38...", ...]
 * Writes models.json. No API key needed. Verified working against the live API.
 *
 * Commit models.json. After this you never touch the network during the demo.
 */

import { readFile, writeFile } from "node:fs/promises";

const uids = JSON.parse(await readFile("uids.json", "utf8"));
console.log(`Fetching ${uids.length} models...`);

const out = [];
const failed = [];

for (const [i, uid] of uids.entries()) {
  try {
    const res = await fetch(`https://api.sketchfab.com/v3/models/${uid}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const m = await res.json();

    out.push({
      uid: m.uid,
      name: m.name,
      description: m.description ?? "",
      tags: m.tags ?? [],
      categories: m.categories ?? [],
      faceCount: m.faceCount,
      vertexCount: m.vertexCount,
      textureCount: m.textureCount,
      materialCount: m.materialCount,
      viewCount: m.viewCount,
      downloadCount: m.downloadCount,
      likeCount: m.likeCount,
      isDownloadable: m.isDownloadable,
      license: m.license?.label ?? null,
      licenseUrl: m.license?.url ?? null,
      createdAt: m.createdAt,
      publishedAt: m.publishedAt,
      updatedAt: m.updatedAt,
      uploader: m.user?.displayName ?? null,
      embedUrl: m.embedUrl,
      viewerUrl: m.viewerUrl,
      thumbnail:
        m.thumbnails?.images?.find((t) => t.width === 720)?.url ??
        m.thumbnails?.images?.[0]?.url ??
        null,
    });

    console.log(`  ${i + 1}/${uids.length}  ${m.name}`);
  } catch (err) {
    failed.push({ uid, error: String(err) });
    console.warn(`  ${i + 1}/${uids.length}  FAILED ${uid}: ${err}`);
  }

  await new Promise((r) => setTimeout(r, 120)); // be polite
}

await writeFile("models.json", JSON.stringify(out, null, 2));
console.log(`\nWrote models.json with ${out.length} models.`);
if (failed.length) console.log(`${failed.length} failed:`, failed);

// --- Quick stats you will want for your Devpost problem statement ---
const noTags = out.filter((m) => m.tags.length === 0).length;
const noCats = out.filter((m) => m.categories.length === 0).length;
const noDesc = out.filter((m) => m.description.trim().length < 40).length;
const uploaders = [...new Set(out.map((m) => m.uploader))];

console.log(`
--- COLLECTION AUDIT ---
Total models:            ${out.length}
Missing tags:            ${noTags}  (${Math.round((noTags / out.length) * 100)}%)
Missing categories:      ${noCats}  (${Math.round((noCats / out.length) * 100)}%)
Thin/no description:     ${noDesc}
Distinct uploaders:      ${uploaders.length}  ${JSON.stringify(uploaders)}
`);

// --- Likely duplicates: near-identical names or identical geometry ---
const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(copy|opt|otp)$/g, "");

const byGeom = new Map();
for (const m of out) {
  const k = `${m.faceCount}:${m.vertexCount}`;
  byGeom.set(k, [...(byGeom.get(k) ?? []), m.name]);
}
const geomDupes = [...byGeom.entries()].filter(([, v]) => v.length > 1);

const byName = new Map();
for (const m of out) {
  const k = norm(m.name);
  byName.set(k, [...(byName.get(k) ?? []), m.name]);
}
const nameDupes = [...byName.entries()].filter(([, v]) => v.length > 1);

console.log("Identical geometry (likely dupes):", geomDupes);
console.log("Near-identical names (likely dupes):", nameDupes);
