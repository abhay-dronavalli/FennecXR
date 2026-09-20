import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function ScannedModel({ url, fit = 2.2 }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => scene.clone(true), [scene])
  const ref = useRef()

  const norm = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    return { center, scale: fit / (Math.max(size.x, size.y, size.z) || 1) }
  }, [clone, fit])

  // Gentle auto-rotation when not being dragged
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15
  })

  return (
    <group ref={ref} scale={norm.scale}>
      <primitive object={clone} position={norm.center.clone().multiplyScalar(-1)} />
    </group>
  )
}

function PlaceholderModel({ type }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.15 })

  let geo
  if (type === 'column')                         geo = <cylinderGeometry args={[0.6, 0.72, 2.5, 8]} />
  else if (type === 'base' || type === 'capital') geo = <cylinderGeometry args={[0.85, 0.7, 0.8, 8]} />
  else if (type === 'statue')                     geo = <dodecahedronGeometry args={[0.78, 0]} />
  else if (type === 'bust')                       geo = <dodecahedronGeometry args={[0.62, 0]} />
  else if (type === 'stela' || type === 'stela-row') geo = <boxGeometry args={[1.15, 2.1, 0.42]} />
  else if (type === 'mosaic')                     geo = <boxGeometry args={[2.6, 2.6, 0.12]} />
  else if (type === 'bird')                       geo = <octahedronGeometry args={[0.68, 0]} />
  else                                            geo = <icosahedronGeometry args={[0.8, 0]} />

  return (
    <mesh ref={ref}>
      {geo}
      <meshStandardMaterial color="#A89377" flatShading roughness={0.9} />
    </mesh>
  )
}

export default function ArtifactViewer({ artifact, onClose }) {
  return (
    <div className="artifact-viewer">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.8, 4], fov: 45 }}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1
        }}
      >
        <color attach="background" args={['#1a1510']} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 6, 3]} intensity={2.5} />
        <directionalLight position={[-3, 2, -4]} intensity={0.8} color="#8ab4c8" />
        <Suspense fallback={null}>
          {artifact.model
            ? <ScannedModel url={artifact.model} fit={artifact.modelFit ?? 2.2} />
            : <PlaceholderModel type={artifact.placeholder} />}
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={10}
          autoRotate={false}
        />
      </Canvas>

      <div className="artifact-viewer__hud">
        <div className="artifact-viewer__info">
          <h2>{artifact.title}</h2>
          <p>{artifact.findSite}</p>
        </div>
        <button className="artifact-viewer__back" onClick={onClose}>
          ← Back to world
        </button>
      </div>

      <div className="artifact-viewer__hint">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  )
}
