# Carthage Underfoot

A walkable, low-poly landscape that returns Tanit XR photogrammetry scans to a
spatial story while keeping documented objects distinct from interpretation.

## What it is

Carthage Underfoot is made for high-school and early university learners. Its
goal is to connect scanned fragments with named places and with the preservation
work behind the Tanit XR archive.

The current local build contains 21 Carthage archive records consolidated into
a Roman temple precinct and an archaeology court, plus a separate Tunisia
Details mosque. Sixteen downloaded scans are integrated; records whose GLBs
have not been supplied remain visible as faceted stone proxies.

## How to use it

- Select **Enter the landscape** to opt into mouse look.
- Use `WASD` or the arrow keys to move. Hold `Shift` to move faster.
- Walk near an object and press `E` to open its record.
- Use the **Time of day** control or press `T` to cycle through dawn, day, dusk, and night.
- Press `Esc` to close a record or release the mouse.

## What is real and what is not

The textured objects are photogrammetry scans supplied through Tanit XR. The
terrain, walls, columns, vegetation, plinths, and artifact arrangement are
modern low-poly abstractions. Fragments are set into deliberately simplified
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
