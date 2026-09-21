import { palette } from '../palette.js'
import * as THREE from 'three'
import { surfaces } from './materials.js'

const potProfile = [[0.2, 0], [0.24, 0.05], [0.35, 0.32], [0.36, 0.52], [0.31, 0.62], [0.36, 0.65], [0.36, 0.71], [0.29, 0.71], [0.28, 0.61], [0.29, 0.52]].map(([x, y]) => new THREE.Vector2(x, y))

export function Planter({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[potProfile, 24]} />
        <meshStandardMaterial color={palette.terracotta} {...surfaces.stone} bumpScale={0.015} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.29, 24]} />
        <meshStandardMaterial color="#4e4630" roughness={1} />
      </mesh>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} castShadow position={[Math.sin(i * 2.4) * 0.19, 0.72 + i * 0.065, Math.cos(i * 2.4) * 0.19]} scale={[0.25, 0.32, 0.22]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={i % 2 ? '#6d7d50' : palette.cypress} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

const trees = [
  [-12, 0, 11], [-11, 0, 6], [11, 0, 13], [12, 0, 8],
  [-12, 0, -12], [12, 0, -11],
]

const rocks = [
  [-12, 0.35, -7, 0.9], [12, 0.25, -8, 0.65], [-6, 0.3, 16, 0.8],
]

export function Cypress({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 2, 6]} />
        <meshStandardMaterial color={palette.stoneDark} flatShading />
      </mesh>
      {[0, 1, 2].map(i => (
        <mesh key={i} castShadow receiveShadow position={[Math.sin(i * 3) * 0.1, 2.25 + i * 1.05, 0]} scale={[0.85 - i * 0.22, 1.65, 0.85 - i * 0.22]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color={i % 2 ? '#526b4b' : palette.cypress} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export default function Props() {
  return (
    <group>
      {[[-9.8, 0.1, -21.3], [9.8, 0.1, -21.3], [-7.3, 0.1, -26.1], [7.3, 0.1, -26.1]].map((position, i) => <Planter key={`pot-${i}`} position={position} />)}
      {trees.map((position, index) => <Cypress key={index} position={position} />)}
      {rocks.map(([x, y, z, scale], index) => (
        <mesh key={index} castShadow receiveShadow position={[x, y, z]} scale={scale} rotation={[index, index * 0.7, 0]}>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color={palette.stoneDark} flatShading />
        </mesh>
      ))}
    </group>
  )
}
