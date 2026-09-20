# Carthage Underfoot — build plan v2

**Hackathon:** CityCamp Gainesville Hack Day, Tanit XR Track One (Technical)
**Build window:** ~12:40 PM → 4:30 PM demo. Under four hours. Read Section 9 (Time Budget) and Section 10 (Who Does What) before writing any code.
**Deliverable:** a browser-based, low-poly walkable Carthage using every available Tanit XR scan, with a voice guide you can ask questions.

---

## 0. Read this first (instructions to the AI agent building this)

You are building a demo that must be *running and interactive* in front of judges at 4:30 PM today.

Hard rules:

1. **Ship a live URL by 2:00 PM**, even if it shows three models on a plane. Deploy early and often.
2. **Never let a failure white-screen the app.** Every model load, every API call, every mic permission is wrapped in an error boundary with a working fallback. If the voice guide dies, the text panel still works. If a GLB 404s, a faceted grey block stands in its place with the artifact's card still attached.
3. **The voice guide answers only from supplied context.** See Section 7. It must be incapable of freelancing about Tunisian history.
4. **Do not invent historical claims** anywhere. Every fact in the UI comes from `content.json`, and every entry has a `sources` array.
5. **Do not model or AI-generate any building that claims to be a real structure.** The world is stylized abstraction. See Section 5.
6. **Feature freeze at 3:30 PM.** No exceptions.

---

## 1. The concept

The Tanit XR archive holds 21 scans of objects from Carthage — a Corinthian capital, a headless draped statue, a row of Punic stelae, a mosaic with birds and vines. Every one of them floats alone on a white background, cut off from where it came from.

**Carthage Underfoot puts all of them back on the ground.** You walk a stylized, low-poly Carthage in first person, divided into the four real find-sites the scans came from. The objects sit where objects like them were found. Walk up to any one and a panel tells you what it is and who scanned it — or press and hold to **ask it a question out loud** and get a spoken answer, grounded strictly in the archive's own documentation.

**Target audience:** a curious high-school or first-year university student with no prior knowledge of Tunisian history.

**One-sentence goal:** *After five minutes, they should understand that these fragments came from real, specific places in Carthage, and be able to name one thing that threatens them.*

---

## 2. Art direction — polygonal, and why it's the right call

**The world is low-poly. The scans are not.** This is the single most important visual decision in the project and it must be enforced consistently.

Attempted photorealism fails here, because you cannot build a believable realistic Carthage in four hours and the scans would look pasted onto a bad stage. Faceted low-poly is honest, fast, and — critically — it makes the scans look *better* by contrast. A photogrammetry capture of real weathered limestone surrounded by flat-shaded geometry reads instantly as "this one is real."

| Layer | Treatment |
|---|---|
| **Scanned artifacts** | Untouched. Original photogrammetry texture, `MeshStandardMaterial`, opaque. Do **not** decimate below ~50k tris or strip textures — that detail is what the track is scored on. |
| **World geometry** | Flat-shaded (`flatShading: true`), no textures, solid colours from the palette below. Low segment counts everywhere: cylinders at 6–8 radial segments, spheres at 6×4. |
| **Interpretation layer** | Translucent white, 20% opacity, faceted, with visible edges. Always labeled. |

**Palette** (put these in CSS vars and a shared JS constant, use nothing else):

```
sand        #E8D9BE   ground, plateau
stone       #C9B79C   walls, column stubs
stone-dark  #A89377   shadowed masses, terrace faces
cypress     #3F5F4A   trees
sea         #5B8C9B   distant water plane
sky-warm    #F2C98A   horizon gradient bottom
sky-high    #7FB3D1   horizon gradient top
ink         #241D16   UI panels, text on light
```

Lighting: one directional light low on the horizon (late afternoon, elevation ~15°), warm tint, plus a hemisphere light for fill. Shadows on, `PCFSoftShadowMap`, low map size (1024) — soft blobs are fine and cheap. **Do not use HDRI environment maps or post-processing.** Flat shading plus good light direction is the whole look.

Trees: cone + cylinder, instanced. Rocks: icosahedrons, randomly rotated and scaled. Birds (optional, 5 min): three triangles on a slow circular path. These tiny touches are what make a low-poly scene feel finished.

---

## 3. Map — four zones, one per find-site

The archive's objects come from four places. Make each one a zone. This is what lets you use all 21 models without the world feeling like a warehouse.

```
        [ THE TOPHET ]                    [ BATHS OF ANTONINUS ]
      sunken walled enclosure               seaward terrace,
      stelae in rows, dim, quiet            column drums, water edge
              \                                    /
               \                                  /
                ---- [ BYRSA PLATEAU ] -----------
                      spawn point, high ground,
                      columns + statues
                              |
                     [ ROMAN VILLAS TERRACE ]
                      mosaic laid into the floor,
                      busts, torso, bird of prey
```

Zone assignment from the archive titles:

| Zone | Artifacts (approx.) |
|---|---|
| **Byrsa Plateau** | Corinthian Capital, Roman Column, Roman Column Base, Fluted Column Fragment, Roman Togatus Statue, Roman Draped Statue, Draped Statue, Headless Draped Statue, Reclining Figure, Inscribed Architectural Fragment |
| **Roman Villas Terrace** | Roman Mosaic with Bird and Vine Motifs, Standing Draped Statue, Male Torso Statue, Bust Fragment, Decorated Bust Fragment, Statue Fragment, Bird of Prey Statue |
| **The Tophet of Salammbô** | Tanit Stela, Punic Stela, Punic Stelae Row |
| **Baths of Antoninus / Architectural** | Architectural Fragments with Inscriptions, plus any remaining |

Verify the exact list against `https://tanitxr.org/archive/` while building. Zones are a `zone` field in `content.json`, so reassignment is a one-word edit.

**Walk time end to end: ~90 seconds.** Resist making it bigger.

**Placement rules that sell the concept:**
- The **mosaic is laid flat into the floor**, not on a pedestal. Single best detail in the build.
- The **Corinthian capital lies on the ground** beside a column stub, not upright on a plinth. It fell.
- The **stelae stand in rows** in the Tophet, lit by a shaft from above. This is the hero space — the org is named for Tanit.
- Statues get low faceted plinths. Fragments get the ground.

---

## 4. Tech stack

- **Vite + React + React Three Fiber** (`@react-three/fiber`) **+ `@react-three/drei`**
- `drei`: `useGLTF`, `KeyboardControls`, `PointerLockControls`, `Html`, `Sky`, `Instances`, `Preload`, `AdaptiveDpr`
- `zustand` for global state (active artifact, zone, tour index, layer toggles, guide state)
- Plain CSS with custom properties. No UI library.
- **Deploy: Vercel.** You need its serverless functions anyway for the API keys (Section 7).

Do not use Unity, Unreal, or WebXR. A URL a judge opens on their own phone is the most reliable artifact you can produce.

### File tree

```
/
  README.md
  plan.md
  /api                        # Vercel serverless — keeps API keys off the client
    ask.js                    # POST {artifactId, question} -> {answer}
    speak.js                  # POST {text} -> audio/mpeg stream
  /public
    /models/*.glb
    /fallback/*.jpg           # thumbnails for the no-WebGL text tour
    content.json
  /src
    main.jsx
    App.jsx
    store.js
    palette.js
    /world
      Scene.jsx
      Player.jsx
      Zone.jsx                # loads one zone's artifacts, unloads others
      Artifact.jsx
      GhostLayer.jsx
      Terrain.jsx             # low-poly ground, terraces
      Props.jsx               # instanced columns, cypresses, rocks
      Tophet.jsx
    /ui
      InfoPanel.jsx
      AskGuide.jsx            # the voice guide — Section 7
      TourMode.jsx
      TextTour.jsx            # /text route, accessible + low-bandwidth
      Onboarding.jsx
      Credits.jsx
      HelpBar.jsx
  /scripts
    fetch_models.md           # notes on where each GLB came from
    optimize.sh               # gltf-transform batch compression
```

---

## 5. World geometry — the honesty rule

The scans are real. Everything else is **not** a reconstruction and must never look like one. Low-poly flat shading is doing double duty here: it is an aesthetic *and* an epistemic signal. Nothing faceted and untextured can be mistaken for a claim about what stood in Carthage.

Build all of it procedurally from primitives — boxes, cylinders, cones, icosahedrons. **No downloaded building assets. No AI-generated mosque, fort, or temple. No invented inscriptions or signage.**

When the interpretation layer is on (`G`), show a persistent banner:

> **Interpretation layer** — a modern guess at what these fragments belonged to. Not scanned, not documented. Toggle off with G.

Put this in the UI, not just the README. It is the line that wins the "treats heritage with care / does not present speculation as fact" criterion.

---

## 6. Models — getting all 21 in without killing the page

This is the biggest technical risk in the build. Budget accordingly.

### Acquisition (start immediately, in parallel with everything else)

1. Open each model on the Tanit XR Sketchfab account. **Check license and whether download is enabled.**
2. Downloadable → get **glTF (.glb)** into `/public/models/`.
3. Not downloadable → do **not** scrape. Place a faceted stone block proxy in the world, and put the official Sketchfab `<iframe>` embed in that artifact's InfoPanel. Note it in the README. This is a legitimate outcome, not a failure.
4. Record author, model URL, and license in `content.json`. **Visible credit on the artifact card itself**, not only the README.
5. Start with `https://skfb.ly/pIxPR` (the optimized starter model) as artifact #1.

### Optimization — mandatory

21 raw photogrammetry GLBs will be hundreds of megabytes. Run every file through `gltf-transform`:

```bash
npx @gltf-transform/cli optimize in.glb out.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
```

Targets: **under 3 MB per artifact, under 45 MB total.** If one is still huge, add `--simplify --simplify-error 0.001`. Do not simplify so hard the surface detail goes — check it visually.

### Loading strategy

- **Load by zone.** Mount only the current zone's artifacts plus its immediate neighbour. Unload on exit. This is a `<Zone>` component keyed on the player's position.
- `<Suspense>` per artifact with a faceted grey placeholder of roughly the right size, so the world never has holes in it.
- A loading bar on first entry, showing real progress via `useProgress`.
- `<AdaptiveDpr pixelated />` so weak laptops degrade to lower resolution instead of stuttering.
- Cap total on-screen artifacts at ~10.

**If a model does not load, the artifact still exists** — placeholder geometry, working card, working voice guide. Never block.

---

## 7. The voice guide — "Ask the stone"

This is the differentiator. Build it so it cannot embarrass you.

### Flow

```
user presses and holds SPACE (or clicks "Ask")
  → Web Speech API SpeechRecognition captures the question   [free, instant, Chrome]
  → POST /api/ask { artifactId, question }
      → Gemini, with ONLY that artifact's content.json entry as context
      → returns 2–3 sentences, or an explicit "the archive doesn't say"
  → answer text renders in the panel IMMEDIATELY (do not wait for audio)
  → POST /api/speak { text } → ElevenLabs streaming TTS → plays
```

Text appears before audio. Always. If TTS fails, the user never notices anything is wrong.

### `/api/ask.js`

Model: **`gemini-3.8-flash`** (or `gemini-3.1-flash-lite` for lower cost/latency — verify the current name at `ai.google.dev`, they churn). Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, key in `GEMINI_API_KEY` env var, never in the client bundle.

System instruction — use close to this wording, it is the guardrail:

```
You are a museum guide standing beside one specific artifact in Carthage,
Tunisia. You may ONLY use the CONTEXT below to answer. 

Rules:
- If the answer is not in the CONTEXT, say plainly: "The archive doesn't
  record that." Then offer one thing you DO know from the context.
- Never guess, speculate, or supply general knowledge about Carthage,
  Tunisia, Rome, or Punic religion from your own training.
- Never state a date, name, or measurement that does not appear in CONTEXT.
- If the CONTEXT marks something as interpretation or debated, say so
  explicitly in your answer.
- Two to three sentences. Plain language. No jargon. You are speaking
  aloud to a curious teenager.

CONTEXT:
<the full content.json entry for this artifact, plus the zone's site blurb>
```

Set `temperature: 0.2`, `maxOutputTokens: 150`.

**This refusal behaviour is a feature to demo, not a limitation.** Ask it something unanswerable in front of the judges and let it say "the archive doesn't record that." That is the entire "does not present speculation as fact" criterion, demonstrated live, in a voice.

### `/api/speak.js`

- `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`
- Header `xi-api-key: process.env.ELEVENLABS_API_KEY`
- Body: `{ text, model_id: "eleven_flash_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }`
- `eleven_flash_v2_5` is the low-latency model (~75ms). Use the `/stream` endpoint, not the plain one — pipe the response straight through to the client and play it with an `<audio>` element fed by a blob URL or MediaSource.
- Pick one warm, unhurried voice from the library and keep it consistent. Name it in the UI (e.g. "your guide") — **do not claim it is a real person, a Tunisian narrator, or a Tanit XR volunteer.** It is a synthetic voice; say so once in the onboarding and in the README.

### Guardrails and fallbacks

- **Text input box always visible** next to the mic button. Mic permissions fail, rooms are loud, Safari's SpeechRecognition support is patchy. Typing must work.
- **Three pre-seeded question chips** per artifact ("What is this?", "Where was it found?", "What's threatening it?") — one click, no mic, no typing. **Demo with these.** They are deterministic and fast.
- Rate limit: one in-flight request at a time, disable the button while pending.
- Hard timeout at 8s → show the static description from `content.json` instead, with a quiet "guide unavailable" note.
- **Cache answers** to the seeded questions in `localStorage` so a repeat demo is instant and costs nothing.
- If both API keys are missing, the whole guide hides itself and the app is still a complete project.

### Note on overlap

Tanit XR's own site already has a guide character called Nura on their Explore page. Do not name yours Nura and do not pitch this as novel to them — pitch it as *grounded*: your version can only speak from the archive's own documentation and refuses everything else. That is the interesting part.

---

## 8. Content — `content.json`

```json
{
  "zones": [
    {
      "id": "byrsa",
      "name": "Byrsa Hill",
      "blurb": "Two to three sourced sentences about this place.",
      "spawn": [0, 1.7, 0],
      "sources": [{ "label": "...", "url": "..." }]
    }
  ],
  "artifacts": [
    {
      "id": "corinthian-capital-byrsa",
      "zone": "byrsa",
      "title": "Corinthian Capital",
      "findSite": "Byrsa Hill, Carthage",
      "model": "/models/corinthian-capital.glb",
      "embedUrl": null,
      "position": [12, 0, -8],
      "rotation": [0, 0.4, 0],
      "scale": 1.0,
      "placement": "ground",
      "fallbackImage": "/fallback/corinthian-capital.jpg",
      "shortLabel": "A column top, fallen",
      "description": "2–3 sentences, plain language.",
      "context": "Sourced fact about what this tells us.",
      "threat": "What puts it at risk — weather, erosion, footfall, neglect.",
      "interpretation": "Anything uncertain goes HERE, rendered separately in italic.",
      "scannedBy": "Volunteer name from the Sketchfab page",
      "modelUrl": "https://sketchfab.com/models/...",
      "license": "CC BY 4.0",
      "sources": [{ "label": "Tanit XR Archive", "url": "https://tanitxr.org/archive/..." }]
    }
  ]
}
```

**Writing rules:**
- Pull descriptions from the Tanit XR archive page for that object wherever one exists. That is community-written and authoritative — prefer it over anything you compose.
- Site-level context: UNESCO's entry for the Archaeological Site of Carthage plus one encyclopedia-grade source. Cite both.
- **`context` = sourced fact. `interpretation` = guess.** If you write "would have," "likely," or "may have" in `context`, move it to `interpretation`.
- The Tophet's burials are **genuinely debated among archaeologists**. Say that it is debated. Do not pick a side. One honest sentence here is worth more to these judges than any graphical feature.
- Under 120 words per panel.
- With 21 artifacts, it is fine for several to share a short description and differ only in title, find-site, and credit. Do not pad with invented detail to make them distinct.

---

## 9. Time budget

Hard gates. Miss one → cut scope from that hour, never borrow from the next.

| Time | Goal | Gate |
|---|---|---|
| **12:40–1:00** | Repo created, Vercel connected, empty app deployed. API keys obtained (Gemini + ElevenLabs) and set as Vercel env vars. Model licensing check underway in parallel. | **A live URL exists.** |
| **1:00–1:45** | Vite + R3F running. Low-poly terrain, palette, sky, afternoon light, first-person walk. 3–4 real GLBs placed on Byrsa Plateau, driven by `content.json`. Proximity + `E` → InfoPanel with real sourced text. | **You can walk up to a real Tanit XR scan and read about it.** Redeploy. |
| **1:45–2:30** | `/api/ask` and `/api/speak` working end to end with the three seeded question chips. Text renders before audio. | **A judge could click a chip and hear a grounded answer.** Redeploy. |
| **2:30–3:00** | Remaining zones: Tophet interior, Villas Terrace, Baths. All optimized models in and placed. Instanced columns, cypresses, rocks. Interpretation layer on the capital. | **It is four places, not one plane.** Redeploy. |
| **3:00–3:30** | Accessibility: Tour Mode (`T`), `/text` route, focus management, help bar, reduced motion. Onboarding overlay. | **The whole experience is completable with only a keyboard.** |
| **3:30–4:00** | **FREEZE.** README with setup, full credits table, licenses, sources, and the "what is real and what is not" paragraph. In-app Credits panel. Fix only the two worst bugs. | **README complete, repo public.** |
| **4:00–4:15** | Record a 90-second screen capture of the working demo *with audio*. Upload. Link in README. | **A demo that survives dead wifi.** |
| **4:15–4:30** | Rehearse the pitch twice, out loud, on a timer. | Everyone knows their lines. |

### Cut order

Cut from the bottom up without guilt:

12. Birds, ambient audio
11. Baths of Antoninus zone
10. Mic input (keep typing + chips)
9. Interpretation / ghost layer
8. Villas Terrace
7. More than 12 artifacts
6. Instanced props beyond columns and cypresses
5. Tophet interior
4. Tour Mode
3. ElevenLabs voice (keep the text answer)
2. Gemini guide entirely (keep static panels)
1. **Never cut:** one real scan, walkable, sourced text, visible credits, and the `/text` fallback.

### Escape hatch

**If at 2:30 the 3D world is unstable, collapse to Plan B:** a low-poly illustrated SVG plan-view of the four sites with hotspot pins. Each pin opens the artifact card, the Sketchfab embed, and the voice guide. Same content, same accessibility, same honesty layer, one hour of work, zero WebGL risk. It satisfies every line of the minimum submission. Losing the walk beats losing the demo.

---

## 10. Who does what (parallelize hard)

With 21 models and a voice pipeline, serial work will not finish. Split immediately:

- **Person A — World.** Terrain, palette, lighting, player controller, zones, props, Tophet. Owns the look.
- **Person B — Content.** Nothing but model acquisition, license checks, `gltf-transform` optimization, and writing `content.json` with sourced text. This is ~90 minutes of unglamorous work and it is on the critical path for *everything*. Do not let this person get pulled into code.
- **Person C — Guide + UI.** `/api/ask`, `/api/speak`, InfoPanel, AskGuide, Tour Mode, `/text` route, accessibility.
- **Whoever finishes first — README, credits, video capture, demo script.**

If you are a team of two: A+C merge, B stays dedicated to content. If you are alone, cut to 8 artifacts and follow the cut list from #7 down.

---

## 11. Accessibility — scored, and cheap

Three ways in, all with equivalent content:

1. **Free walk** — WASD / arrows, mouse look. Pointer lock is **opt-in via a button**, never automatic.
2. **Tour Mode (`T`)** — no mouse needed. `Tab`/`→` to next station, camera glides and frames the artifact, `Enter` opens the panel, `Esc` closes. **Demo in this mode** — it is deterministic and cannot get lost.
3. **Text Tour (`/text`)** — plain HTML: headings, thumbnails, all the same text, all credits, and the seeded Q&A answers as static text. Under 200 KB, no WebGL, screen-reader clean. Your low-bandwidth option and your emergency demo.

Details:
- `<canvas>` gets `aria-hidden="true"`. All artifact text is real DOM. `InfoPanel` is `role="dialog"`, `aria-labelledby`, focus trapped, focus returned on close.
- Voice guide answers render into an `aria-live="polite"` region so screen readers announce them.
- Visible focus ring on every control, plus a glowing outline on the in-world artifact that currently has keyboard focus.
- `prefers-reduced-motion`: glides become cuts, ambient motion off. Also a manual toggle.
- Text size control, three steps, via a root CSS var.
- Panels are solid `ink` with off-white text — not translucent glass over a bright sky. Verify 4.5:1.
- Persistent help bar: `WASD move · E interact · SPACE ask · T tour · G layers · ? help`

---

## 12. README requirements

```
# Carthage Underfoot
One line.
→ Live: <url>     → Video fallback: <url>

## What it is / who it's for
Target audience + the one-sentence goal.

## How to use it
Controls. Mention Tour Mode and /text explicitly.

## Models — credits and licenses
Table: artifact | scanned by | Sketchfab link | license
"3D scans by Tanit XR volunteers. https://tanitxr.org"

## Sources
Every historical source, linked.

## What is real and what is not
The scans are real photogrammetry of real objects, by named volunteers.
The terrain, columns, walls and vegetation are stylized low-poly abstraction,
not reconstructions. The interpretation layer is a modern guess, labeled
in-app. The guide's voice is synthesized (ElevenLabs) and its answers are
generated by Gemini constrained to the archive's own documentation; it is
instructed to say "the archive doesn't record that" rather than speculate.

## Setup
npm install && npm run dev
Env: GEMINI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
```

---

## 13. Two-minute demo script

1. **(15s)** "The Tanit XR archive has 21 scans from Carthage. Every one is floating alone on a white background, cut off from where it came from."
2. **(25s)** Walk Byrsa Plateau. "This is real photogrammetry by a Tanit XR volunteer, lying on the ground where a column fell. Everything around it is deliberately flat-shaded — we never let our stage look like a claim about what stood here." `E`, panel opens, read the find-site and scanner's name aloud.
3. **(30s)** Click the "What's threatening it?" chip. Answer appears, then the voice speaks. **Then ask it something the archive doesn't cover** and let it say "the archive doesn't record that." — "It can't make things up. It only has what the volunteers documented."
4. **(25s)** Walk down into the Tophet. Let it land. One sentence on the stelae, one on the fact that the site's interpretation is debated among archaeologists.
5. **(15s)** Press `T`. Tab through two stations. "Everything works without a mouse." Then "Read as text" — "and everything works with no 3D at all, on a slow connection, with a screen reader."
6. **(10s)** "All 21 scans, every one credited, every claim sourced. Live at <url>."

Before you walk up: live site in tab one, repo in tab two, fallback video in tab three, **volume tested**.

---

## 14. Confirm in the first 15 minutes

- [ ] Which Tanit XR models are downloadable as .glb, and under what license. **Do this first** — it is the only thing that can invalidate the plan.
- [ ] Identify the model behind `https://skfb.ly/pIxPR`; make it artifact #1.
- [ ] Gemini API key works — curl it once before wiring anything.
- [ ] ElevenLabs key works and you have a chosen `voice_id`.
- [ ] Vercel repo connected and an empty deploy is live.
