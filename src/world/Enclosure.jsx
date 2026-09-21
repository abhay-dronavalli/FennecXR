import { useMemo, useEffect } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { Arch, Stone } from './HeritageStructures.jsx'
import { Cypress, Planter } from './Props.jsx'
import { surfaces } from './materials.js'
import { boundaryTowers, enclosure } from './worldLayout.js'

// Rounded merlons rather than generic pointed castle battlements. The form is
// inspired by Sousse's ramparts; this small enclosure is a modern composition.
const merlon = new THREE.Shape()
merlon.moveTo(-0.36, 0)
merlon.lineTo(0.36, 0)
merlon.lineTo(0.36, 0.37)
merlon.absarc(0, 0.37, 0.36, 0, Math.PI, false)
merlon.closePath()

function Battlements({ length, y = 5.35 }) {
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(merlon, { depth: 0.7, bevelEnabled: false, curveSegments: 8 }), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const count = Math.floor(length / 1.55)
  return <group>{Array.from({ length: count }, (_, i) => (
    <mesh key={i} geometry={geometry} castShadow receiveShadow position={[-length / 2 + (i + 0.5) * length / count, y, -0.35]}>
      <meshStandardMaterial color={palette.stone} {...surfaces.stone} roughness={0.94} />
    </mesh>
  ))}</group>
}

function Rampart({ position, length, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Stone position={[0, 2.65, 0]} scale={[length, 5.3, enclosure.thickness]} surface="masonry" />
      <Stone position={[0, 0.35, 0]} scale={[length, 0.7, 1.3]} color={palette.stoneDark} surface="masonry" />
      <Stone position={[0, 5.22, 0]} scale={[length, 0.24, 1.18]} />
      <Battlements length={length} />
    </group>
  )
}

function Tower({ x, z }) {
  return <group position={[x, 0, z]}>
    <Stone position={[0, 3.45, 0]} scale={[3.3, 6.9, 3.3]} surface="masonry" />
    <Stone position={[0, 6.9, 0]} scale={[3.6, 0.24, 3.6]} />
    {[0, 1, 2, 3].map(i => <group key={i} rotation={[0, i * Math.PI / 2, 0]}>
      <group position={[0, 0, 1.4]}><Battlements length={3} y={7} /></group>
      <Stone position={[0, 4.8, 1.659]} scale={[0.14, 0.85, 0.03]} color="#473f32" />
    </group>)}
  </group>
}

function GardenBed({ position }) {
  return <group position={position}>
    <Stone position={[0, 0.1, 0]} scale={[6.2, 0.2, 5.2]} color={palette.stoneDark} />
    <Stone position={[0, 0.21, 0]} scale={[5.8, 0.03, 4.8]} color="#69684b" surface="earth" />
    {[-1, 1].map(side => <group key={side}>
      <Stone position={[side * 3, 0.28, 0]} scale={[0.22, 0.35, 5.2]} />
      <Stone position={[0, 0.28, side * 2.5]} scale={[6.2, 0.35, 0.22]} />
    </group>)}
    <Cypress position={[0, 0.23, 0]} />
    {[-1, 1].map(side => <Planter key={side} position={[side * 2, 0.23, 0]} />)}
  </group>
}

export default function Enclosure() {
  return <group>
    <Rampart position={[0, 0, enclosure.minZ]} length={49} />
    <Rampart position={[0, 0, enclosure.maxZ]} length={49} />
    <Rampart position={[enclosure.minX, 0, -6]} length={60} rotation={Math.PI / 2} />
    <Rampart position={[enclosure.maxX, 0, -6]} length={60} rotation={Math.PI / 2} />
    {boundaryTowers.map(([x, z]) => <Tower key={`${x}-${z}`} x={x} z={z} />)}

    {/* A closed timber gate makes the end of the playable route explicit. */}
    <group position={[0, 0, 23.4]} rotation={[0, Math.PI, 0]}>
      <Arch position={[0, 0, 0]} width={3.1} height={4.2} depth={0.5} />
      <Stone position={[0, 1.95, -0.13]} scale={[2.95, 3.9, 0.13]} color="#654532" />
      {Array.from({ length: 12 }, (_, i) => <Stone key={i} position={[-1.36 + i * 0.247, 1.92, -0.047]} scale={[0.017, 3.8, 0.015]} color="#382b23" />)}
      {[0.6, 1.9, 3.2].map(y => <Stone key={y} position={[0, y, -0.03]} scale={[2.9, 0.07, 0.06]} color="#393730" />)}
    </group>

    {/* A perimeter walk and a garden extend the developed area beyond the scans. */}
    {[-1, 1].map(side => <group key={side}>
      <Stone position={[side * 18, 0.02, -6]} scale={[4, 0.04, 56]} surface="paving" color={palette.sand} />
      <GardenBed position={[side * 9, 0, 16]} />
      <Stone position={[side * 9, 0.5, 20.2]} scale={[4.8, 0.18, 0.75]} />
      {[-1.7, 1.7].map(x => <Stone key={x} position={[side * 9 + x, 0.23, 20.2]} scale={[0.35, 0.46, 0.6]} />)}
      {[-28, -17, 5, 18].map(z => <group key={z} position={[side * 23.15, 0, z]} rotation={[0, -side * Math.PI / 2, 0]}>
        <Arch position={[0, 0, 0]} width={3} height={3.6} depth={0.35} />
      </group>)}
    </group>)}
    <Stone position={[0, 0.02, 21.5]} scale={[37, 0.04, 2.2]} surface="paving" color={palette.sand} />
    <Stone position={[0, 0.02, 16]} scale={[4.5, 0.04, 13]} surface="paving" color={palette.sand} />
    {[[14, 2.7], [6, 2.3]].map(([z, size]) => (
      <Stone key={z} position={[-17, 0.15, z]} scale={[size, 0.3, size]} color={palette.stoneDark} />
    ))}
    {/* A modest timber shade shelters the craft exhibit, separate from the mosque. */}
    <Stone position={[20.4, 0.07, 12]} scale={[4.8, 0.14, 5.8]} surface="paving" color={palette.sand} />
    {[18.2, 22.6].map(x => [9.4, 14.6].map(z => (
      <Stone key={`${x}-${z}`} position={[x, 1.95, z]} scale={[0.16, 3.9, 0.16]} color="#66513b" />
    )))}
    {[9.4, 14.6].map(z => <Stone key={z} position={[20.4, 3.85, z]} scale={[4.9, 0.2, 0.19]} color="#66513b" />)}
    {Array.from({ length: 21 }, (_, i) => <Stone key={`shade-${i}`} position={[20.4, 3.96, 9.3 + i * 0.27]} scale={[4.9, 0.09, 0.15]} color="#a9926d" />)}
    <Html center position={[17.1, 2.7, 12]} distanceFactor={5} className="study-label-wrap">
      <div className="study-heading"><strong>Textile craft · Tunis</strong><span>Tanit XR loom scan · modern display shelter</span></div>
    </Html>
    <Html center position={[0, 1.3, 22.8]} distanceFactor={6} className="study-label-wrap">
      <div className="study-heading"><strong>Walled heritage garden</strong><span>Sousse-inspired ramparts · a modern interpretive setting</span></div>
    </Html>
  </group>
}
