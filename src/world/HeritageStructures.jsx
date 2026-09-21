import { useMemo, useEffect } from 'react'
import { architecturalBox, surfaces } from './materials.js'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { useExperienceStore } from '../store.js'

export function Stone({ position, scale, rotation = [0, 0, 0], color = palette.stone, opacity = 1, textured = false, surface = 'stone' }) {
  const [width, height, depth] = scale
  const geometry = useMemo(() => architecturalBox([width, height, depth]), [width, height, depth])
  useEffect(() => () => geometry.dispose(), [geometry])
  const finish = surfaces[textured ? 'plaster' : surface]
  return (
    <mesh castShadow receiveShadow position={position} geometry={geometry} rotation={rotation}>
      <meshStandardMaterial color={color} {...finish} bumpScale={textured ? 0.025 : 0.018}
        roughness={surface === 'roof' ? 0.56 : 0.92} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

function PlasterWall(props) {
  return <Stone color={palette.tileWhite} {...props} textured />
}

function Column({ position, height = 2.2, radius = 0.16, color = palette.stone }) {
  return (
    <group position={position}>
      <Stone position={[0, 0.08, 0]} scale={[radius * 3, 0.16, radius * 3]} />
      {[0.2, height - 0.06].map(y => (
        <mesh key={y} castShadow receiveShadow position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.1, radius * 0.22, 8, 24]} />
          <meshStandardMaterial color={color} {...surfaces.stone} roughness={0.88} />
        </mesh>
      ))}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.12, height, 24]} />
        <meshStandardMaterial color={color} flatShading roughness={0.96} />
      </mesh>
      <mesh castShadow position={[0, height + 0.1, 0]}>
        <cylinderGeometry args={[radius * 1.5, radius * 1.25, 0.2, 24]} />
        <meshStandardMaterial color={palette.stoneDark} flatShading roughness={0.96} />
      </mesh>
    </group>
  )
}

// Voussoirs have flat faces and real depth. A slight horseshoe return is used
// only in the interpretive prayer court, never applied to the Roman precinct.
export function Arch({ position, rotation = [0, 0, 0], width = 2.4, height = 2.5, depth = 0.42, infill = false }) {
  const radius = width / 2
  const spring = height - radius
  const legHeight = spring - radius * Math.sin(Math.PI * 0.08)
  const legX = radius * Math.cos(Math.PI * 0.08) + 0.14
  const stones = useMemo(() => Array.from({ length: 15 }, (_, i) => {
    const start = -Math.PI * 0.08 + i * Math.PI * 1.16 / 15 + 0.003
    const end = -Math.PI * 0.08 + (i + 1) * Math.PI * 1.16 / 15 - 0.003
    const shape = new THREE.Shape()
    shape.absarc(0, 0, radius + 0.28, start, end, false)
    shape.absarc(0, 0, radius, end, start, true)
    shape.closePath()
    return shape
  }), [radius])
  const surround = useMemo(() => {
    const r = radius + 0.28
    const a = Math.PI * 0.08
    const x = r * Math.cos(a), y = spring - r * Math.sin(a)
    const shape = new THREE.Shape()
    shape.moveTo(-2, 0)
    shape.lineTo(-x, 0)
    shape.lineTo(-x, y)
    shape.absarc(0, spring, r, Math.PI + a, -a, true)
    shape.lineTo(x, 0)
    shape.lineTo(2, 0)
    shape.lineTo(2, 3.32)
    shape.lineTo(-2, 3.32)
    shape.closePath()
    return shape
  }, [radius, spring])
  return (
    <group position={position} rotation={rotation}>
      {infill && <mesh castShadow receiveShadow position={[0, 0, -depth / 2]}>
        <extrudeGeometry args={[surround, { depth: depth - 0.02, bevelEnabled: false, curveSegments: 24 }]} />
        <meshStandardMaterial color={palette.tileWhite} {...surfaces.plaster} roughness={0.95} />
      </mesh>}
      {[-1, 1].map(side => <Stone key={side} position={[side * legX, legHeight / 2, 0]} scale={[0.32, legHeight, depth]} />)}
      {stones.map((shape, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, spring, -depth / 2]}>
          <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, steps: 1, curveSegments: 4 }]} />
          <meshStandardMaterial color={i % 3 === 0 ? palette.stoneDark : palette.stone} {...surfaces.stone} bumpScale={0.012} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function FloorInlay({ position, width, depth, color = palette.stoneDark }) {
  return (
    <group position={position}>
      {[-0.5, 0, 0.5].map((offset) => (
        <Stone key={`x-${offset}`} position={[offset * width, 0, 0]} scale={[0.045, 0.018, depth]} color={color} />
      ))}
      {[-0.5, 0, 0.5].map((offset) => (
        <Stone key={`z-${offset}`} position={[0, 0.004, offset * depth]} scale={[width, 0.018, 0.045]} color={color} />
      ))}
    </group>
  )
}

function DecorativeBand({ position, width, count = 18 }) {
  return (
    <group position={position}>
      <Stone position={[0, 0, -0.025]} scale={[width, 0.32, 0.08]} color={palette.tileWhite} />
      {Array.from({ length: count }, (_, index) => {
        const x = -width / 2 + ((index + 0.5) * width) / count
        return (
          <mesh key={index} position={[x, 0, 0.04]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.22, 0.22, 0.07]} />
            <meshStandardMaterial color={index % 2 ? palette.tileBlue : palette.stoneDark} flatShading roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

function Minaret({ position }) {
  return (
    <group position={position}>
      {/* Three diminishing square stages: Kairouan-inspired, not a replica. */}
      <Stone position={[0, 3.4, 0]} scale={[2.5, 6.8, 2.5]} surface="masonry" />
      <Stone position={[0, 7.4, 0]} scale={[1.72, 1.25, 1.72]} surface="masonry" />
      <Stone position={[0, 8.48, 0]} scale={[1.04, 0.92, 1.04]} surface="masonry" />
      {[[6.8, 2.7], [8.04, 1.9], [8.95, 1.18]].map(([y, w]) => (
        <Stone key={y} position={[0, y, 0]} scale={[w, 0.16, w]} color={palette.stoneDark} />
      ))}
      {[0, 1, 2, 3].map(side => (
        <group key={side} rotation={[0, side * Math.PI / 2, 0]}>
          {[2.7, 5.1].map(y => <Stone key={y} position={[0, y, 1.258]} scale={[0.2, 0.66, 0.035]} color={palette.ink} />)}
          {[-0.98, -0.49, 0, 0.49, 0.98].map(x => <Stone key={x} position={[x, 7.02, 1.14]} scale={[0.24, 0.3, 0.24]} />)}
        </group>
      ))}
      <mesh castShadow receiveShadow position={[0, 9.01, 0]}>
        <sphereGeometry args={[0.54, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={palette.tileWhite} {...surfaces.plaster} bumpScale={0.018} roughness={0.9} />
      </mesh>
    </group>
  )
}

function Lantern({ position, intensity }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.24, 8]} />
        <meshStandardMaterial
          color="#ffd89a"
          emissive="#ff9f45"
          emissiveIntensity={1.6}
          roughness={0.5}
        />
      </mesh>
      {[-0.17, 0.17].map(y => (
        <mesh key={y} castShadow position={[0, y, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.05, 8]} />
          <meshStandardMaterial color="#40382c" metalness={0.55} roughness={0.6} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.12, 0, Math.sin(i * Math.PI / 2) * 0.12]}>
          <boxGeometry args={[0.018, 0.34, 0.018]} />
          <meshStandardMaterial color="#40382c" metalness={0.55} roughness={0.6} />
        </mesh>
      ))}
      <pointLight color="#ffbd72" intensity={intensity} distance={7} decay={2} />
    </group>
  )
}

function ExteriorLantern({ position, intensity }) {
  return (
    <group position={position}>
      <Stone position={[0, 1.05, 0]} scale={[0.16, 2.1, 0.16]} color={palette.stoneDark} />
      <Stone position={[0, 2.12, 0]} scale={[0.38, 0.12, 0.38]} color={palette.stoneDark} />
      <Lantern position={[0, 2.38, 0]} intensity={intensity * 1.25} />
    </group>
  )
}

function PrayerHallRoof() {
  return (
    <group>
      <Stone position={[0, 3.32, -28.4]} scale={[21.7, 0.22, 3.4]} color={palette.tileWhite} />
      {[-1, 1].map(side => (
        <Stone key={side} position={[0, 3.73, -28.4 + side * 0.86]} rotation={[side * 0.36, 0, 0]}
          scale={[21.9, 0.16, 1.84]} color={palette.roofGreen} surface="roof" />
      ))}
      <Stone position={[0, 4.1, -28.4]} scale={[22, 0.16, 0.24]} color={palette.roofGreen} surface="roof" />
      <mesh castShadow receiveShadow position={[0, 4.32, -28.4]}>
        <cylinderGeometry args={[1.25, 1.4, 0.65, 16]} />
        <meshStandardMaterial color={palette.stone} {...surfaces.stone} roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 4.63, -28.4]}>
        <sphereGeometry args={[1.26, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={palette.tileWhite} {...surfaces.plaster} bumpScale={0.018} roughness={0.94} />
      </mesh>
    </group>
  )
}

function CourtyardGalleryRoof({ lanternIntensity }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Stone
            position={[side * 9.65, 3.08, -24.55]}
            scale={[3.25, 0.2, 8.85]}
            color={palette.tileWhite}
          />
          <Stone
            position={[side * 9.65, 3.24, -24.55]}
            scale={[3.45, 0.14, 9.05]}
            color={palette.roofGreen} surface="roof"
          />
          {[-21.6, -24.5].map((z) => (
            <Column key={z} position={[side * 8.02, 0.08, z]} height={2.75} radius={0.13} />
          ))}
          <Lantern
            position={[side * 9.35, 2.62, -24.5]}
            intensity={lanternIntensity * 0.65}
          />
        </group>
      ))}
    </group>
  )
}

function ContextPlaque({ position, title, children }) {
  return (
    <Html center position={position} distanceFactor={4.5} className="study-label-wrap">
      <div className="study-heading">
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
    </Html>
  )
}

const pedimentShape = new THREE.Shape()
pedimentShape.moveTo(-8.3, 0)
pedimentShape.lineTo(0, 2.65)
pedimentShape.lineTo(8.3, 0)
pedimentShape.closePath()

function CarthageTemplePrecinct({ lanternIntensity }) {
  const backBays = [-5.5, -2.8, 0, 2.8, 5.6]
  return (
    <group rotation={[0, Math.PI, 0]}>
      <Stone position={[0, 0.22, -1]} scale={[19, 0.44, 16]} color={palette.stoneDark} />
      <Stone position={[0, 0.47, -1.2]} scale={[17.8, 0.22, 14.8]} color={palette.stone} surface="paving" />
      <Stone position={[0, 0.14, 7.55]} scale={[19.8, 0.28, 1.8]} color={palette.stoneDark} />
      <Stone position={[0, 0.28, 6.25]} scale={[18.8, 0.3, 1.4]} color={palette.stone} />
      <Stone position={[0, 0.42, 5.15]} scale={[17.8, 0.3, 1.2]} color={palette.sand} />

      <Stone position={[0, 2.15, -8.65]} scale={[15.8, 4.1, 0.55]} color={palette.stone} />
      <Stone position={[-7.65, 2.15, -4.5]} scale={[0.5, 4.1, 8.4]} color={palette.stone} />
      <Stone position={[7.65, 2.15, -4.5]} scale={[0.5, 4.1, 8.4]} color={palette.stone} />
      <Stone position={[0, 4.35, -3.85]} scale={[16.3, 0.32, 10.1]} color={palette.stoneDark} />
      {[-1, 1].map(side => <Stone key={`roof-${side}`} position={[side * 4.15, 6.3, -3.95]}
        rotation={[0, 0, -side * Math.atan2(2.65, 8.3)]} scale={[8.85, 0.16, 10.8]} color={palette.terracotta} surface="roof" />)}
      <Stone position={[0, 7.65, -3.95]} scale={[0.24, 0.18, 10.85]} color={palette.terracotta} />
      <Stone position={[0, 4.72, -8.8]} scale={[16.9, 0.48, 0.55]} color={palette.stoneDark} />
      <mesh castShadow receiveShadow position={[0, 4.95, -9.03]}>
        <extrudeGeometry args={[pedimentShape, { depth: 0.4, bevelEnabled: false }]} />
        <meshStandardMaterial color={palette.stone} {...surfaces.stone} roughness={0.94} />
      </mesh>

      {backBays.map((x) => (
        <group key={x}>
          <Stone position={[x, 1.65, -8.35]} scale={[1.9, 2.8, 0.08]} color={palette.sand} textured />
          <Stone position={[x, 0.42, -8.02]} scale={[2.1, 0.28, 0.7]} color={palette.stoneDark} />
        </group>
      ))}
      {[-5.2, -2.2].map((z) => (
        <group key={`west-${z}`}>
          <Stone position={[-7.35, 1.55, z]} scale={[0.08, 2.7, 1.9]} color={palette.sand} textured />
          <Stone position={[7.35, 1.55, z]} scale={[0.08, 2.7, 1.9]} color={palette.sand} textured />
        </group>
      ))}
      <Stone position={[7.35, 1.45, -0.8]} scale={[0.08, 2.5, 1.9]} color={palette.sand} textured />
      <Stone position={[-7.35, 1.45, -0.8]} scale={[0.08, 2.5, 1.9]} color={palette.sand} textured />
      <Stone position={[7.05, 0.38, -0.8]} scale={[0.7, 0.3, 2.1]} color={palette.stoneDark} />
      <Stone position={[-7.05, 0.38, -0.8]} scale={[0.7, 0.3, 2.1]} color={palette.stoneDark} />

      {[-4.8, 0, 4.8].map((x) => (
        <Lantern key={`temple-lantern-${x}`} position={[x, 3.65, -5.1]} intensity={lanternIntensity} />
      ))}
      {[-6.5, 6.5].map((x) => (
        <ExteriorLantern key={`temple-exterior-${x}`} position={[x, 0.45, 4.8]} intensity={lanternIntensity} />
      ))}

      {/* The scanned Byrsa base seats this shaft at y=1.10, above the podium. */}
      <mesh castShadow receiveShadow position={[-6, 2.465, 1]}>
        <cylinderGeometry args={[0.36, 0.43, 2.77, 32]} />
        <meshStandardMaterial color={palette.stone} {...surfaces.stone} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[-3, 3.25, 1]}>
        <cylinderGeometry args={[0.34, 0.38, 1.55, 12]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.95} />
      </mesh>
      <mesh castShadow position={[3, 2.55, 1]}>
        <cylinderGeometry args={[0.36, 0.44, 3.75, 12]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.95} />
      </mesh>
      <Column position={[6, 0.45, 1]} height={3.75} radius={0.36} />
      {Array.from({ length: 27 }, (_, i) => <Stone key={`dentil-${i}`} position={[-7.8 + i * 0.6, 4.46, 1.44]} scale={[0.24, 0.15, 0.22]} color={palette.stone} />)}
      <Stone position={[0, 4.72, 1]} scale={[16.9, 0.48, 1.05]} color={palette.stoneDark} />
      <mesh castShadow receiveShadow position={[0, 4.95, 0.47]}>
        <extrudeGeometry args={[pedimentShape, { depth: 0.52, bevelEnabled: false }]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.96} />
      </mesh>
      <Stone position={[0, 5.08, 0.38]} scale={[17.4, 0.18, 0.32]} color={palette.stoneDark} />

      <ContextPlaque position={[0, 7.9, 1]} title="Carthage Roman temple precinct">
        Scans are embedded in an interpretive sanctuary frame, not a measured reconstruction
      </ContextPlaque>
    </group>
  )
}

function TunisiaPrayerCourt({ lanternIntensity }) {
  const porticoXs = [-8, -5.3, -2.7, 2.7, 5.3, 8]
  return (
    <group>
      <Stone position={[0, 0.04, -25]} scale={[25, 0.08, 10]} color={palette.stone} />
      <Stone position={[0, 0.07, -25]} scale={[22, 0.05, 8.2]} color={palette.sand} surface="paving" />
      <FloorInlay position={[0, 0.11, -24.55]} width={20.5} depth={7.4} />

      <PlasterWall position={[0, 1.55, -29.25]} scale={[24, 3.1, 0.46]} />
      <Stone position={[0, 1.48, -28.99]} scale={[3.05, 2.96, 0.08]} color={palette.tileWhite} />
      <Stone position={[0, 4.05, -29.25]} scale={[24, 0.34, 0.75]} color={palette.stoneDark} />
      <Stone position={[0, 3.75, -30.1]} scale={[24, 0.24, 2.2]} color={palette.stoneDark} />
      <Stone position={[5.8, 2.25, -29.02]} scale={[2.5, 1.65, 0.16]} color={palette.stoneDark} />
      <Stone position={[5.8, 3.17, -29]} scale={[3.1, 0.18, 0.22]} color={palette.stoneDark} />
      <PrayerHallRoof />
      <CourtyardGalleryRoof lanternIntensity={lanternIntensity} />
      <Minaret position={[9.4, 0, -29.1]} />

      <PlasterWall position={[-11.25, 1.5, -21.84]} scale={[0.46, 3, 3.37]} />
      <PlasterWall position={[-11.25, 1.5, -27.34]} scale={[0.46, 3, 3.72]} />
      <PlasterWall position={[11.25, 1.5, -21.84]} scale={[0.46, 3, 3.37]} />
      <PlasterWall position={[11.25, 1.5, -27.34]} scale={[0.46, 3, 3.72]} />
      <PlasterWall position={[-11.25, 2.86, -24.5]} scale={[0.46, 0.28, 1.95]} />
      <PlasterWall position={[11.25, 2.86, -24.5]} scale={[0.46, 0.28, 1.95]} />

      <Arch position={[0, 0.08, -20.1]} width={3.2} height={3.2} infill />
      <PlasterWall position={[-7.25, 1.7, -20.15]} scale={[10.5, 3.4, 0.46]} />
      <PlasterWall position={[7.25, 1.7, -20.15]} scale={[10.5, 3.4, 0.46]} />
      <Stone position={[0, 3.55, -20.15]} scale={[25, 0.38, 0.72]} color={palette.stone} />

      <PlasterWall position={[-6.7, 1.25, -19.9]} scale={[3.2, 2.75, 0.18]} color={palette.stone} />
      <Arch position={[-6.7, 0.05, -19.68]} width={2.75} height={2.95} depth={0.2} />
      {[-1, 1].map(side => <DecorativeBand key={side} position={[side * 7.1, 2.72, -19.87]} width={10.15} count={23} />)}
      <Stone position={[6.6, 0.48, -19.89]} scale={[8.2, 0.12, 0.09]} color={palette.stone} />
      <Stone position={[6.6, 1.7, -19.89]} scale={[8.2, 0.08, 0.09]} color={palette.stone} />
      {/* Neutral backing supports the scanned Kairouan tilework without inventing its missing edges. */}
      <Stone position={[-5.8, 1.62, -28.92]} scale={[3.5, 2.9, 0.1]} color={palette.tileWhite} />

      {porticoXs.map((x) => <Column key={x} position={[x, 0.08, -27.25]} height={2.5} radius={0.15} />)}
      {[-6.65, -4, 4, 6.65].map(x => <Arch key={`arcade-${x}`} position={[x, 0.08, -27.25]} width={2.18} height={2.4} depth={0.32} />)}
      <Stone position={[0, 2.75, -27.25]} scale={[19, 0.3, 0.55]} color={palette.stone} />
      <Stone position={[0, 3.03, -27.8]} scale={[20.5, 0.22, 1.7]} color={palette.tileWhite} />
      {[-6, 0, 6].map((x) => (
        <Lantern key={`portico-${x}`} position={[x, 2.55, -27.15]} intensity={lanternIntensity} />
      ))}
      {[-5.4, 5.4].map((x) => (
        <ExteriorLantern key={`mosque-exterior-${x}`} position={[x, 0.08, -18.9]} intensity={lanternIntensity} />
      ))}

      <mesh receiveShadow position={[5, 0.13, -24.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.45, 12]} />
        <meshStandardMaterial color={palette.sea} flatShading />
      </mesh>

      <ContextPlaque position={[0, 4.8, -20.2]} title="Prayer courtyard frame">
        Mihrab, doors, panel, well, and basin are scans · the courtyard is interpretive
      </ContextPlaque>
    </group>
  )
}

export default function HeritageStructures() {
  const timeOfDay = useExperienceStore((state) => state.timeOfDay)
  const lanternIntensity = timeOfDay === 'night' ? 10 : timeOfDay === 'day' ? 0 : 3

  return (
    <group>
      <CarthageTemplePrecinct lanternIntensity={lanternIntensity} />
      <TunisiaPrayerCourt lanternIntensity={lanternIntensity} />
    </group>
  )
}
