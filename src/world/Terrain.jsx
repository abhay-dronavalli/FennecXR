import { palette } from '../palette.js'

function Block({ position, scale, color = palette.sand }) {
  return (
    <mesh receiveShadow position={position} scale={scale}>
      <boxGeometry />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

export default function Terrain() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={palette.sea} flatShading />
      </mesh>

      <Block position={[0, -0.55, 1]} scale={[28, 1.1, 30]} />
      <Block position={[0, -0.65, -25]} scale={[27, 0.9, 12]} color={palette.stoneDark} />

      <Block position={[0, -0.5, -16.5]} scale={[7, 0.95, 7]} />
    </group>
  )
}
