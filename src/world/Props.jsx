import { palette } from '../palette.js'

const trees = [
  [-14, 0, 11], [-18, 0, 6], [13, 0, 13], [17, 0, 8],
  [-12, 0, 27], [12, 0, 28], [-14, 0, 38], [14, 0, 40],
  [-23, 0, -13], [-39, 0, 7], [24, 0, -12], [39, 0, 8],
]

const rocks = [
  [-12, 0.35, -7, 0.9], [14, 0.25, -8, 0.65], [-20, 0.3, 16, 0.8],
  [18, 0.28, 20, 0.7], [-40, 0.3, -8, 0.75], [40, 0.35, 5, 0.95],
]

function Cypress({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 2, 6]} />
        <meshStandardMaterial color={palette.stoneDark} flatShading />
      </mesh>
      <mesh castShadow position={[0, 3.25, 0]}>
        <coneGeometry args={[1.05, 4.8, 7]} />
        <meshStandardMaterial color={palette.cypress} flatShading />
      </mesh>
    </group>
  )
}

export default function Props() {
  return (
    <group>
      {trees.map((position, index) => <Cypress key={index} position={position} />)}
      {rocks.map(([x, y, z, scale], index) => (
        <mesh key={index} castShadow receiveShadow position={[x, y, z]} scale={scale} rotation={[index, index * 0.7, 0]}>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color={palette.stoneDark} flatShading />
        </mesh>
      ))}
      {[-5, 0, 5].map((x) => (
        <group key={x} position={[x, 0, 13]}>
          <mesh castShadow position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.7, 0.82, 2.4, 8]} />
            <meshStandardMaterial color={palette.stone} flatShading />
          </mesh>
          <mesh castShadow position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.92, 0.78, 0.45, 8]} />
            <meshStandardMaterial color={palette.stoneDark} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
