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

      <Block position={[0, -0.55, 0]} scale={[25, 1.1, 25]} />
      <Block position={[0, -0.62, -16]} scale={[22, 0.95, 9]} color={palette.stone} />
      <Block position={[0, -0.72, 31]} scale={[24, 0.65, 23]} color={palette.stone} />
      <Block position={[-31, -0.72, -2]} scale={[22, 0.65, 22]} color={palette.stoneDark} />
      <Block position={[31, -0.78, -2]} scale={[22, 0.55, 22]} color={palette.stone} />

      <Block position={[0, -0.45, 17]} scale={[7, 0.9, 18]} />
      <Block position={[-18, -0.48, -2]} scale={[18, 0.84, 6]} />
      <Block position={[18, -0.48, -2]} scale={[18, 0.84, 6]} />

      <group position={[-31, 0, -2]}>
        <Block position={[-10, 1.25, 0]} scale={[0.7, 2.5, 20]} color={palette.stone} />
        <Block position={[10, 1.25, 0]} scale={[0.7, 2.5, 20]} color={palette.stone} />
        <Block position={[0, 1.25, -10]} scale={[20, 2.5, 0.7]} color={palette.stone} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[45, -0.35, -2]} receiveShadow>
        <circleGeometry args={[32, 7]} />
        <meshStandardMaterial color={palette.sea} flatShading />
      </mesh>
    </group>
  )
}
