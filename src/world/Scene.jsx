import { AdaptiveDpr, PointerLockControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { useExperienceStore } from '../store.js'
import Player from './Player.jsx'
import Terrain from './Terrain.jsx'
import Props from './Props.jsx'
import Artifact from './Artifact.jsx'
import HeritageStructures from './HeritageStructures.jsx'

function EveningSky() {
  return (
    <mesh scale={180} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        vertexShader={`
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vDirection;
          void main() {
            vec3 direction = normalize(vDirection);
            float height = smoothstep(-0.08, 0.9, direction.y);
            vec3 horizon = vec3(0.94, 0.38, 0.16);
            vec3 zenith = vec3(0.28, 0.13, 0.25);
            vec3 dusk = mix(horizon, zenith, height);
            vec3 sunDirection = normalize(vec3(-0.78, 0.08, 0.52));
            float glow = pow(max(dot(direction, sunDirection), 0.0), 24.0);
            dusk += vec3(1.0, 0.28, 0.06) * glow * 0.75;
            gl_FragColor = vec4(dusk, 1.0);
          }
        `}
      />
    </mesh>
  )
}

function World({ content }) {
  const setNearestArtifact = useExperienceStore((state) => state.setNearestArtifact)
  const setCurrentZone = useExperienceStore((state) => state.setCurrentZone)
  const { camera } = useThree()
  const artifactPositions = useMemo(
    () => content.artifacts.map((artifact) => ({ artifact, vector: new THREE.Vector3(...artifact.position) })),
    [content.artifacts],
  )
  let lastNearestId = null
  let lastZoneId = 'byrsa'

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
      <color attach="background" args={['#d47b4d']} />
      <EveningSky />
      <fog attach="fog" args={['#d98b5b', 66, 150]} />
      <hemisphereLight args={['#e7a06a', '#584350', 1.7]} />
      <directionalLight
        castShadow
        color="#ffd09a"
        intensity={2.35}
        position={[-42, 10, 32]}
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
      <PointerLockControls selector="#enter-world" />
    </>
  )
}

export default function Scene({ content }) {
  return (
    <Canvas
      aria-hidden="true"
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{ position: content.zones[0].spawn, fov: 60, near: 0.1, far: 260 }}
      dpr={[0.75, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
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
