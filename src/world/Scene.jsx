import { AdaptiveDpr, PointerLockControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { useExperienceStore } from '../store.js'
import Player from './Player.jsx'
import Terrain from './Terrain.jsx'
import Props from './Props.jsx'
import Artifact from './Artifact.jsx'
import HeritageStructures from './HeritageStructures.jsx'

const timePresets = {
  dawn: {
    background: '#cc7355', horizon: '#f3a36c', zenith: '#52627d', fog: '#c98263',
    hemisphere: '#edb38b', ground: '#514550', ambient: 1.55,
    sun: '#ffd2ad', sunIntensity: 1.9, sunPosition: [-38, 8, 28], exposure: 0.88,
  },
  day: {
    background: '#76a9c4', horizon: '#eacb98', zenith: '#5794bd', fog: '#d7c19d',
    hemisphere: '#e5ece7', ground: '#8f826f', ambient: 1.65,
    sun: '#fff1cf', sunIntensity: 2.5, sunPosition: [-28, 19, 22], exposure: 0.84,
  },
  dusk: {
    background: '#d47b4d', horizon: '#f06029', zenith: '#472140', fog: '#d98b5b',
    hemisphere: '#e7a06a', ground: '#584350', ambient: 1.7,
    sun: '#ffd09a', sunIntensity: 2.35, sunPosition: [-42, 10, 32], exposure: 0.9,
  },
  night: {
    background: '#10182c', horizon: '#34445b', zenith: '#090f21', fog: '#273342',
    hemisphere: '#52627b', ground: '#171722', ambient: 0.85,
    sun: '#9eabd0', sunIntensity: 0.55, sunPosition: [24, 18, -30], exposure: 0.78,
  },
}

function GradientSky({ horizon, zenith }) {
  const uniforms = useMemo(() => ({
    horizonColor: { value: new THREE.Color(horizon) },
    zenithColor: { value: new THREE.Color(zenith) },
  }), [horizon, zenith])

  return (
    <mesh scale={180} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
  const artifactPositions = useMemo(
    () => content.artifacts.map((artifact) => ({ artifact, vector: new THREE.Vector3(...artifact.position) })),
    [content.artifacts],
  )
  let lastNearestId = null
  let lastZoneId = 'byrsa'

  useEffect(() => {
    gl.toneMappingExposure = preset.exposure
  }, [gl, preset.exposure])

  useFrame(() => {
    let nearest = null
    let nearestDistance = 3.8
    artifactPositions.forEach(({ artifact, vector }) => {
      const distance = camera.position.distanceTo(vector)
      if (distance < nearestDistance) {
        nearest = artifact
        nearestDistance = distance
      }
    })
    const nextId = nearest?.id ?? null
    if (nextId !== lastNearestId) {
      lastNearestId = nextId
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
    if (closestZone.id !== lastZoneId) {
      lastZoneId = closestZone.id
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
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
      />
      <Terrain />
      <Props />
      <HeritageStructures />
      {content.artifacts.map((artifact) => <Artifact key={artifact.id} artifact={artifact} />)}
      <Player />
      <PointerLockControls selector=".experience-shell canvas" />
    </>
  )
}

export default function Scene({ content }) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop="always"
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{ position: content.zones[0].spawn, fov: 60, near: 0.1, far: 260 }}
      dpr={[1, 2]}
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
      }}
    >
      <Suspense fallback={null}>
        <World content={content} />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
