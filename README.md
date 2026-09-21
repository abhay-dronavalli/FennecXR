# Carthage Underfoot

A walkable, low-poly landscape that returns Tanit XR photogrammetry scans to a
spatial story while keeping documented objects distinct from interpretation.

## What it is

Carthage Underfoot is made for high-school and early university learners. Its
goal is to connect scanned fragments with named places and with the preservation
work behind the Tanit XR archive.

The current local build contains 21 Carthage archive records consolidated into
a Roman temple precinct and an archaeology court, plus a separate Tunisia
Details mosque and an expanded walled heritage garden. Twenty-two downloaded scans are integrated; records whose GLBs
have not been supplied remain visible as faceted stone proxies.

## How to use it

- Select **Enter the landscape** to opt into mouse look.
- Use `WASD` or the arrow keys to move. Hold `Shift` to move faster.
- Walk near an object and press `E` to open its record.
- Use the **Time of day** control or press `T` to cycle through dawn, day, dusk, and night.
- Press `Esc` to close a record or release the mouse.

## What is real and what is not

The archive objects are photogrammetry scans supplied through Tanit XR. The
terrain, walls, columns, vegetation, plinths, and artifact arrangement are
modern interpretations with locally generated material textures. A textured
surface alone does not identify a scan. Fragments are set into deliberately simplified
forum, villa, baths, and prayer-courtyard frames so their architectural role is
legible. These always-visible frames are not measured reconstructions.

Kairouan, Tunis, and Zaghouan material appears in a separate study court
and is labeled with its real source place; it is not presented as having been
found at Carthage. The in-world labels also identify architectural studies as
interpretive.

## Models and credits

3D scans by Tanit XR volunteers: <https://tanitxr.org>

Sixteen unique GLBs supplied for the event were optimized locally to WebP and
meshopt, reducing the browser payload from 56.6 MB to 7.1 MB. Exact individual
scanner names, original URLs, and license versions remain marked for verification
in `public/content.json`; the interface does not invent missing credits.

The Corinthian capital is credited to Tanit XR, captured with Scaniverse, with
game-ready optimization by Daniel Gómez. Its Sketchfab record lists a Creative
Commons Attribution-NonCommercial-ShareAlike license.

## Sources

- [Tanit XR archive](https://tanitxr.org/archive/)
- [Corinthian Capital — Tanit XR](https://tanitxr.org/archive/corinthian-capital-byrsa-hill-carthage/)
- [Archaeological Site of Carthage — UNESCO](https://whc.unesco.org/en/list/37)
- [Kairouan — UNESCO](https://whc.unesco.org/en/list/499)
- [Antonine Baths — Tunisia heritage agency](https://www.patrimoinedetunisie.com.tn/en/monuments/the-antoninian-baths/overview/)

## Setup

```sh
npm install
npm run dev
```

Production check:

```sh
npm run build
npm run preview
```

Optional guide environment variables:

```text
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

Never commit API keys. The guide is intentionally deferred until the grounded
text path is complete; synthetic speech is a later enhancement.

## Architectural material study

The prayer court uses a three-stage square minaret and a small dome inspired
by Kairouan, masonry horseshoe arches, limewashed walls, flagstone paving,
muted green roof tiles, and restrained blue ceramic accents. The Roman frame
has a pitched terracotta-colored roof, dentils, and a separate limestone palette.
Neither building is a measured reconstruction. The green tiles, decorative
bands, planters, lighting, and landscaping are design choices for this composite
study, not claims about the original settings of the scans. In particular, the
court combines objects from distinct places and historical periods.

Reference: [UNESCO's description of Kairouan](https://whc.unesco.org/en/list/499/)
documents the flagstone courtyard, porticoes, and massive three-storey square
minaret. No invented calligraphy or purported historic motifs have been added.

The material maps in `src/world/materials.js` are deterministic procedural
textures with separate color and relief data, mipmaps, and physical-scale UVs
on architectural boxes. They require no external texture downloads. Use the
Roman precinct, Tunisian court, and Overview buttons to inspect the composition;
walking from Overview returns to the courtyard approach.

## Walled garden expansion

A 48 by 60 metre enclosure now contains the developed landscape. Its hewn-stone
walls, rounded crenellations, rectangular towers, and interior arch rhythm are
inspired by Sousse, following [Museum With No Frontiers' rampart description](https://islamicart.museumwnf.org/database_item.php?id=monuments;ISL;tn;Mon01;23;en).
This is a contemporary interpretive heritage garden, not a reconstruction of
Sousse, Carthage, or a historical combination of their buildings. The closed
wooden gate marks the world limit. Paved perimeter paths, garden beds, benches,
and a timber craft shelter provide a continuous setting.

The visible enclosure and player collision limits share `worldLayout.js`;
players stop at the inner wall faces and tower footprints. The elevated overview
is for viewing only. Movement returns to the approach path. Temple steps and
courtyard paving are accounted for in the walking height.

Three additional Tanit XR scans were downloaded through Sketchfab and optimized:
a Punic stela from the Tophet, a Roman column base from Byrsa Hill, and a
traditional loom from the Medina of Tunis. Their records, source locations,
license links, and display placements are included in the collection guide.
See [model attribution and processing details](public/models/ATTRIBUTION.md).
These three assets and their adaptations are CC BY-NC-SA 4.0; noncommercial
and share-alike restrictions apply to their reuse.

The duplicate prayer-hall lantern row has been removed; the portico owns the
single row of three hanging lamps.

Boundary regression checks: `node --test scripts/world-layout.test.mjs`.

The Roman base now supports the front temple pillar beneath its existing capital.
The shaft is interpretive; the two scans are not asserted to be an ancient matching pair.
Three further Tanit XR scans occupy existing spaces: a Tanit stela, a Sidi Sahbi
tilework panel, and a Zaghouan architectural relief. No new area was required.

## Scaling the artifact collection

Run `npm run models:lod` after adding or replacing a local model. It generates
256px textured distant meshes in `public/models/lod/`, records source bounds
for stable alignment, and writes `docs/model-performance.json`. Commit those
assets and the updated content manifest together.

The world starts with distant models and requests full scans within 18 world
units; it returns to distant meshes beyond 24 units to avoid repeated swaps.
The low mesh remains visible while the full scan loads. The guide uses distant
previews; the dedicated artifact viewer always uses full detail.

Static shadow maps refresh only on lighting or model changes. Render resolution
adapts between 0.75 and 1.5 DPR (capped by device DPR). Inspection checks run at
10 Hz, and model-distance checks at 4 Hz. This scene has no animated shadow casters;
future animated geometry must explicitly invalidate shadows or enable updates.

Current distant collection: 4.13 MB / 194,823 triangles, compared with 10.16 MB /
484,036 triangles at full detail (about 59% less in each). These are asset totals,
not a measured FPS improvement; nearby scenes render a mixture of both levels.
Loaded GLTFs remain cached for quick return visits, so this does not bound memory
after exploring every artifact. For a much larger archive, the next step is
zone streaming with reference-counted cache eviction, including guide/viewer use.

Checks: `node --test scripts/model-detail.test.mjs scripts/world-layout.test.mjs`.
