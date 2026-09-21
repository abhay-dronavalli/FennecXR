import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { architecturalBox, surfaces } from './materials.js'

function Block({ position, scale, color = palette.sand, surface = 'earth' }) {
  const [w, h, d] = scale
  const geometry = useMemo(() => architecturalBox([w, h, d]), [w, h, d])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh receiveShadow position={position} geometry={geometry}>
      <meshStandardMaterial color={color} {...surfaces[surface]} bumpScale={0.025} roughness={0.96} />
    </mesh>
  )
}

function CoastalGround() {
  const geometry = useMemo(() => {
    const land = new THREE.PlaneGeometry(100, 120, 64, 72)
    land.rotateX(-Math.PI / 2)
    const pos = land.attributes.position
    const uv = land.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const edge = Math.max(Math.abs(x) / 48, Math.abs(z + 6) / 64)
      const slope = THREE.MathUtils.smoothstep(edge, 0.6, 1)
      const ripple = Math.sin(x * 0.38) * Math.cos(z * 0.29) * 0.14 * slope
      pos.setY(i, -0.22 - slope * 2.8 + ripple)
      uv.setXY(i, x / 2, z / 2)
    }
    land.computeVertexNormals()
    return land
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={palette.sand} {...surfaces.earth} bumpScale={0.05} roughness={1} /></mesh>
}

export default function Terrain() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <planeGeometry args={[480, 480]} />
        <meshStandardMaterial color={palette.sea} roughness={0.38} metalness={0.12} />
      </mesh>
      <CoastalGround />
      <Block position={[0, -0.6, -6]} scale={[49, 1.2, 61]} />
      <Block position={[0, -0.65, -25]} scale={[27, 0.9, 12]} color={palette.stoneDark} surface="masonry" />
      <Block position={[0, 0.02, -16.5]} scale={[7, 0.04, 7]} surface="paving" />
      {[-1, 1].map(side => (
        <Block key={side} position={[side * 3.45, 0.015, -16.5]} scale={[0.16, 0.08, 7]} color={palette.stone} surface="stone" />
      ))}
    </group>
  )
}
