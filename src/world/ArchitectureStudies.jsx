import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { palette } from '../palette.js'

function StoneBox({ position, scale, color = palette.stone }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale}>
      <boxGeometry />
      <meshStandardMaterial color={color} flatShading roughness={0.95} />
    </mesh>
  )
}

function Column({ position, height = 1.5, radius = 0.12 }) {
  return (
    <mesh castShadow position={position}>
      <cylinderGeometry args={[radius, radius * 1.12, height, 8]} />
      <meshStandardMaterial color={palette.stone} flatShading roughness={0.95} />
    </mesh>
  )
}

function StudyLabel({ study, position }) {
  return (
    <Html center position={position} distanceFactor={10} className="study-label-wrap">
      <div className="study-label">
        <strong>{study.title}</strong>
        <span>{study.place}</span>
        <small>Interpretive study · not a reconstruction</small>
      </div>
    </Html>
  )
}

function KairouanStudy({ study }) {
  const porticoColumns = [-2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25]
  return (
    <group position={[-7.2, 0.18, -16]} scale={0.82}>
      <StoneBox position={[0, -0.12, 0]} scale={[6.2, 0.24, 4.4]} color={palette.stoneDark} />
      <StoneBox position={[0, 0.34, 2]} scale={[6.2, 0.7, 0.25]} />
      <StoneBox position={[-3, 0.34, 0]} scale={[0.25, 0.7, 4]} />
      <StoneBox position={[3, 0.34, 0]} scale={[0.25, 0.7, 4]} />
      <StoneBox position={[0, 0.34, -2]} scale={[6.2, 0.7, 0.25]} />
      <StoneBox position={[0, 0.58, 1.45]} scale={[5.65, 0.32, 0.85]} color={palette.sand} />
      {porticoColumns.map((x) => <Column key={x} position={[x, 0.66, 0.75]} height={1.05} radius={0.09} />)}
      <StoneBox position={[0, 0.45, -1.35]} scale={[4.8, 0.18, 0.55]} color={palette.sand} />
      <group position={[0, 0, -2.05]}>
        <StoneBox position={[0, 0.72, 0]} scale={[0.92, 1.2, 0.92]} color={palette.stoneDark} />
        <StoneBox position={[0, 1.5, 0]} scale={[0.76, 0.45, 0.76]} color={palette.stoneDark} />
        <StoneBox position={[0, 1.91, 0]} scale={[0.58, 0.38, 0.58]} color={palette.stoneDark} />
      </group>
      <StudyLabel study={study} position={[0, 3.15, 0]} />
    </group>
  )
}

function Pediment() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-2.25, 0)
    shape.lineTo(2.25, 0)
    shape.lineTo(0, 1.05)
    shape.closePath()
    const value = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: false })
    value.center()
    return value
  }, [])

  return (
    <mesh castShadow geometry={geometry} position={[0, 3.05, -0.95]}>
      <meshStandardMaterial color={palette.stone} flatShading roughness={0.95} />
    </mesh>
  )
}

function DouggaStudy({ study }) {
  const columns = [-1.8, -1.08, -0.36, 0.36, 1.08, 1.8]
  return (
    <group position={[0, 0.14, -16]} scale={0.82}>
      <StoneBox position={[0, 0, 0]} scale={[5.2, 0.22, 4.3]} color={palette.stoneDark} />
      <StoneBox position={[0, 0.2, 0.15]} scale={[4.8, 0.18, 3.8]} />
      <StoneBox position={[0, 0.39, 0.25]} scale={[4.4, 0.2, 3.4]} color={palette.stoneDark} />
      <StoneBox position={[0, 1.35, 0.85]} scale={[4, 2, 1.8]} color={palette.stone} />
      {columns.map((x) => <Column key={x} position={[x, 1.58, -1.05]} height={2.15} radius={0.14} />)}
      <StoneBox position={[0, 2.7, -1.05]} scale={[4.65, 0.24, 0.55]} color={palette.stoneDark} />
      <Pediment />
      <StudyLabel study={study} position={[0, 4.15, 0]} />
    </group>
  )
}

function BathsStudy({ study }) {
  const columnXs = [-2.1, -1.35, 1.35, 2.1]
  return (
    <group position={[7.2, 0.16, -16]} scale={0.82}>
      <StoneBox position={[0, -0.08, 0]} scale={[6.2, 0.22, 4.4]} color={palette.stoneDark} />
      <StoneBox position={[0, 0.24, 0]} scale={[0.38, 0.55, 4]} />
      <StoneBox position={[-1.4, 0.24, 0.85]} scale={[2.2, 0.55, 0.35]} />
      <StoneBox position={[1.4, 0.24, 0.85]} scale={[2.2, 0.55, 0.35]} />
      <StoneBox position={[-1.4, 0.24, -1.15]} scale={[2.2, 0.55, 0.35]} />
      <StoneBox position={[1.4, 0.24, -1.15]} scale={[2.2, 0.55, 0.35]} />
      {columnXs.map((x) => <Column key={x} position={[x, 0.92, -0.15]} height={1.65} radius={0.12} />)}
      <StoneBox position={[-2.65, 0.6, 0]} scale={[0.28, 1.25, 3.8]} color={palette.stone} />
      <StoneBox position={[2.65, 0.6, 0]} scale={[0.28, 1.25, 3.8]} color={palette.stone} />
      <StudyLabel study={study} position={[0, 3.25, 0]} />
    </group>
  )
}

export default function ArchitectureStudies({ studies = [] }) {
  if (studies.length < 3) return null
  return (
    <group>
      <Html center position={[0, 2.1, -11.6]} distanceFactor={12} className="study-label-wrap">
        <div className="study-heading">
          <strong>Tunisian architecture studies</strong>
          <span>Sourced silhouettes · intentionally not measured reconstructions</span>
        </div>
      </Html>
      <KairouanStudy study={studies[0]} />
      <DouggaStudy study={studies[1]} />
      <BathsStudy study={studies[2]} />
    </group>
  )
}
