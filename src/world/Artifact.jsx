import { useGLTF } from '@react-three/drei'
import { Component, Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { useExperienceStore } from '../store.js'

function PlaceholderGeometry({ type }) {
  if (type === 'column') return <cylinderGeometry args={[0.6, 0.72, 2.5, 8]} />
  if (type === 'base' || type === 'capital') return <cylinderGeometry args={[0.85, 0.7, 0.8, 8]} />
  if (type === 'statue') return <dodecahedronGeometry args={[0.78, 0]} />
  if (type === 'bust') return <dodecahedronGeometry args={[0.62, 0]} />
  if (type === 'stela' || type === 'stela-row') return <boxGeometry args={[1.15, 2.1, 0.42]} />
  if (type === 'mosaic') return <boxGeometry args={[2.6, 2.6, 0.12]} />
  if (type === 'bird') return <octahedronGeometry args={[0.68, 0]} />
  return <icosahedronGeometry args={[0.8, 0]} />
}

function Placeholder({ artifact, onOpen }) {
  return (
    <mesh
      castShadow
      receiveShadow
      onClick={onOpen}
      onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
      onPointerLeave={() => { document.body.style.cursor = '' }}
    >
      <PlaceholderGeometry type={artifact.placeholder} />
      <meshStandardMaterial color={palette.stoneDark} flatShading roughness={0.95} />
    </mesh>
  )
}

function ScannedModel({ url, fit = 1.8, onOpen }) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(true), [scene])
  const normalization = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const longestSide = Math.max(size.x, size.y, size.z) || 1
    return { center, scale: fit / longestSide }
  }, [clonedScene, fit])

  useEffect(() => {
    clonedScene.traverse((object) => {
      if (!object.isMesh) return
      object.castShadow = true
      object.receiveShadow = true
    })
  }, [clonedScene])

  return (
    <group scale={normalization.scale}>
      <primitive
        object={clonedScene}
        position={normalization.center.clone().multiplyScalar(-1)}
        onClick={onOpen}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
      />
    </group>
  )
}

class ModelBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('Artifact model failed; using its geometric placeholder.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function Artifact({ artifact }) {
  const setActiveArtifact = useExperienceStore((state) => state.setActiveArtifact)
  const interpretationVisible = useExperienceStore((state) => state.interpretationVisible)

  const handleOpen = (event) => {
    event.stopPropagation()
    setActiveArtifact(artifact)
  }
  const placeholder = <Placeholder artifact={artifact} onOpen={handleOpen} />

  return (
    <group position={artifact.position} rotation={artifact.rotation} scale={artifact.scale}>
      {artifact.placement === 'plinth' && (
        <mesh receiveShadow position={[0, -0.72, 0]}>
          <cylinderGeometry args={[0.9, 1, 0.35, 6]} />
          <meshStandardMaterial color={palette.stoneDark} flatShading />
        </mesh>
      )}
      {artifact.model ? (
        <ModelBoundary fallback={placeholder}>
          <Suspense fallback={placeholder}>
            <ScannedModel url={artifact.model} fit={artifact.modelFit} onOpen={handleOpen} />
          </Suspense>
        </ModelBoundary>
      ) : placeholder}
      {interpretationVisible && artifact.id === 'corinthian-capital-byrsa' && (
        <mesh position={[0, 2.8, 0]}>
          <cylinderGeometry args={[0.6, 0.72, 5.2, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
        </mesh>
      )}
    </group>
  )
}
