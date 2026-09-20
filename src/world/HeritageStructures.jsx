import { Html } from '@react-three/drei'
import { palette } from '../palette.js'
import { useExperienceStore } from '../store.js'

function Stone({ position, scale, rotation = [0, 0, 0], color = palette.stone, opacity = 1 }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale} rotation={rotation}>
      <boxGeometry />
      <meshStandardMaterial
        color={color}
        flatShading
        roughness={0.96}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

function Column({ position, height = 2.2, radius = 0.16, color = palette.stone }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 1.12, height, 8]} />
        <meshStandardMaterial color={color} flatShading roughness={0.96} />
      </mesh>
      <mesh castShadow position={[0, height + 0.1, 0]}>
        <cylinderGeometry args={[radius * 1.5, radius * 1.25, 0.2, 8]} />
        <meshStandardMaterial color={palette.stoneDark} flatShading roughness={0.96} />
      </mesh>
    </group>
  )
}

function Arch({ position, rotation = [0, 0, 0], width = 2.4, height = 2.5, depth = 0.42 }) {
  const legHeight = height - width / 2
  return (
    <group position={position} rotation={rotation}>
      <Stone position={[-width / 2, legHeight / 2, 0]} scale={[0.34, legHeight, depth]} />
      <Stone position={[width / 2, legHeight / 2, 0]} scale={[0.34, legHeight, depth]} />
      <mesh castShadow position={[0, legHeight, 0]}>
        <torusGeometry args={[width / 2, 0.18, 4, 12, Math.PI]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.96} />
      </mesh>
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
      <Stone position={[0, 3.6, 0]} scale={[2.3, 7.2, 2.3]} color={palette.stone} />
      {[1.1, 4.8, 7.15].map((y) => (
        <Stone key={y} position={[0, y, 0]} scale={[2.55, 0.16, 2.55]} color={palette.stoneDark} />
      ))}
      <DecorativeBand position={[0, 5.85, 1.18]} width={2.15} count={7} />
      {[3.45, 6.55].map((y) => (
        <group key={y}>
          <Stone position={[0, y, 1.18]} scale={[0.38, 0.85, 0.08]} color={palette.ink} />
          <Stone position={[-1.18, y, 0]} scale={[0.08, 0.85, 0.38]} color={palette.ink} />
        </group>
      ))}
      <Stone position={[0, 7.65, 0]} scale={[2.85, 0.55, 2.85]} color={palette.stoneDark} />
      <Stone position={[0, 8.35, 0]} scale={[1.55, 1.25, 1.55]} color={palette.stone} />
      <Stone position={[0, 9.05, 0]} scale={[2.05, 0.18, 2.05]} color={palette.stoneDark} />
      <mesh castShadow position={[0, 9.55, 0]}>
        <coneGeometry args={[0.65, 0.9, 4]} />
        <meshStandardMaterial color={palette.tileBlue} flatShading roughness={0.9} />
      </mesh>
    </group>
  )
}

function Lantern({ position }) {
  return (
    <group position={position}>
      <mesh>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial
          color="#ffd89a"
          emissive="#ff9f45"
          emissiveIntensity={4}
          roughness={0.5}
        />
      </mesh>
      <pointLight color="#ffbd72" intensity={14} distance={7} decay={2} />
    </group>
  )
}

function PrayerHallRoof() {
  const roofCourses = [-29.75, -29.2, -27.7, -27.15]
  return (
    <group>
      <Stone position={[0, 3.32, -28.4]} scale={[21.7, 0.22, 3.4]} color={palette.tileWhite} />
      <mesh castShadow position={[0, 3.93, -27.83]} rotation={[0.42, 0, 0]}>
        <boxGeometry args={[21.9, 0.18, 2.75]} />
        <meshStandardMaterial color={palette.tileBlue} flatShading roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 3.93, -29.07]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[21.9, 0.18, 2.75]} />
        <meshStandardMaterial color={palette.tileBlue} flatShading roughness={0.9} />
      </mesh>
      {roofCourses.map((z) => (
        <Stone
          key={z}
          position={[0, 4.48 - Math.abs(z + 28.45) * 0.43, z]}
          scale={[22.1, 0.06, 0.09]}
          color={palette.stoneDark}
        />
      ))}
      <Stone position={[0, 4.5, -28.45]} scale={[22.3, 0.18, 0.3]} color={palette.stoneDark} />
      <mesh castShadow position={[0, 4.42, -28.45]}>
        <cylinderGeometry args={[1.5, 1.72, 0.5, 8]} />
        <meshStandardMaterial color={palette.stoneDark} flatShading roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 4.64, -28.45]}>
        <sphereGeometry args={[1.5, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 6.16, -28.45]}>
        <sphereGeometry args={[0.11, 8, 4]} />
        <meshStandardMaterial color={palette.tileBlue} roughness={0.8} />
      </mesh>
      {[-6, 0, 6].map((x) => <Lantern key={x} position={[x, 2.7, -28.05]} />)}
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

function ByrsaForumFrame() {
  const columnXs = [-9, -4.5, 0, 4.5, 9]
  return (
    <group>
      <Stone position={[0, 0.18, 10.7]} scale={[22, 0.36, 0.65]} color={palette.stoneDark} />
      <Stone position={[-11, 0.18, 0]} scale={[0.65, 0.36, 20]} color={palette.stoneDark} />
      <Stone position={[11, 0.18, 0]} scale={[0.65, 0.36, 20]} color={palette.stoneDark} />
      {columnXs.map((x, index) => (
        <Column key={x} position={[x, 0.35, 10.7]} height={index % 2 ? 1.7 : 2.4} radius={0.22} />
      ))}

      <Stone position={[5.7, 0.72, -9.5]} scale={[5.2, 1.45, 0.5]} />
      <Stone position={[10.1, 0.45, -9.5]} scale={[2, 0.9, 0.5]} color={palette.stoneDark} />
      <Stone position={[-7.2, 0.3, -4.1]} scale={[4.4, 0.28, 1.4]} color={palette.stoneDark} />
      <mesh castShadow position={[-8.3, 0.72, -4.2]} rotation={[0.12, 0.1, Math.PI / 2.3]}>
        <cylinderGeometry args={[0.46, 0.52, 3.4, 8]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.96} />
      </mesh>

      <ContextPlaque position={[0, 3.5, 10.7]} title="Byrsa forum frame">
        Scans are real · foundations and colonnade are interpretive
      </ContextPlaque>
    </group>
  )
}

function VillaFrame() {
  const columns = [-8, -4, 4, 8]
  return (
    <group>
      <Stone position={[0, 0.12, 22]} scale={[23, 0.24, 0.5]} color={palette.stoneDark} />
      <Stone position={[0, 0.5, 42]} scale={[23, 1, 0.5]} />
      <Stone position={[-11.5, 0.5, 32]} scale={[0.5, 1, 20]} />
      <Stone position={[11.5, 0.5, 32]} scale={[0.5, 1, 20]} />
      <Stone position={[0, 0.08, 31]} scale={[6.1, 0.12, 3.3]} color={palette.stoneDark} />
      <Stone position={[0, 0.11, 31]} scale={[5, 0.08, 2.2]} color={palette.sand} />
      {columns.map((x) => (
        <Column key={`north-${x}`} position={[x, 0.12, 26]} height={2.3} radius={0.16} />
      ))}
      {columns.map((x) => (
        <Column key={`south-${x}`} position={[x, 0.12, 36.5]} height={1.9} radius={0.16} />
      ))}
      <Stone position={[-6.8, 0.55, 39.5]} scale={[7, 1.1, 0.42]} color={palette.stoneDark} />
      <Stone position={[7.2, 0.55, 39.5]} scale={[6.2, 1.1, 0.42]} color={palette.stoneDark} />
      <ContextPlaque position={[0, 3.4, 26]} title="Villa floor frame">
        The mosaic is scanned · rooms and peristyle are interpretive
      </ContextPlaque>
    </group>
  )
}

function BathsFrame() {
  const arches = [-6, 0, 6]
  return (
    <group position={[31, 0, -2]}>
      <Stone position={[0, 0.08, 0]} scale={[19, 0.16, 18]} color={palette.stoneDark} />
      <Stone position={[0, 0.12, 0]} scale={[17, 0.12, 16]} color={palette.stone} />
      <Stone position={[0, 0.15, 0]} scale={[2.2, 0.18, 15]} color={palette.sea} opacity={0.75} />
      <Stone position={[-5.5, 0.55, 0]} scale={[0.55, 1.1, 14]} />
      <Stone position={[5.5, 0.55, 0]} scale={[0.55, 1.1, 14]} />
      {arches.map((z) => <Arch key={z} position={[-5.5, 1.05, z]} rotation={[0, Math.PI / 2, 0]} width={2.2} height={2.7} />)}
      {arches.map((z) => <Arch key={`east-${z}`} position={[5.5, 1.05, z]} rotation={[0, -Math.PI / 2, 0]} width={2.2} height={2.7} />)}
      <Stone position={[2.1, 0.75, 0]} scale={[2.8, 1.5, 0.5]} color={palette.stoneDark} />
      <ContextPlaque position={[0, 4.3, -7]} title="Baths structure frame">
        The carved block is scanned · the water axis and vaults are interpretive
      </ContextPlaque>
    </group>
  )
}

function TunisiaPrayerCourt() {
  const porticoXs = [-8, -5.3, -2.7, 2.7, 5.3, 8]
  return (
    <group>
      <Stone position={[0, 0.04, -25]} scale={[25, 0.08, 10]} color={palette.stone} />
      <Stone position={[0, 0.07, -25]} scale={[22, 0.05, 8.2]} color={palette.sand} />
      <FloorInlay position={[0, 0.11, -24.55]} width={20.5} depth={7.4} />

      <Stone position={[-7.2, 1.55, -29.25]} scale={[8.6, 3.1, 0.46]} />
      <Stone position={[7.2, 1.55, -29.25]} scale={[8.6, 3.1, 0.46]} />
      <Stone position={[-2.25, 3.05, -29.25]} scale={[1.5, 0.34, 0.46]} color={palette.stoneDark} />
      <Stone position={[2.25, 3.05, -29.25]} scale={[1.5, 0.34, 0.46]} color={palette.stoneDark} />
      <Stone position={[0, 4.05, -29.25]} scale={[24, 0.34, 0.75]} color={palette.stoneDark} />
      <Stone position={[0, 3.75, -30.1]} scale={[24, 0.24, 2.2]} color={palette.stoneDark} />
      <Stone position={[5.8, 2.25, -29.02]} scale={[2.5, 1.65, 0.16]} color={palette.stoneDark} />
      <Stone position={[5.8, 3.17, -29]} scale={[3.1, 0.18, 0.22]} color={palette.stoneDark} />
      <PrayerHallRoof />
      <Minaret position={[9.4, 0, -29.1]} />

      <Stone position={[-11.25, 1.5, -21.7]} scale={[0.46, 3, 5]} />
      <Stone position={[-11.25, 1.5, -27.3]} scale={[0.46, 3, 3.8]} />
      <Stone position={[11.25, 1.5, -21.7]} scale={[0.46, 3, 5]} />
      <Stone position={[11.25, 1.5, -27.3]} scale={[0.46, 3, 3.8]} />

      <Arch position={[-11.25, 0, -24.5]} rotation={[0, Math.PI / 2, 0]} width={2.6} height={3.1} />
      <Arch position={[11.25, 0, -24.5]} rotation={[0, -Math.PI / 2, 0]} width={2.6} height={3.1} />
      <Arch position={[0, 0, -20.1]} width={3.2} height={3.4} />
      <Stone position={[-7.1, 1.7, -20.15]} scale={[10.8, 3.4, 0.46]} color={palette.stoneDark} />
      <Stone position={[7.1, 1.7, -20.15]} scale={[10.8, 3.4, 0.46]} color={palette.stoneDark} />
      <Stone position={[-1.48, 2.45, -20.14]} scale={[0.56, 1.35, 0.48]} color={palette.stoneDark} />
      <Stone position={[1.48, 2.45, -20.14]} scale={[0.56, 1.35, 0.48]} color={palette.stoneDark} />
      <Stone position={[-0.95, 3.06, -20.14]} scale={[1.35, 0.5, 0.48]} color={palette.stoneDark} />
      <Stone position={[0.95, 3.06, -20.14]} scale={[1.35, 0.5, 0.48]} color={palette.stoneDark} />
      <Stone position={[0, 3.55, -20.15]} scale={[25, 0.38, 0.72]} color={palette.stone} />

      <Stone position={[-6.7, 1.25, -19.9]} scale={[3.2, 2.75, 0.18]} color={palette.stone} />
      <Arch position={[-6.7, 0.05, -19.68]} width={2.75} height={2.95} depth={0.2} />
      <DecorativeBand position={[0, 2.72, -19.45]} width={24.4} count={54} />
      <Stone position={[5.8, 0.48, -19.89]} scale={[9.8, 0.12, 0.09]} color={palette.stone} />
      <Stone position={[5.8, 1.7, -19.89]} scale={[9.8, 0.08, 0.09]} color={palette.stone} />

      {porticoXs.map((x) => <Column key={x} position={[x, 0.08, -27.25]} height={2.5} radius={0.15} />)}
      <Stone position={[0, 2.75, -27.25]} scale={[19, 0.3, 0.55]} color={palette.stoneDark} />
      <Stone position={[0, 3.03, -27.8]} scale={[20.5, 0.22, 1.7]} color={palette.tileWhite} />
      {[-6, 0, 6].map((x) => <Lantern key={`portico-${x}`} position={[x, 2.55, -27.15]} />)}

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
  const visible = useExperienceStore((state) => state.interpretationVisible)
  if (!visible) return null

  return (
    <group>
      <ByrsaForumFrame />
      <VillaFrame />
      <BathsFrame />
      <TunisiaPrayerCourt />
    </group>
  )
}
