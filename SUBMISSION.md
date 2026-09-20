# Devpost submission notes — Ifriqiya

**Track:** Technical

**Live URL:** _(fill in after deploy)_
**Repo:** _(fill in)_

---

## One sentence

A visitor walks through northeast Tunisia in their browser, stands in front of
real photogrammetry scans in the places they were found, and reads what TanitXR
has actually documented about them.

## Audience

Curious members of the public with no background in Tunisian history and no XR
equipment. They open a link on a laptop and within ten seconds they are
walking.

## The problem

TanitXR's scans live on Sketchfab, each one alone on a grey turntable. A
visitor sees a column. They have no idea where it is, what stood next to it,
what century it belongs to, or that six other things were scanned twenty metres
away. **A scan preserves the form of an object and destroys its context.** The
collection has no space and no adjacency. We gave it its geography back.

Standing on Byrsa Hill and seeing that the Togatus statue, the Corinthian
capital, the fluted column fragment and the inscribed architectural block were
all recovered from the same hilltop tells you something a grid of thumbnails
cannot.

## Meaningful use of TanitXR models

**All 99 models in the collection are reachable in the app** — in the 3D world
as physical objects on plinths, in the keyboard-navigable collection index, and
in the 2D accessible grid.

Every model carries a live Sketchfab embed in its examine panel, so the full
collection is explorable in 3D whether or not a local `.glb` is present. The
eight pre-optimised scans are the priority targets for local geometry:

| UID | Name | Triangles |
| --- | --- | --- |
| `68c6ea8d2ae9486a9ef593e91c1307dd` | Roman Column – Byrsa Hill, Carthage | 3,788 |
| `145f3450f32045738ca87b4e6aa57bdc` | Inscribed Architectural Fragment – Byrsa | 4,971 |
| `e489778b3a0e4ee89c4e2e22ab00b9f8` | Wooden Door with Tilework – Zawiya | 6,518 |
| `20742b5fe00c4cc8ad5667fd37416e67` | Male Torso Statue – Roman Villas | 6,705 |
| `6999dd0aa173410d8e7589a91bf8c986` | Roman Togatus Statue – Byrsa Hill | 13,944 |
| `7c07cf6096c24786b643cb44dee8fbae` | Draped Statue – Byrsa Hill | 16,154 |
| `c4e20003209a48d0a384d6eaf7e175cb` | Reclining Figure – Byrsa Hill | 22,586 |
| `e2d5952ce92440b6a9c3e23ec2ea075a` | Roman Draped Statue – Byrsa Hill | 29,395 |

Dropping any `.glb` into `public/models/` and running `npm run manifest`
promotes it from embed to walk-up geometry with **no code change**.

## What we found in the data

We fetched all 99 records from the public Sketchfab API and audited them:

- **99 of 99** carry an empty `tags` array. **78** carry an empty `categories`
  array. Nothing in the collection is filterable or discoverable at source.
- **31** records have no description or one under 40 characters.
- **13** model names are truncated at 48 characters *at source*, ending
  mid-word, which destroys the site name inside the cut.
- **62** records share a normalised name with another record at a different
  triangle count.
- **4** records have byte-identical triangle *and* vertex counts to another.
- **15** records name no site in either their name or their description.

The most consequential finding is subtler than duplication: **nothing in the
metadata distinguishes a second version of an object from a second object.**
Some same-name pairs are clearly lower-poly variants marked `- OPT`; but eight
separate records are all called "Punic Stelae – Tophet of Salammbo", and those
look like genuinely different stones filed under one name. We flag both cases
and merge neither, because the data does not support a merge.

The collection also has 9 distinct uploaders and one record typo'd `- OTP`
instead of `- OPT`.

## Ethics: what is documented vs. what is ours

- **Every word of history in the app is verbatim** from TanitXR's own model
  descriptions. Nothing is summarised, paraphrased, embellished or invented.
- Where a description is missing, the app says **"Not yet documented. This scan
  exists but its history has not been recorded."** and links the TanitXR
  volunteer form. That turns a gap in the data into a call to action.
- **The geography is our arrangement**, and it is auditable: every examine
  panel prints the exact evidence used to place that object, e.g. *"Placed here
  because description states 'Location: Water Temple, Zaghouan, Tunisia'."*

## Accessibility

- **Guided tour** — 12 stops, drives the camera itself, needs no mouse-look at
  all.
- **Full keyboard operation** — arrow keys walk *and turn*, so the whole world
  is navigable without a mouse and without Pointer Lock. `Enter` aliases `E`,
  focus rings throughout, and `Esc` always escapes one layer at a time.
- **2D fallback** — a real HTML grid of all 99 models with headings, alt text,
  search and site filter, reachable from the landing screen and from a
  persistent link inside the world.
- **Reduce-motion toggle** plus a motion notice; honours
  `prefers-reduced-motion` by default.

## Known limitations, stated plainly

- Distances between sites are compressed for walking. Only **bearings** are
  faithful — the app says so on the landing signpost, in the map overlay and in
  the About panel: *"This is a schematic, not a survey."*
- 15 models are unplaced because their records name no site. They stand in a
  "Not Yet Located" pavilion rather than being guessed into a zone.
- Kairouan sits outside the northeast region the map otherwise covers; it is
  included because scans document it, and it is labelled as an exception.
- Duplicates and same-name variants are flagged, not merged.
- No collision — you can walk through a column.
- Zone architecture is suggested with primitives, not modelled.

## Credits

All models © **TanitXR**, licensed **CC-BY 4.0**, each individually linked back
to its Sketchfab page and to the licence terms from inside the app.

## What happens after Hack Day

1. **Export the zone assignments and object types back to Sketchfab as real
   tags**, so the collection becomes searchable at source and this app stops
   being the only index.
2. **Auto-ingest** — re-run the collection fetch on a schedule so newly
   uploaded scans appear on the map with no code change.
3. **Claim an undocumented object** — let a volunteer take one of the 31 empty
   descriptions and write its record.
