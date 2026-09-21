import { PerformanceMonitor, PointerLockControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useExperienceStore } from '../store.js'
import Player from './Player.jsx'
import Terrain from './Terrain.jsx'
import Enclosure from './Enclosure.jsx'
import Props from './Props.jsx'
import Artifact from './Artifact.jsx'
import HeritageStructures from './HeritageStructures.jsx'

const timePresets = {
  dawn: {
    background: '#cc7355', horizon: '#f3a36c', zenith: '#52627d', fog: '#f3a36c',
    hemisphere: '#edb38b', ground: '#514550', ambient: 1.55,
    sun: '#ffd2ad', sunIntensity: 1.9, sunPosition: [-38, 8, 28], exposure: 0.88,
  },
  day: {
    background: '#76a9c4', horizon: '#c5d9dd', zenith: '#5794bd', fog: '#c5d9dd',
    hemisphere: '#e5ece7', ground: '#8f826f', ambient: 1.25,
    sun: '#fff1cf', sunIntensity: 2.5, sunPosition: [-28, 19, 22], exposure: 0.84,
  },
  dusk: {
    background: '#b6a5a0', horizon: '#e1b597', zenith: '#657a99', fog: '#e1b597',
    hemisphere: '#e7b78e', ground: '#584350', ambient: 1.3,
    sun: '#ffd09a', sunIntensity: 2.35, sunPosition: [-42, 10, 32], exposure: 0.9,
  },
  night: {
    background: '#10182c', horizon: '#34445b', zenith: '#090f21', fog: '#34445b',
    hemisphere: '#52627b', ground: '#171722', ambient: 0.85,
    sun: '#9eabd0', sunIntensity: 0.55, sunPosition: [24, 18, -30], exposure: 0.78,
  },
}

const templeRotation = Math.PI
const upAxis = new THREE.Vector3(0, 1, 0)

function isVisibleArtifact(artifact) {
  return Boolean(artifact.model) || artifact.id === 'bird-of-prey-villas'
}

function GradientSky({ horizon, zenith }) {
  const uniforms = useMemo(() => ({
    horizonColor: { value: new THREE.Color(horizon) },
    zenithColor: { value: new THREE.Color(zenith) },
  }), [horizon, zenith])

  return (
    <mesh scale={240} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            // Remove camera translation and pin the sky to the far depth plane.
            // Elevated overview cameras must not clip through the sky sphere.
            vec4 clip = projectionMatrix * mat4(mat3(viewMatrix)) * modelMatrix * vec4(position, 1.0);
            gl_Position = clip.xyww;
          }
        `}
        fragmentShader={`
          varying vec3 vDirection;
          uniform vec3 horizonColor;
          uniform vec3 zenithColor;
          void main() {
            vec3 direction = normalize(vDirection);
            float height = smoothstep(-0.08, 0.9, direction.y);
            vec3 sky = mix(horizonColor, zenithColor, height);
            gl_FragColor = vec4(sky, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  )
}

function World({ content }) {
  const setNearestArtifact = useExperienceStore((state) => state.setNearestArtifact)
  const setCurrentZone = useExperienceStore((state) => state.setCurrentZone)
  const timeOfDay = useExperienceStore((state) => state.timeOfDay)
  const preset = timePresets[timeOfDay] ?? timePresets.dusk
  const { camera, gl } = useThree()
  const visibleArtifacts = useMemo(
    () => content.artifacts.filter(isVisibleArtifact),
    [content.artifacts],
  )
  const artifactPositions = useMemo(
    () => visibleArtifacts.map((artifact) => {
      const vector = new THREE.Vector3(...artifact.position)
      vector.y += artifact.focusHeight ?? 0
      if (artifact.zone === 'temple') vector.applyAxisAngle(upAxis, templeRotation)
      return { artifact, vector }
    }),
    [visibleArtifacts],
  )
  const lookDirection = useMemo(() => new THREE.Vector3(), [])
  const toArtifact = useMemo(() => new THREE.Vector3(), [])
  const lastNearestId = useRef(null)
  const lastZoneId = useRef(null)
  const interactionElapsed = useRef(0)

  useEffect(() => {
    gl.toneMappingExposure = preset.exposure
    gl.shadowMap.needsUpdate = true
  }, [gl, preset])

  useFrame((_, delta) => {
    interactionElapsed.current += delta
    if (interactionElapsed.current < 0.1) return
    interactionElapsed.current = 0
    let nearest = null
    let bestScore = Infinity
    camera.getWorldDirection(lookDirection)
    artifactPositions.forEach(({ artifact, vector }) => {
      const distance = camera.position.distanceTo(vector)
      const alignment = toArtifact.copy(vector).sub(camera.position).normalize().dot(lookDirection)
      // Prefer the exhibit being viewed over a closer column beside the player.
      const score = distance + (1 - alignment) * 6
      if (distance < 3.8 && alignment > 0.5 && score < bestScore) {
        nearest = artifact
        bestScore = score
      }
    })
    const nextId = nearest?.id ?? null
    if (nextId !== lastNearestId.current) {
      lastNearestId.current = nextId
      setNearestArtifact(nearest)
    }

    let closestZone = content.zones[0]
    let closestDistance = Infinity
    content.zones.forEach((zone) => {
      const dx = camera.position.x - zone.center[0]
      const dz = camera.position.z - zone.center[2]
      const distance = dx * dx + dz * dz
      if (distance < closestDistance) {
        closestDistance = distance
        closestZone = zone
      }
    })
    // A nearby exhibit belongs to its display zone even along a zone's edge.
    closestZone = content.zones.find((zone) => zone.id === nearest?.zone) ?? closestZone
    if (closestZone.id !== lastZoneId.current) {
      lastZoneId.current = closestZone.id
      setCurrentZone(closestZone.id)
    }
  })

  return (
    <>
      <color attach="background" args={[preset.background]} />
      <GradientSky horizon={preset.horizon} zenith={preset.zenith} />
      <fog attach="fog" args={[preset.fog, 66, 150]} />
      <hemisphereLight args={[preset.hemisphere, preset.ground, preset.ambient]} />
      <directionalLight
        castShadow
        color={preset.sun}
        intensity={preset.sunIntensity}
        position={preset.sunPosition}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
        shadow-camera-near={0.5}
        shadow-camera-far={140}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
      />
      <Terrain />
      <Enclosure />
      <Props />
      <HeritageStructures />
      <group rotation={[0, templeRotation, 0]}>
        {visibleArtifacts
          .filter((artifact) => artifact.zone === 'temple')
          .map((artifact) => <Artifact key={artifact.id} artifact={artifact} />)}
      </group>
      {visibleArtifacts
        .filter((artifact) => artifact.zone !== 'temple')
        .map((artifact) => <Artifact key={artifact.id} artifact={artifact} />)}
      <Player />
      <PointerLockControls selector=".experience-shell canvas" />
    </>
  )
}

export default function Scene({ content }) {
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, 1.5))
  return (
    <Canvas
      aria-hidden="true"
      frameloop="always"
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{ position: content.zones[0].spawn, rotation: [0, Math.PI, 0], fov: 60, near: 0.1, far: 260 }}
      dpr={dpr}
      gl={{
        alpha: false,
        antialias: true,
        depth: true,
        failIfMajorPerformanceCaveat: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.9
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
      }}
    >
      <Suspense fallback={null}>
        <World content={content} />
      </Suspense>
      <PerformanceMonitor bounds={() => [35, 55]} flipflops={4}
        onChange={({ factor }) => setDpr(Math.min(window.devicePixelRatio, 0.75 + factor * 0.75))}
        onFallback={() => setDpr(Math.min(window.devicePixelRatio, 1))} />
    </Canvas>
  )
}
