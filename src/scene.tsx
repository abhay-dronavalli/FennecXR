import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Billboard,
  OrbitControls,
  PointerLockControls,
  Text,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import {
  fitToBox,
  OVERRIDES,
  PlacedModel,
  SPAWN,
  WORLD_HALF,
  Zone,
  ZONES,
} from "./data";

/* ------------------------------------------------------------------ keys */

const keys: Record<string, boolean> = {};

export function installMovementKeys() {
  const down = (e: KeyboardEvent) => {
    keys[e.code] = true;
  };
  const up = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };
  const blur = () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}

/* --------------------------------------------------------------- palette */

const SAND = "#c8a678";
const GROUND = "#b89364";
const STONE = "#e6ded0";
const STONE_DARK = "#cbbda6";
const ACCENT = "#7a8f7d";
const HAZE = "#e7d6b4";

const stone = (color: string, roughness = 0.92) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });

const matStone = stone(STONE);
const matStoneDark = stone(STONE_DARK, 0.96);
const matAccent = stone(ACCENT, 0.85);
const matPlinth = stone("#d8cdb8", 0.95);
const matFrame = stone("#b9a884", 0.95);
const matGhost = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.22,
});

const matRubble = stone("#c2b094", 0.98);
const matRubbleDark = stone("#a89478", 1);
/** Unlit and slightly darker than the haze: at 300+ units the sun term only
 *  made these read as bright boxes instead of distant land. */
const matHorizon = new THREE.MeshBasicMaterial({ color: "#a2937a" });

const geoColumn = new THREE.CylinderGeometry(0.45, 0.55, 7, 10);
const geoDrum = new THREE.CylinderGeometry(0.52, 0.52, 1.3, 10);
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoPlinth = new THREE.CylinderGeometry(0.85, 0.95, 1, 12);
const geoPlane = new THREE.PlaneGeometry(1, 1);

/* ------------------------------------------------------------ atmosphere */

function gradientTexture(stops: [number, string][], size = 256) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, size);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * A warm afternoon gradient rather than drei's physical Sky: the horizon band
 * is pinned to exactly HAZE, which is also the fog colour, so the ground fades
 * into the sky instead of hard-cutting against it.
 */
function GradientSky() {
  const tex = useMemo(
    () =>
      gradientTexture([
        [0, "#6f93b8"],
        [0.36, "#a9bfcf"],
        [0.47, "#d6cdb6"],
        [0.5, HAZE],
        [0.56, "#dfc79d"],
        [1, "#b08f61"],
      ]),
    []
  );
  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1}>
      <sphereGeometry args={[800, 24, 16]} />
      <meshBasicMaterial map={tex} fog={false} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
}

/**
 * Tiled sandstone noise for the ground. A single flat hex under a directional
 * light reads worse than no light at all: there is nothing for the shading to
 * catch on.
 */
function groundTexture(base: string, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const rnd = mulberry32(0x5eed);
  for (let i = 0; i < 2600; i++) {
    const r = 1 + rnd() * 7;
    const a = 0.02 + rnd() * 0.05;
    ctx.fillStyle =
      rnd() > 0.5 ? `rgba(255,244,214,${a})` : `rgba(96,72,44,${a})`;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Stable per-object jitter, so the arc is not a machine-placed grid. */
function jitter(uid: string) {
  let h = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = mulberry32(h >>> 0);
  return {
    height: 0.82 + r() * 0.42,
    spin: (r() - 0.5) * 0.5,
    fan: (r() - 0.5) * 0.42,
    tilt: (r() - 0.5) * 0.1,
  };
}

/** Small deterministic PRNG, so scenery is identical on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------- sun */

/**
 * One directional light, angled like an afternoon sun rather than noon.
 * Its shadow camera is a tight box that FOLLOWS THE PLAYER instead of
 * spanning the whole 600-unit map: at map-wide scale a 2048 map would give
 * about three texels per metre, which is worse than no shadow at all.
 */
const SUN_OFFSET: [number, number, number] = [115, 87, 96];
const SHADOW_SPAN = 90;
const SHADOW_MAP = 2048;

function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const l = ref.current;
    if (!l) return;
    // Snap the frustum to whole shadow texels, or the shadow edges crawl
    // as the player walks.
    const texel = (SHADOW_SPAN * 2) / SHADOW_MAP;
    const cx = Math.round(live.x / texel) * texel;
    const cz = Math.round(live.z / texel) * texel;
    target.position.set(cx, 0, cz);
    target.updateMatrixWorld();
    l.position.set(cx + SUN_OFFSET[0], SUN_OFFSET[1], cz + SUN_OFFSET[2]);
  });

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={ref}
        target={target}
        intensity={2.1}
        color="#fff0d6"
        castShadow
        shadow-mapSize-width={SHADOW_MAP}
        shadow-mapSize-height={SHADOW_MAP}
        shadow-bias={-0.0006}
        shadow-normalBias={0.05}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-SHADOW_SPAN}
        shadow-camera-right={SHADOW_SPAN}
        shadow-camera-top={SHADOW_SPAN}
        shadow-camera-bottom={-SHADOW_SPAN}
      />
    </>
  );
}

/* ----------------------------------------------------------------- state */

/** Frame-loop scratch shared between the player and the HUD, to avoid
 *  re-rendering React 60 times a second. */
export interface LiveState {
  x: number;
  z: number;
  yaw: number;
  nearUid: string | null;
}
export const live: LiveState = { x: SPAWN[0], z: SPAWN[2], yaw: 0, nearUid: null };

export const NEAR_RANGE = 6;

/**
 * Set by WorldCanvas so a DOM button can request the lock from inside a real
 * user gesture. Browsers refuse Pointer Lock requested any other way.
 */
export let requestPointerLock: () => void = () => {};

/* ---------------------------------------------------------------- player */

function Player({
  artifacts,
  active,
  reduceMotion,
  onNear,
  tourTarget,
  onTourArrive,
}: {
  artifacts: PlacedModel[];
  active: boolean;
  reduceMotion: boolean;
  onNear: (uid: string | null) => void;
  tourTarget: PlacedModel | null;
  onTourArrive: () => void;
}) {
  const { camera } = useThree();
  const vel = useRef(new THREE.Vector3());
  const tick = useRef(0);
  const arrived = useRef(false);
  const lookAt = useRef(new THREE.Quaternion());

  useEffect(() => {
    camera.position.set(SPAWN[0], SPAWN[1], SPAWN[2]);
    // Face the signpost at the world centre, so the first frame orients you.
    camera.lookAt(0, 4.6, 0);
  }, [camera]);

  useEffect(() => {
    arrived.current = false;
  }, [tourTarget]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);

    if (tourTarget) {
      // Stand a few metres in front of the artifact, at eye height.
      const t = new THREE.Vector3(...tourTarget.pos);
      const dir = new THREE.Vector3(
        Math.sin(tourTarget.facing),
        0,
        Math.cos(tourTarget.facing)
      ).normalize();
      const stand = t.clone().addScaledVector(dir, 4.5);
      stand.y = 1.7;

      const speed = reduceMotion ? 1.4 : 2.6;
      camera.position.lerp(stand, Math.min(1, dt * speed));

      const m = new THREE.Matrix4().lookAt(
        camera.position,
        new THREE.Vector3(t.x, 1.5, t.z),
        new THREE.Vector3(0, 1, 0)
      );
      lookAt.current.setFromRotationMatrix(m);
      camera.quaternion.slerp(lookAt.current, Math.min(1, dt * speed * 1.4));

      if (!arrived.current && camera.position.distanceTo(stand) < 1.2) {
        arrived.current = true;
        onTourArrive();
      }
    } else if (active) {
      const base = reduceMotion ? 6 : 9;
      const fast = keys.ShiftLeft || keys.ShiftRight;
      const speed = fast ? base * 2 : base;

      // W/S and Up/Down walk. A/D strafe. Left/Right turn, so the whole world
      // is navigable from the keyboard alone, without Pointer Lock.
      const fwd =
        Number(!!keys.KeyW || !!keys.ArrowUp) -
        Number(!!keys.KeyS || !!keys.ArrowDown);
      const str = Number(!!keys.KeyD) - Number(!!keys.KeyA);
      const turn = Number(!!keys.ArrowLeft) - Number(!!keys.ArrowRight);

      if (turn !== 0) {
        const rate = (reduceMotion ? 1.1 : 1.8) * (fast ? 1.6 : 1);
        camera.rotateOnWorldAxis(
          new THREE.Vector3(0, 1, 0),
          turn * rate * dt
        );
      }

      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();

      const want = new THREE.Vector3()
        .addScaledVector(dir, fwd)
        .addScaledVector(right, str);
      if (want.lengthSq() > 0) want.normalize().multiplyScalar(speed);

      vel.current.lerp(want, Math.min(1, dt * 12));
      camera.position.addScaledVector(vel.current, dt);
      camera.position.y = 1.7;
      camera.position.x = THREE.MathUtils.clamp(
        camera.position.x,
        -WORLD_HALF,
        WORLD_HALF
      );
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z,
        -WORLD_HALF,
        WORLD_HALF
      );
    }

    live.x = camera.position.x;
    live.z = camera.position.z;
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    live.yaw = Math.atan2(d.x, d.z);

    // Nearest-artifact test, a few times a second rather than every frame.
    tick.current += dt;
    if (tick.current > 0.15) {
      tick.current = 0;
      let best: string | null = null;
      let bestD = NEAR_RANGE * NEAR_RANGE;
      for (const a of artifacts) {
        const dx = a.pos[0] - camera.position.x;
        const dz = a.pos[2] - camera.position.z;
        const dd = dx * dx + dz * dz;
        if (dd < bestD) {
          bestD = dd;
          best = a.uid;
        }
      }
      if (best !== live.nearUid) {
        live.nearUid = best;
        onNear(best);
      }
    }
  });

  return null;
}

/* ---------------------------------------------------------------- ground */

function Ground() {
  const outer = useMemo(() => {
    const t = groundTexture(GROUND);
    t.repeat.set(120, 120);
    return t;
  }, []);
  const inner = useMemo(() => {
    const t = groundTexture(SAND);
    t.repeat.set(90, 90);
    return t;
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_HALF * 2 + 40, WORLD_HALF * 2 + 40]} />
        <meshStandardMaterial map={outer} roughness={1} metalness={0} />
      </mesh>
      {/* a lighter inner plate so the playable area reads as bounded */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[WORLD_HALF - 10, 64]} />
        <meshStandardMaterial map={inner} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

/* --------------------------------------------------------------- scenery */

/**
 * Reused primitive props: broken wall stubs, rubble piles and fallen column
 * drums. They exist to give the middle distance something to occlude and cast
 * shadows onto. Placement is seeded, so the world is identical on every load.
 */
function Rubble({ rnd }: { rnd: () => number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 3 }, () => ({
        p: [(rnd() - 0.5) * 2.2, 0, (rnd() - 0.5) * 2.2] as [
          number,
          number,
          number
        ],
        s: 0.35 + rnd() * 0.8,
        ry: rnd() * Math.PI,
        rx: (rnd() - 0.5) * 0.5,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <>
      {bits.map((b, i) => (
        <mesh
          key={i}
          position={[b.p[0], b.s / 2, b.p[2]]}
          rotation={[b.rx, b.ry, 0]}
          geometry={geoBox}
          material={i % 2 ? matRubble : matRubbleDark}
          scale={[b.s * 1.4, b.s, b.s * 1.1]}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

function Prop({ kind, rnd }: { kind: number; rnd: () => number }) {
  if (kind === 0) {
    // broken wall stub
    const w = 2 + rnd() * 3.5;
    const h = 1 + rnd() * 1.8;
    return (
      <>
        <mesh
          position={[0, h / 2, 0]}
          geometry={geoBox}
          material={matRubble}
          scale={[w, h, 0.6 + rnd() * 0.35]}
          castShadow
          receiveShadow
        />
        <mesh
          position={[w * 0.35, h * 0.55, 0]}
          geometry={geoBox}
          material={matRubbleDark}
          scale={[w * 0.35, h * 0.45, 0.62]}
          castShadow
          receiveShadow
        />
      </>
    );
  }
  if (kind === 1) {
    // fallen column, lying on its side
    return (
      <mesh
        position={[0, 0.52, 0]}
        rotation={[Math.PI / 2, 0, rnd() * 0.6 - 0.3]}
        geometry={geoDrum}
        material={matRubble}
        scale={[1, 1.4 + rnd() * 1.6, 1]}
        castShadow
        receiveShadow
      />
    );
  }
  return <Rubble rnd={rnd} />;
}

function Scenery() {
  const props = useMemo(() => {
    const rnd = mulberry32(0xca27a6);
    const out: { pos: [number, number, number]; ry: number; kind: number }[] = [];

    // A skirt of debris around each zone, outside the artifact arcs.
    ZONES.forEach((z) => {
      const entrance = Math.atan2(-z.center[0], -z.center[1]);
      for (let i = 0; i < 9; i++) {
        // Keep the entrance corridor clear so the way in still reads.
        const a = entrance + Math.PI + (rnd() - 0.5) * Math.PI * 1.7;
        const r = z.radius * (0.72 + rnd() * 0.55);
        out.push({
          pos: [
            z.center[0] + Math.sin(a) * r,
            0,
            z.center[1] + Math.cos(a) * r,
          ],
          ry: rnd() * Math.PI * 2,
          kind: i % 3,
        });
      }
    });

    // Scatter across the open ground between zones, so the walk is not empty.
    for (let i = 0; i < 130; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 40 + rnd() * 235;
      const x = Math.sin(a) * r;
      const zz = Math.cos(a) * r;
      // Never inside a zone platform or on the signpost plaza.
      const clash =
        Math.hypot(x, zz) < 16 ||
        ZONES.some(
          (z) => Math.hypot(x - z.center[0], zz - z.center[1]) < z.radius + 4
        );
      if (clash) continue;
      out.push({ pos: [x, 0, zz], ry: rnd() * Math.PI * 2, kind: i % 3 });
    }
    return out;
  }, []);

  // Distant silhouettes, sitting deep in the fog so they read as haze-blue
  // landforms rather than as boxes.
  const horizon = useMemo(() => {
    const rnd = mulberry32(0x40f1);
    return Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2 + rnd() * 0.3;
      const r = 340 + rnd() * 100;
      return {
        pos: [Math.sin(a) * r, 0, Math.cos(a) * r] as [number, number, number],
        ry: a,
        s: [
          34 + rnd() * 74,
          4 + rnd() * 11,
          18 + rnd() * 34,
        ] as [number, number, number],
      };
    });
  }, []);

  return (
    <>
      {props.map((p, i) => (
        <group key={i} position={p.pos} rotation={[0, p.ry, 0]}>
          <Prop kind={p.kind} rnd={mulberry32(0x9e37 + i * 2654435761)} />
        </group>
      ))}
      {horizon.map((h, i) => (
        <mesh
          key={i}
          position={[h.pos[0], h.s[1] / 2, h.pos[2]]}
          rotation={[0, h.ry, 0]}
          geometry={geoBox}
          material={matHorizon}
          scale={h.s}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ zone */

/**
 * The zone name, readable from across the map but shrinking away as you walk
 * in: at world scale a 4-unit glyph fills the screen from ten metres, and the
 * architecture already tells you where you are once you are inside.
 */
function ZoneLabel({ zone }: { zone: Zone }) {
  const ref = useRef<THREE.Group>(null);
  const [cx, cz] = zone.center;

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const d = Math.hypot(live.x - cx, live.z - cz);
    const inner = zone.radius * 0.5;
    const t = THREE.MathUtils.clamp((d - inner) / 55, 0, 1);
    g.scale.setScalar(t);
    g.visible = t > 0.02;
  });

  return (
    // Anchored at the zone centre, so shrinking scales the label in place
    // rather than dragging it toward the world origin.
    <group ref={ref} position={[cx, 0, cz]}>
      {/* Billboarded, so the label never reads mirrored from behind. */}
      <Billboard position={[0, 12, 0]}>
        <Text
          fontSize={4.2}
          color="#2d2419"
          outlineWidth={0.12}
          outlineColor="#f3ead9"
          anchorX="center"
          anchorY="middle"
          maxWidth={40}
        >
          {zone.label}
        </Text>
      </Billboard>
      <Billboard position={[0, 8.6, 0]}>
        <Text
          fontSize={1.5}
          color="#4a3d2b"
          outlineWidth={0.05}
          outlineColor="#f3ead9"
          anchorX="center"
          anchorY="middle"
          maxWidth={44}
        >
          {zone.sublabel}
        </Text>
      </Billboard>
    </group>
  );
}

function ZoneBuild({ zone }: { zone: Zone }) {
  const [cx, cz] = zone.center;
  const cols = useMemo(() => {
    const n = zone.style === "pavilion" ? 8 : 12;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [
        cx + Math.sin(a) * (zone.radius - 3),
        cz + Math.cos(a) * (zone.radius - 3),
      ] as [number, number];
    });
  }, [cx, cz, zone.radius, zone.style]);

  return (
    <group>
      {/* Platform, as two nested steps: a single slab meets the ground on a
          hard straight line and reads as a placeholder block. */}
      <mesh
        position={[cx, 0.09, cz]}
        geometry={geoBox}
        material={zone.style === "pavilion" ? matGhost : matRubble}
        scale={[zone.radius * 2.16, 0.18, zone.radius * 2.16]}
        receiveShadow
        castShadow
      />
      <mesh
        position={[cx, 0.26, cz]}
        geometry={geoBox}
        material={zone.style === "pavilion" ? matGhost : matStoneDark}
        scale={[zone.radius * 2, 0.34, zone.radius * 2]}
        receiveShadow
        castShadow
      />

      {zone.style === "roman" &&
        cols.map(([x, z], i) => (
          <group key={i}>
            <mesh
              position={[x, 3.8, z]}
              geometry={geoColumn}
              material={matStone}
              castShadow
              receiveShadow
            />
            <mesh
              position={[x, 0.45, z]}
              geometry={geoBox}
              material={matStoneDark}
              scale={[1.6, 0.6, 1.6]}
              castShadow
              receiveShadow
            />
          </group>
        ))}

      {zone.style === "islamic" &&
        cols.map(([x, z], i) => {
          const a = Math.atan2(x - cx, z - cz);
          return (
            <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}>
              <mesh
                position={[0, 3, 0]}
                geometry={geoBox}
                material={matStone}
                scale={[6, 6, 0.8]}
                castShadow
                receiveShadow
              />
              <mesh
                position={[0, 2.4, 0.1]}
                geometry={geoBox}
                material={matAccent}
                scale={[2.6, 4.4, 0.9]}
                castShadow
                receiveShadow
              />
              <mesh
                position={[0, 6.4, 0]}
                geometry={geoBox}
                material={matStoneDark}
                scale={[6.6, 0.8, 1.2]}
                castShadow
                receiveShadow
              />
            </group>
          );
        })}

      {zone.style === "pavilion" &&
        cols.map(([x, z], i) => (
          <mesh
            key={i}
            position={[x, 2.6, z]}
            geometry={geoBox}
            material={matGhost}
            scale={[0.4, 5, 0.4]}
          />
        ))}

      <ZoneLabel zone={zone} />
    </group>
  );
}

/* --------------------------------------------------------- spawn plaza */

/**
 * A signpost at the world centre. Without it a first-time visitor spawns on an
 * empty plain with no idea which way anything is.
 */
function Signpost() {
  const arms = ZONES.filter((z) => z.id !== "unplaced").concat(
    ZONES.filter((z) => z.id === "unplaced")
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.96} metalness={0} />
      </mesh>
      <mesh
        position={[0, 3, 0]}
        geometry={geoBox}
        material={matStone}
        scale={[0.5, 6, 0.5]}
        castShadow
        receiveShadow
      />

      {arms.map((z, i) => {
        const bearing = Math.atan2(z.center[0], z.center[1]);
        const dist = Math.round(Math.hypot(z.center[0], z.center[1]));
        const y = 5.3 - i * 0.82;
        return (
          <group key={z.id} rotation={[0, bearing, 0]} position={[0, y, 0]}>
            <mesh
              position={[0, 0, 2.3]}
              geometry={geoBox}
              scale={[0.14, 0.62, 4.4]}
              material={matStone}
              castShadow
              receiveShadow
            />
            {/* One copy per face, each front-facing only, so the mirrored
                copy never bleeds through from the other side. */}
            {[
              [0, 4.46],
              [Math.PI, 4.34],
            ].map(([ry, zz]) => (
              <Text
                key={ry}
                position={[0, 0, zz]}
                rotation={[0, ry, 0]}
                fontSize={0.5}
                letterSpacing={0.04}
                color="#2d2419"
                anchorX="center"
                anchorY="middle"
                material-side={THREE.FrontSide}
                material-transparent={false}
              >
                {`${z.short.toUpperCase()}  ${dist}m`}
              </Text>
            ))}
          </group>
        );
      })}

      <Billboard position={[0, 7.2, 0]}>
        <Text
          fontSize={1.1}
          color="#2d2419"
          outlineWidth={0.04}
          outlineColor="#f3ead9"
          anchorX="center"
          anchorY="middle"
        >
          IFRIQIYA
        </Text>
      </Billboard>
      <Billboard position={[0, 6.3, 0]}>
        <Text
          fontSize={0.42}
          color="#4a3d2b"
          outlineWidth={0.02}
          outlineColor="#f3ead9"
          anchorX="center"
          anchorY="middle"
          maxWidth={16}
        >
          Bearings are real. Distances are compressed for walking.
        </Text>
      </Billboard>
    </group>
  );
}

/* -------------------------------------------------------------- artifact */

function LocalModel({ uid, reduceMotion }: { uid: string; reduceMotion: boolean }) {
  const { scene } = useGLTF(`/models/${uid}.glb`);
  const ref = useRef<THREE.Group>(null);

  const obj = useMemo(() => {
    const clone = scene.clone(true);
    const ov = OVERRIDES[uid];
    if (ov?.rotation) clone.rotation.set(...ov.rotation);
    fitToBox(clone, ov?.height ?? 2);
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, uid]);

  useFrame((_, dt) => {
    if (ref.current && !reduceMotion) ref.current.rotation.y += dt * 0.25;
  });

  return (
    <group ref={ref}>
      <primitive object={obj} />
    </group>
  );
}

/**
 * A framed card carrying the Sketchfab thumbnail, for any model without a
 * local .glb. Sized from the image's own aspect ratio once it has decoded.
 */
function ThumbCard({
  url,
  base,
  fan,
  tilt,
}: {
  url: string;
  base: number;
  fan: number;
  tilt: number;
}) {
  const [state, setState] = useState<{ tex: THREE.Texture; ar: number } | null>(
    null
  );

  useEffect(() => {
    let dead = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        if (dead) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
        const img = t.image as { width?: number; height?: number } | undefined;
        const ar =
          img && img.width && img.height ? img.width / img.height : 16 / 9;
        setState({ tex: t, ar });
      },
      undefined,
      () => {
        /* a thumbnail that will not load just leaves the frame empty */
      }
    );
    return () => {
      dead = true;
    };
  }, [url]);

  const h = 1.25;
  const w = h * (state?.ar ?? 16 / 9);

  return (
    <group position={[0, base + 1.35, 0]} rotation={[tilt, fan, 0]}>
      {/* frame */}
      <mesh
        geometry={geoBox}
        material={matFrame}
        scale={[w + 0.16, h + 0.16, 0.08]}
        castShadow
        receiveShadow
      />
      {/* Tinted: Sketchfab thumbnails sit on pure white, and a row of pure
          white rectangles reads as floating UI rather than as objects. */}
      {state && (
        <mesh position={[0, 0, 0.05]} geometry={geoPlane} scale={[w, h, 1]}>
          <meshBasicMaterial
            map={state.tex}
            color="#e3d8c2"
            toneMapped={false}
          />
        </mesh>
      )}
      {/* stem down to the plinth */}
      <mesh
        position={[0, -h / 2 - 0.45, 0]}
        geometry={geoBox}
        material={matFrame}
        scale={[0.1, 0.95, 0.1]}
        castShadow
      />
    </group>
  );
}

function Artifact({
  model,
  near,
  showThumb,
  reduceMotion,
}: {
  model: PlacedModel;
  near: boolean;
  showThumb: boolean;
  reduceMotion: boolean;
}) {
  const j = useMemo(() => jitter(model.uid), [model.uid]);

  return (
    <group position={model.pos} rotation={[0, model.facing + j.spin, 0]}>
      <mesh
        position={[0, j.height / 2, 0]}
        geometry={geoPlinth}
        material={matPlinth}
        scale={[1, j.height, 1]}
        castShadow
        receiveShadow
      />
      {near && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.9, 24]} />
          <meshBasicMaterial color="#ffd27f" transparent opacity={0.9} />
        </mesh>
      )}

      {model.hasLocal ? (
        <Suspense
          fallback={
            <mesh
              position={[0, j.height + 1, 0]}
              geometry={geoBox}
              material={matGhost}
              scale={[1.2, 2, 1.2]}
            />
          }
        >
          <group position={[0, j.height, 0]}>
            <LocalModel uid={model.uid} reduceMotion={reduceMotion} />
          </group>
        </Suspense>
      ) : showThumb && model.thumbnail ? (
        <ThumbCard
          url={model.thumbnail}
          base={j.height}
          fan={j.fan}
          tilt={j.tilt}
        />
      ) : (
        // Too far away to be worth a thumbnail download: a marker post only.
        <mesh
          position={[0, j.height + 1.1, 0]}
          geometry={geoBox}
          material={matGhost}
          scale={[0.9, 2.2, 0.35]}
        />
      )}
    </group>
  );
}

/* ----------------------------------------------------------------- world */

function Artifacts({
  artifacts,
  nearUid,
  reduceMotion,
}: {
  artifacts: PlacedModel[];
  nearUid: string | null;
  reduceMotion: boolean;
}) {
  // Distance gating, recomputed a few times a second. Keeps draw calls and
  // thumbnail downloads proportional to where the player actually is.
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [thumbed, setThumbed] = useState<Set<string>>(new Set());
  const acc = useRef(0);

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.4) return;
    acc.current = 0;
    const v = new Set<string>();
    const t = new Set<string>();
    for (const a of artifacts) {
      const dx = a.pos[0] - live.x;
      const dz = a.pos[2] - live.z;
      const dd = dx * dx + dz * dz;
      if (dd < 130 * 130) v.add(a.uid);
      if (dd < 55 * 55) t.add(a.uid);
    }
    setVisible((prev) => (sameSet(prev, v) ? prev : v));
    setThumbed((prev) => (sameSet(prev, t) ? prev : t));
  });

  return (
    <>
      {artifacts.map((a) =>
        visible.has(a.uid) ? (
          <Artifact
            key={a.uid}
            model={a}
            near={a.uid === nearUid}
            showThumb={thumbed.has(a.uid)}
            reduceMotion={reduceMotion}
          />
        ) : null
      )}
    </>
  );
}

function sameSet(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/* ------------------------------------------------------------------ main */

export function WorldCanvas({
  artifacts,
  nearUid,
  onNear,
  wantLock,
  walkable,
  onLockChange,
  reduceMotion,
  tourTarget,
  onTourArrive,
  paused,
}: {
  artifacts: PlacedModel[];
  nearUid: string | null;
  onNear: (uid: string | null) => void;
  /** The player wants to be walking. */
  wantLock: boolean;
  /** Movement is allowed, with or without the mouse. */
  walkable: boolean;
  onLockChange: (v: boolean) => void;
  reduceMotion: boolean;
  tourTarget: PlacedModel | null;
  onTourArrive: () => void;
  paused: boolean;
}) {
  const controls = useRef<any>(null);

  useEffect(() => {
    requestPointerLock = () => {
      try {
        controls.current?.lock();
      } catch {
        /* the browser may still refuse; the resume button stays visible */
      }
    };
    return () => {
      requestPointerLock = () => {};
    };
  }, []);

  useEffect(() => {
    if (!controls.current) return;
    if (wantLock && !tourTarget) {
      requestPointerLock();
    } else {
      try {
        controls.current.unlock();
      } catch {
        /* nothing to unlock */
      }
    }
  }, [wantLock, tourTarget]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      camera={{ fov: 70, near: 0.1, far: 900, position: SPAWN }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(HAZE, 90, 430);
        scene.background = new THREE.Color(HAZE);
      }}
    >
      <GradientSky />
      {/* Fill. Without enough of this the sun-facing sides look fine and every
          shaded side reads as a black cut-out, which is worse than no sun. */}
      <hemisphereLight args={["#dfe6f0", "#8a7352", 0.9]} />
      <ambientLight intensity={0.35} color="#f3e6cd" />
      <SunLight />

      <Ground />

      <Scenery />

      <Signpost />

      {ZONES.map((z) => (
        <ZoneBuild key={z.id} zone={z} />
      ))}

      <Artifacts
        artifacts={artifacts}
        nearUid={nearUid}
        reduceMotion={reduceMotion}
      />

      <Player
        artifacts={artifacts}
        active={walkable && !paused && !tourTarget}
        reduceMotion={reduceMotion}
        onNear={onNear}
        tourTarget={tourTarget}
        onTourArrive={onTourArrive}
      />

      <PointerLockControls
        ref={controls}
        onLock={() => onLockChange(true)}
        onUnlock={() => onLockChange(false)}
      />
    </Canvas>
  );
}

/* ------------------------------------------------- examine-mode viewer */

export function InspectCanvas({ uid }: { uid: string }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 45, position: [0, 1.4, 4.2] }}>
      <color attach="background" args={["#efe7d8"]} />
      <hemisphereLight args={["#ffffff", "#9a8a6e", 1.1]} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} />
      <Suspense fallback={null}>
        <InspectModel uid={uid} />
      </Suspense>
      <OrbitControls
        target={[0, 1, 0]}
        enablePan={false}
        minDistance={1.5}
        maxDistance={9}
        makeDefault
      />
    </Canvas>
  );
}

function InspectModel({ uid }: { uid: string }) {
  const { scene } = useGLTF(`/models/${uid}.glb`);
  const obj = useMemo(() => {
    const clone = scene.clone(true);
    const ov = OVERRIDES[uid];
    if (ov?.rotation) clone.rotation.set(...ov.rotation);
    fitToBox(clone, 2);
    return clone;
  }, [scene, uid]);
  return <primitive object={obj} />;
}
