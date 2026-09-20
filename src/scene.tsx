import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PointerLockControls,
  Sky,
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
const CODE_ALIASES: Record<string, string> = {
  ArrowUp: "KeyW",
  ArrowDown: "KeyS",
  ArrowLeft: "KeyA",
  ArrowRight: "KeyD",
};

export function installMovementKeys() {
  const down = (e: KeyboardEvent) => {
    keys[CODE_ALIASES[e.code] ?? e.code] = true;
  };
  const up = (e: KeyboardEvent) => {
    keys[CODE_ALIASES[e.code] ?? e.code] = false;
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

const matStone = new THREE.MeshLambertMaterial({ color: STONE });
const matStoneDark = new THREE.MeshLambertMaterial({ color: STONE_DARK });
const matAccent = new THREE.MeshLambertMaterial({ color: ACCENT });
const matPlinth = new THREE.MeshLambertMaterial({ color: "#d8cdb8" });
const matGhost = new THREE.MeshLambertMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.22,
});

const geoColumn = new THREE.CylinderGeometry(0.45, 0.55, 7, 10);
const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoPlinth = new THREE.CylinderGeometry(0.85, 0.95, 1, 12);
const geoPlane = new THREE.PlaneGeometry(1, 1);

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
      const speed = keys.ShiftLeft || keys.ShiftRight ? base * 2 : base;

      const fwd = Number(!!keys.KeyW) - Number(!!keys.KeyS);
      const str = Number(!!keys.KeyD) - Number(!!keys.KeyA);

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

/* ------------------------------------------------------------------ zone */

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
      {/* platform */}
      <mesh
        position={[cx, 0.15, cz]}
        geometry={geoBox}
        material={zone.style === "pavilion" ? matGhost : matStoneDark}
        scale={[zone.radius * 2, 0.3, zone.radius * 2]}
        receiveShadow
      />

      {zone.style === "roman" &&
        cols.map(([x, z], i) => (
          <group key={i}>
            <mesh position={[x, 3.8, z]} geometry={geoColumn} material={matStone} />
            <mesh
              position={[x, 0.45, z]}
              geometry={geoBox}
              material={matStoneDark}
              scale={[1.6, 0.6, 1.6]}
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
              />
              <mesh
                position={[0, 2.4, 0.1]}
                geometry={geoBox}
                material={matAccent}
                scale={[2.6, 4.4, 0.9]}
              />
              <mesh
                position={[0, 6.4, 0]}
                geometry={geoBox}
                material={matStoneDark}
                scale={[6.6, 0.8, 1.2]}
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

      <Text
        position={[cx, 12, cz]}
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
      <Text
        position={[cx, 8.6, cz]}
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

function Thumb({ url, alt }: { url: string; alt: string }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
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
        setTex(t);
      },
      undefined,
      () => {}
    );
    return () => {
      dead = true;
    };
  }, [url]);

  if (!tex) return null;
  const img = tex.image as { width: number; height: number };
  const ar = img && img.height ? img.width / img.height : 1;
  return (
    <mesh position={[0, 2.3, 0]} geometry={geoPlane} scale={[1.9 * ar, 1.9, 1]}>
      <meshBasicMaterial map={tex} toneMapped={false} transparent />
    </mesh>
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
  return (
    <group position={model.pos} rotation={[0, model.facing, 0]}>
      <mesh position={[0, 0.5, 0]} geometry={geoPlinth} material={matPlinth} />
      {near && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.9, 24]} />
          <meshBasicMaterial color="#ffd27f" transparent opacity={0.9} />
        </mesh>
      )}

      {model.hasLocal ? (
        <Suspense
          fallback={
            <mesh position={[0, 2, 0]} geometry={geoBox} material={matGhost} scale={[1.2, 2, 1.2]} />
          }
        >
          <group position={[0, 1, 0]}>
            <LocalModel uid={model.uid} reduceMotion={reduceMotion} />
          </group>
        </Suspense>
      ) : (
        <>
          <mesh
            position={[0, 1.55, 0]}
            geometry={geoBox}
            material={matGhost}
            scale={[1.1, 1.1, 1.1]}
          />
          {showThumb && model.thumbnail && (
            <Thumb url={model.thumbnail} alt={model.name} />
          )}
          <mesh position={[0, 3.6, 0]} geometry={geoBox} scale={[0.14, 0.9, 0.14]}>
            <meshBasicMaterial color={near ? "#ffd27f" : "#8f7a55"} />
          </mesh>
        </>
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
  locked,
  onLockChange,
  reduceMotion,
  tourTarget,
  onTourArrive,
  paused,
}: {
  artifacts: PlacedModel[];
  nearUid: string | null;
  onNear: (uid: string | null) => void;
  locked: boolean;
  onLockChange: (v: boolean) => void;
  reduceMotion: boolean;
  tourTarget: PlacedModel | null;
  onTourArrive: () => void;
  paused: boolean;
}) {
  const controls = useRef<any>(null);

  useEffect(() => {
    if (!controls.current) return;
    if (locked && !tourTarget) {
      try {
        controls.current.lock();
      } catch {
        /* browser refused the lock; the user can click the canvas */
      }
    } else {
      try {
        controls.current.unlock();
      } catch {
        /* nothing to unlock */
      }
    }
  }, [locked, tourTarget]);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 70, near: 0.1, far: 900, position: SPAWN }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog("#e7d9bd", 160, 560);
        scene.background = new THREE.Color("#e7d9bd");
      }}
    >
      <Sky sunPosition={[80, 40, -60]} turbidity={5} rayleigh={1.2} />
      <hemisphereLight args={["#fff4e0", "#8a7350", 0.9]} />
      <directionalLight position={[60, 90, 40]} intensity={1.1} color="#fff1dc" />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[WORLD_HALF * 2 + 40, WORLD_HALF * 2 + 40]} />
        <meshLambertMaterial color={GROUND} />
      </mesh>
      {/* a lighter inner plate so the playable area reads as bounded */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[WORLD_HALF - 10, 48]} />
        <meshLambertMaterial color={SAND} />
      </mesh>

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
        active={locked && !paused && !tourTarget}
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
