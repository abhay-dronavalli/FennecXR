import * as THREE from "three";

export type ZoneId =
  | "carthage"
  | "tunis"
  | "zaghouan"
  | "neapolis"
  | "kairouan"
  | "unplaced";

export interface ModelRecord {
  uid: string;
  name: string;
  description: string;
  tags: string[];
  categories: string[];
  faceCount: number | null;
  vertexCount: number | null;
  textureCount: number | null;
  materialCount: number | null;
  viewCount: number | null;
  downloadCount: number | null;
  likeCount: number | null;
  isDownloadable: boolean;
  license: string | null;
  licenseUrl: string | null;
  uploader: string | null;
  embedUrl: string;
  viewerUrl: string;
  thumbnail: string | null;
}

export interface PlacedModel extends ModelRecord {
  zone: ZoneId;
  /** How the zone was decided. Shown to the user so the arrangement is auditable. */
  zoneEvidence: string;
  /** World position of this artifact's plinth. */
  pos: [number, number, number];
  /** Y-rotation so the artifact faces the zone entrance. */
  facing: number;
  hasLocal: boolean;
  /** Other records sharing this one's normalised name. */
  nameSiblings: string[];
  /** A record with byte-identical triangle and vertex counts, if any. */
  geomTwin: string | null;
}

export interface Zone {
  id: ZoneId;
  label: string;
  /** Short form for the in-world signpost, where space is tight. */
  short: string;
  sublabel: string;
  /** Real-world coordinates, or null for the unplaced pavilion. */
  latLon: [number, number] | null;
  /** World XZ centre. */
  center: [number, number];
  radius: number;
  style: "roman" | "islamic" | "pavilion";
}

/**
 * World positions derived from the real lat/lon by uniform km projection, then
 * Carthage and Tunis pushed apart ALONG THEIR REAL BEARING to a walkable 100
 * units. Bearings are preserved; distances are not. See the About panel.
 */
export const ZONES: Zone[] = [
  {
    id: "carthage",
    short: "Carthage",
    label: "Carthage",
    sublabel: "Byrsa Hill / Roman Villas / Tophet / Antonine Baths",
    latLon: [36.8528, 10.3233],
    center: [36, -138],
    radius: 34,
    style: "roman",
  },
  {
    id: "tunis",
    short: "Tunis",
    label: "Medina of Tunis",
    sublabel: "Zitouna Mosque / Medersa Slimanya / Zawiya",
    latLon: [36.798, 10.171],
    center: [-56, -98],
    radius: 30,
    style: "islamic",
  },
  {
    id: "zaghouan",
    short: "Zaghouan",
    label: "Water Temple, Zaghouan",
    sublabel: "Roman spring sanctuary",
    latLon: [36.373, 10.118],
    center: [-41, 17],
    radius: 30,
    style: "roman",
  },
  {
    id: "neapolis",
    short: "Neapolis",
    label: "Neapolis",
    sublabel: "Nabeul, Cap Bon",
    latLon: [36.451, 10.735],
    center: [108, -6],
    radius: 20,
    style: "roman",
  },
  {
    id: "kairouan",
    short: "Kairouan",
    label: "Kairouan",
    sublabel: "Mausoleum of Sidi Sahbi - outside the northeast region",
    latLon: [35.6781, 10.0963],
    center: [-47, 225],
    radius: 22,
    style: "islamic",
  },
  {
    id: "unplaced",
    short: "Not Located",
    label: "Not Yet Located",
    sublabel: "Scans whose records name no site",
    latLon: null,
    center: [78, 84],
    radius: 34,
    style: "pavilion",
  },
];

export const ZONE_BY_ID = Object.fromEntries(
  ZONES.map((z) => [z.id, z])
) as Record<ZoneId, Zone>;

export const SPAWN: [number, number, number] = [13, 1.7, 17];
export const WORLD_HALF = 300;

/**
 * Zone assignment. Rule order matters: first match wins.
 * Names in this collection are truncated at 48 characters at source, so the
 * patterns are deliberately short ("carthag", not "carthage").
 */
const NAME_RULES: [RegExp, ZoneId, string][] = [
  [/byrsa/i, "carthage", 'name contains "Byrsa"'],
  [/carthag/i, "carthage", 'name contains "Carthag"'],
  [/roman villas/i, "carthage", 'name contains "Roman Villas"'],
  [/tophet|salammbo/i, "carthage", "name names the Tophet of Salammbo"],
  [/antonin/i, "carthage", "name names the Antonine Baths"],
  [/kairouan|sidi sahbi/i, "kairouan", "name names Kairouan / Sidi Sahbi"],
  [/zaghouan|water temple/i, "zaghouan", "name names the Water Temple"],
  [/neapolis|nabeul/i, "neapolis", "name names Neapolis / Nabeul"],
  [
    /medina|zitouna|medersa|madrasa|zawiya|mihrab|mahram/i,
    "tunis",
    "name names a Medina of Tunis landmark",
  ],
];

/**
 * Second pass: many descriptions carry an explicit "Location:" line written by
 * the uploader. That is documented evidence, not a guess, so we use it.
 */
const LOCATION_RULES: [RegExp, ZoneId][] = [
  [/byrsa|carthage|antonine|tophet|salammbo/i, "carthage"],
  [/kairouan|sidi sahbi/i, "kairouan"],
  [/zaghouan/i, "zaghouan"],
  [/neapolis|nabeul/i, "neapolis"],
  [/medina of tunis|zitouna|medersa|madrasa|zawiya/i, "tunis"],
];

export function assignZone(m: ModelRecord): { zone: ZoneId; evidence: string } {
  for (const [re, zone, evidence] of NAME_RULES) {
    if (re.test(m.name)) return { zone, evidence };
  }
  const loc = (m.description || "").match(/Location:\s*(.+)/i);
  if (loc) {
    const line = loc[1].trim();
    for (const [re, zone] of LOCATION_RULES) {
      if (re.test(line)) {
        return { zone, evidence: 'description states "Location: ' + line + '"' };
      }
    }
  }
  return {
    zone: "unplaced",
    evidence: "no site named in the model's name or description",
  };
}

/**
 * Normalised name, with the upload-variant suffixes the collection uses
 * ("- copy", "- OPT", and the one record typo'd "- OTP") stripped.
 */
export function nameKey(m: ModelRecord) {
  return m.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(copy|opt|otp)$/g, "");
}

function geomKey(m: ModelRecord) {
  return m.faceCount && m.vertexCount ? `${m.faceCount}:${m.vertexCount}` : null;
}

/**
 * Lay a zone's artifacts out in concentric arcs facing the zone entrance
 * (the side nearest the world origin), roughly 4 units apart.
 */
function layout(
  zone: Zone,
  count: number
): { pos: [number, number, number]; facing: number }[] {
  const [cx, cz] = zone.center;
  const entrance = Math.atan2(-cx, -cz);
  const out: { pos: [number, number, number]; facing: number }[] = [];
  let placed = 0;
  let ring = 0;
  while (placed < count && ring < 14) {
    const r = 9 + ring * 6.5;
    const span = Math.PI * 1.45;
    const perRing = Math.max(4, Math.floor((span * r) / 4.5));
    const n = Math.min(perRing, count - placed);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const a = entrance + Math.PI + (t - 0.5) * span;
      const x = cx + Math.sin(a) * r;
      const z = cz + Math.cos(a) * r;
      out.push({ pos: [x, 0, z], facing: Math.atan2(cx - x, cz - z) + Math.PI });
      placed++;
    }
    ring++;
  }
  return out;
}

export function buildWorld(
  models: ModelRecord[],
  manifest: string[]
): PlacedModel[] {
  const local = new Set(manifest);
  const byZone = new Map<ZoneId, ModelRecord[]>();

  // Two independent ambiguity signals, kept separate because they mean
  // different things. Neither is treated as proof, and nothing is merged.
  const byName = new Map<string, string[]>();
  const byGeom = new Map<string, string[]>();
  for (const m of models) {
    const nk = nameKey(m);
    byName.set(nk, [...(byName.get(nk) ?? []), m.uid]);
    const gk = geomKey(m);
    if (gk) byGeom.set(gk, [...(byGeom.get(gk) ?? []), m.uid]);
  }

  for (const m of models) {
    const { zone } = assignZone(m);
    if (!byZone.has(zone)) byZone.set(zone, []);
    byZone.get(zone)!.push(m);
  }

  const placed: PlacedModel[] = [];
  for (const zone of ZONES) {
    const list = byZone.get(zone.id) ?? [];
    // Models with a local .glb sort first so they land in the front arc.
    list.sort((a, b) => {
      const la = local.has(a.uid) ? 0 : 1;
      const lb = local.has(b.uid) ? 0 : 1;
      if (la !== lb) return la - lb;
      return (b.faceCount ?? 0) - (a.faceCount ?? 0);
    });
    const slots = layout(zone, list.length);
    list.forEach((m, i) => {
      const { zone: z, evidence } = assignZone(m);
      const slot = slots[i];
      const gk = geomKey(m);
      const twins = (gk ? byGeom.get(gk) ?? [] : []).filter(
        (u) => u !== m.uid
      );
      placed.push({
        ...m,
        zone: z,
        zoneEvidence: evidence,
        pos: slot ? slot.pos : [zone.center[0], 0, zone.center[1]],
        facing: slot ? slot.facing : 0,
        hasLocal: local.has(m.uid),
        nameSiblings: (byName.get(nameKey(m)) ?? []).filter((u) => u !== m.uid),
        geomTwin: twins[0] ?? null,
      });
    });
  }
  return placed;
}

/** Photogrammetry scans arrive at arbitrary scale, origin and rotation. */
export function fitToBox(object: THREE.Object3D, targetHeight = 2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  const scale = targetHeight / Math.max(size.y, 0.001);
  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  const box2 = new THREE.Box3().setFromObject(object);
  const c2 = new THREE.Vector3();
  box2.getCenter(c2);
  object.position.x -= c2.x;
  object.position.z -= c2.z;
  object.position.y -= box2.min.y;

  return object;
}

export const OVERRIDES: Record<
  string,
  { rotation?: [number, number, number]; height?: number }
> = {
  // Filled in only for models that visibly load sideways.
};

export const VOLUNTEER_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLSegO7smO5VyQSpSSaamKni4RPD4q_yDytd5TCK3jOH6LTML6w/viewform";

export function isDocumented(d: string) {
  return !!d && d.trim().length >= 40;
}

/** First paragraph only, for short cards. The full text is never altered. */
export function blurb(d: string, n = 180) {
  const s = (d || "").split("\n")[0].trim();
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}
