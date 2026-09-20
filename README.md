# Ifriqiya

**Walk the places where Tunisia's heritage was scanned.**

A browser-based walkable 3D world built on TanitXR's photogrammetry collection.
A visitor walks through northeast Tunisia, stands in front of real scans in the
places they were found, and reads what TanitXR has actually documented about
them. No login, no install, no headset.

Built at CityCamp Gainesville 2026.

---

## The problem

TanitXR's scans live on Sketchfab, each one alone on a grey turntable. You see
a column, but not the hilltop it came from, not the six other things recovered
twenty metres away, and not the fact that a volunteer physically went there. **A
scan preserves the form of an object and destroys its context.** Ifriqiya gives
the collection its geography back.

## What we found in the data

We fetched all 99 records from the Sketchfab API and audited them. The
collection has real, specific problems, and the app surfaces every one of them
rather than papering over them:

| Finding | Count |
| --- | --- |
| Records with an empty `tags` array | 99 of 99 |
| Records with an empty `categories` array | 78 |
| Records with no description, or under 40 characters | 31 |
| Names truncated at 48 characters **at source**, ending mid-word | 13 |
| Records sharing a normalised name with another, at a different triangle count | 62 |
| Records with byte-identical triangle *and* vertex counts to another | 4 |
| Records naming no site in either name or description | 15 |

Nothing in the collection is filterable or discoverable at source. You cannot
ask Sketchfab for "everything from Byrsa Hill" or "every mosaic".

The most consequential gap is subtler than duplication: **nothing in the
metadata distinguishes a second version of an object from a second object.**
Some same-name pairs are clearly lower-poly variants marked `- OPT`; but eight
separate records are all called "Punic Stelae – Tophet of Salammbo", and those
look like genuinely different stones filed under one name. We flag both cases
and merge neither.

## What is documented vs. what is our arrangement

This distinction is load-bearing, and the app states it in the About panel:

- **Every word of history shown is verbatim** from TanitXR's own model
  descriptions. Nothing is summarised, paraphrased, embellished or invented.
  Where a description is missing, the app says *"Not yet documented"* and links
  to the TanitXR volunteer form instead of filling the gap.
- **The geography is ours.** Each object's zone was derived by matching its
  name, then its description's `Location:` line, against site names. Every
  examine panel prints the exact evidence used, so the arrangement is auditable
  object by object.

## Geography

Zone positions come from the real latitude and longitude of each site under a
uniform kilometre projection, so **relative bearings are real**: Carthage is
northeast of Tunis, Zaghouan south-southwest, Nabeul east-southeast.

**Distances are compressed for walking. This is a schematic, not a survey.**
Carthage and the Medina of Tunis are only ~14 km apart in reality and were
pushed apart *along their real bearing* to a walkable 100 units.

Kairouan is included because scans document it, even though it lies outside the
northeast region the map otherwise covers.

Records that name no site stand in a **"Not Yet Located"** pavilion. That
pavilion is a feature: it is the visible edge of what the collection documents.

## Accessibility

- **Guided tour** — 12 stops, moves the camera itself, needs no mouse-look.
- **Full keyboard operation** — arrow keys walk *and turn*, so the entire world
  is navigable without a mouse and without Pointer Lock. `Enter` aliases `E`.
  Focus rings on every control. `Esc` always escapes, one layer at a time.
- **2D fallback** — a real HTML grid of all 99 models with headings, alt text,
  search and site filter. Reachable from the landing screen and from a
  persistent link in the world. Someone on a locked-down machine or a screen
  reader gets the entire collection's content with zero 3D.
- **Reduce-motion toggle** and a motion-sensitivity notice on the landing
  screen. Honours `prefers-reduced-motion` by default.

## Running it

```bash
npm install
npm run dev
```

### Adding real `.glb` models

The app runs fully with **zero** local models — every artifact falls back to a
framed thumbnail plus a Sketchfab embed. To add real geometry:

1. Drop `.glb` files into `public/models/`, named by Sketchfab UID
   (`68c6ea8d2ae9486a9ef593e91c1307dd.glb`).
2. Run `npm run manifest` (or just `npm run dev` / `npm run build`, which run
   it first).

`scripts/build-manifest.mjs` scans the directory, writes
`public/models/manifest.json`, and warns if the total payload exceeds the 40 MB
budget. **No code change is needed to add a model.** Models are auto-fitted to
the plinths by `fitToBox`; the `OVERRIDES` map in `src/data.ts` exists for the
handful that import lying on their side.

### Refreshing the collection

`node fetch_models.mjs` re-fetches every UID in `uids.json` from the public
Sketchfab API and rewrites `models.json`. No API key needed.

## Stack

Vite · React · TypeScript · three.js via @react-three/fiber · @react-three/drei.
No state library, no CSS framework, no backend, no database.

## Credits

All 3D models © **TanitXR**, licensed **CC-BY 4.0**, each one individually
linked back to its Sketchfab page from inside the app.

[Volunteer with TanitXR](https://docs.google.com/forms/d/e/1FAIpQLSegO7smO5VyQSpSSaamKni4RPD4q_yDytd5TCK3jOH6LTML6w/viewform)

## Known limitations

Stated plainly, because they are real:

- Distances between sites are compressed; only bearings are faithful.
- 15 models are unplaced because their records name no site. We did not guess.
- Duplicates and same-name variants are flagged, not merged, because the
  metadata does not support telling them apart.
- There is no collision. You can walk through a column.
- Zone architecture is suggested with primitives, not modelled.

## What happens after Hack Day

- Export the zone assignments and object types back to Sketchfab as real tags,
  so the collection becomes searchable at source and this app stops being the
  only index.
- Re-run the collection fetch on a schedule so new scans appear automatically.
- Let a volunteer claim an undocumented object and write its record, turning
  the 31 empty descriptions into a work queue.
