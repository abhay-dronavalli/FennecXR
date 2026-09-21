# Model acquisition log

Use this file to record where each GLB came from, its exact license, download
date, optimization command, original size, and optimized size. Do not scrape a
model or infer a license.

Recommended optimization command:

```sh
npx @gltf-transform/cli optimize input.glb public/models/output.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
```

| Artifact | Source | License | Scanner | Original | Optimized | Status |
|---|---|---|---|---:|---:|---|
| Batch supplied locally | Tanit XR / Sketchfab | Per-record verification underway | Tanit XR volunteers | 56.6 MB | 7.1 MB | 16 unique scans integrated |
| Corinthian Capital | https://skfb.ly/pIxPR | CC BY-NC-SA (version to verify) | Scaniverse capture; Daniel Gómez game-ready optimization | 2.65 MB | 0.44 MB | Integrated |

## 2026-09-21 additions

Three authorized Sketchfab GLB downloads: Punic stela, Roman column base, and
traditional loom, all by Tanit XR under CC BY-NC-SA 4.0. Source URLs, sizes,
modifications, attribution, and license links are recorded in
`public/models/ATTRIBUTION.md`. Originals remain in ignored `incoming-models/`.

Further authorized downloads: Tanit stela, Sidi Sahbi tilework, and Zaghouan relief; all Tanit XR / CC BY-NC-SA 4.0. Full provenance and processing are in `public/models/ATTRIBUTION.md`.
