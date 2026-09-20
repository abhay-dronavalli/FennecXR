import { palette } from '../palette.js'

const trees = [
  [-12, 0, 11], [-11, 0, 6], [11, 0, 13], [12, 0, 8],
  [-12, 0, 27], [12, 0, 28], [-12, 0, 38], [12, 0, 40],
  [-12, 0, -12], [12, 0, -11], [-11, 0, 44], [11, 0, 44],
]

const rocks = [
  [-12, 0.35, -7, 0.9], [12, 0.25, -8, 0.65], [-6, 0.3, 16, 0.8],
  [12, 0.28, 22, 0.7], [-11, 0.3, 34, 0.75], [11, 0.35, 37, 0.95],
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
    </group>
  )
}
