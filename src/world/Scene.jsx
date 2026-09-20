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
      <color attach="background" args={[palette.skyHigh]} />
      <fog attach="fog" args={[palette.skyWarm, 42, 105]} />
      <hemisphereLight args={[palette.skyHigh, palette.stoneDark, 1.35]} />
      <directionalLight
        castShadow
        color={palette.skyWarm}
        intensity={2.4}
        position={[-28, 18, 22]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
      />
      <Terrain />
      <Props />
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
      camera={{ position: content.zones[0].spawn, fov: 60, near: 0.1, far: 180 }}
      dpr={[0.75, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <Suspense fallback={null}>
        <World content={content} />
      </Suspense>
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
