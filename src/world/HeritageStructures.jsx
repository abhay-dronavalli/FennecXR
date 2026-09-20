import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { palette } from '../palette.js'
import { useExperienceStore } from '../store.js'

function createPlasterTexture() {
  const size = 64
  const data = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4
      const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
      const noise = grain - Math.floor(grain)
      const broadVariation = Math.sin(x * 0.22) * 3 + Math.cos(y * 0.19) * 3
      const value = Math.max(214, Math.min(244, 230 + (noise - 0.5) * 14 + broadVariation))
      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 2)
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

const plasterTexture = createPlasterTexture()

function Stone({ position, scale, rotation = [0, 0, 0], color = palette.stone, opacity = 1, textured = false }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale} rotation={rotation}>
      <boxGeometry />
      <meshStandardMaterial
        color={color}
        flatShading
        map={textured ? plasterTexture : null}
        bumpMap={textured ? plasterTexture : null}
        bumpScale={textured ? 0.018 : 0}
        roughness={0.96}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

function PlasterWall(props) {
  return <Stone {...props} textured />
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

function Lantern({ position, intensity }) {
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
      <pointLight color="#ffbd72" intensity={intensity} distance={7} decay={2} />
    </group>
  )
}

function PrayerHallRoof({ lanternIntensity }) {
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
      {[-6, 0, 6].map((x) => <Lantern key={x} position={[x, 2.7, -28.05]} intensity={lanternIntensity} />)}
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
            color={palette.tileBlue}
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

function CarthageTemplePrecinct() {
  const backBays = [-5.5, -2.8, 0, 2.8, 5.6]
  return (
    <group>
      <Stone position={[0, 0.22, -1]} scale={[19, 0.44, 16]} color={palette.stoneDark} />
      <Stone position={[0, 0.47, -1.2]} scale={[17.8, 0.22, 14.8]} color={palette.stone} />
      <Stone position={[0, 0.14, 7.55]} scale={[19.8, 0.28, 1.8]} color={palette.stoneDark} />
      <Stone position={[0, 0.28, 6.25]} scale={[18.8, 0.3, 1.4]} color={palette.stone} />
      <Stone position={[0, 0.42, 5.15]} scale={[17.8, 0.3, 1.2]} color={palette.sand} />

      <Stone position={[0, 2.15, -8.65]} scale={[15.8, 4.1, 0.55]} color={palette.stone} />
      <Stone position={[-7.65, 2.15, -4.5]} scale={[0.5, 4.1, 8.4]} color={palette.stone} />
      <Stone position={[7.65, 2.15, -4.5]} scale={[0.5, 4.1, 8.4]} color={palette.stone} />
      <Stone position={[0, 4.35, -4.4]} scale={[16.3, 0.32, 9]} color={palette.stoneDark} />

      {backBays.map((x) => (
        <group key={x}>
          <Stone position={[x, 1.65, -8.35]} scale={[1.9, 2.8, 0.08]} color={palette.ink} />
          <Stone position={[x, 0.42, -8.02]} scale={[2.1, 0.28, 0.7]} color={palette.stoneDark} />
        </group>
      ))}
      {[-5.2, -2.2].map((z) => (
        <group key={`west-${z}`}>
          <Stone position={[-7.35, 1.55, z]} scale={[0.08, 2.7, 1.9]} color={palette.ink} />
          <Stone position={[7.35, 1.55, z]} scale={[0.08, 2.7, 1.9]} color={palette.ink} />
        </group>
      ))}

      <mesh castShadow position={[-6, 2.02, 1]}>
        <cylinderGeometry args={[0.36, 0.43, 3.65, 12]} />
        <meshStandardMaterial color={palette.stone} flatShading roughness={0.95} />
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

function ArchaeologyCourt() {
  return (
    <group>
      <Stone position={[0, 0.12, 33]} scale={[22, 0.24, 20]} color={palette.stoneDark} />
      <Stone position={[0, 0.18, 33]} scale={[20.5, 0.12, 18.5]} color={palette.stone} />
      <Stone position={[-4.8, 1.45, 38.5]} scale={[10.2, 2.9, 0.5]} color={palette.stone} />
      <Stone position={[5.8, 1.45, 38.5]} scale={[9.8, 2.9, 0.5]} color={palette.stoneDark} />

      {[-7, -4.5, -2].map((x) => (
        <group key={x}>
          <Stone position={[x, 1.08, 38.22]} scale={[1.5, 2.15, 0.08]} color={palette.ink} />
          <Stone position={[x, 0.22, 37.92]} scale={[1.7, 0.3, 0.7]} color={palette.stoneDark} />
        </group>
      ))}

      <Stone position={[5.2, 0.18, 32.3]} scale={[2.4, 0.18, 10.5]} color={palette.sea} opacity={0.82} />
      <Stone position={[3.65, 0.48, 32.3]} scale={[0.4, 0.85, 10.8]} />
      <Stone position={[6.75, 0.48, 32.3]} scale={[0.4, 0.85, 10.8]} />
      <Stone position={[5.5, 1.1, 38.2]} scale={[3.4, 2.2, 0.08]} color={palette.ink} />

      <Stone position={[0, 0.4, 24.2]} scale={[8, 0.8, 1.2]} color={palette.stoneDark} />
      <Column position={[-3.2, 0.4, 25]} height={2.25} radius={0.18} />
      <Column position={[3.2, 0.4, 25]} height={2.25} radius={0.18} />
      <ContextPlaque position={[0, 4, 25]} title="Carthage archaeology court">
        Tophet and baths records retain their find-site labels inside one interpretive court
      </ContextPlaque>
    </group>
  )
}

function TunisiaPrayerCourt({ lanternIntensity }) {
  const porticoXs = [-8, -5.3, -2.7, 2.7, 5.3, 8]
  return (
    <group>
      <Stone position={[0, 0.04, -25]} scale={[25, 0.08, 10]} color={palette.stone} />
      <Stone position={[0, 0.07, -25]} scale={[22, 0.05, 8.2]} color={palette.sand} />
      <FloorInlay position={[0, 0.11, -24.55]} width={20.5} depth={7.4} />

      <PlasterWall position={[0, 1.55, -29.25]} scale={[24, 3.1, 0.46]} />
      <Stone position={[0, 1.48, -28.99]} scale={[3.05, 2.96, 0.08]} color={palette.tileWhite} />
      <Stone position={[0, 4.05, -29.25]} scale={[24, 0.34, 0.75]} color={palette.stoneDark} />
      <Stone position={[0, 3.75, -30.1]} scale={[24, 0.24, 2.2]} color={palette.stoneDark} />
      <Stone position={[5.8, 2.25, -29.02]} scale={[2.5, 1.65, 0.16]} color={palette.stoneDark} />
      <Stone position={[5.8, 3.17, -29]} scale={[3.1, 0.18, 0.22]} color={palette.stoneDark} />
      <PrayerHallRoof lanternIntensity={lanternIntensity} />
      <CourtyardGalleryRoof lanternIntensity={lanternIntensity} />
      <Minaret position={[9.4, 0, -29.1]} />

      <PlasterWall position={[-11.25, 1.5, -21.84]} scale={[0.46, 3, 3.37]} />
      <PlasterWall position={[-11.25, 1.5, -27.34]} scale={[0.46, 3, 3.72]} />
      <PlasterWall position={[11.25, 1.5, -21.84]} scale={[0.46, 3, 3.37]} />
      <PlasterWall position={[11.25, 1.5, -27.34]} scale={[0.46, 3, 3.72]} />
      <PlasterWall position={[-11.25, 2.86, -24.5]} scale={[0.46, 0.28, 1.95]} />
      <PlasterWall position={[11.25, 2.86, -24.5]} scale={[0.46, 0.28, 1.95]} />

      <Arch position={[0, 0, -20.1]} width={3.2} height={3.4} />
      <PlasterWall position={[-7.1, 1.7, -20.15]} scale={[10.8, 3.4, 0.46]} color={palette.stoneDark} />
      <PlasterWall position={[7.1, 1.7, -20.15]} scale={[10.8, 3.4, 0.46]} color={palette.stoneDark} />
      <PlasterWall position={[-1.48, 2.45, -20.14]} scale={[0.56, 1.35, 0.48]} color={palette.stoneDark} />
      <PlasterWall position={[1.48, 2.45, -20.14]} scale={[0.56, 1.35, 0.48]} color={palette.stoneDark} />
      <PlasterWall position={[-0.95, 3.06, -20.14]} scale={[1.35, 0.5, 0.48]} color={palette.stoneDark} />
      <PlasterWall position={[0.95, 3.06, -20.14]} scale={[1.35, 0.5, 0.48]} color={palette.stoneDark} />
      <Stone position={[0, 3.55, -20.15]} scale={[25, 0.38, 0.72]} color={palette.stone} />

      <PlasterWall position={[-6.7, 1.25, -19.9]} scale={[3.2, 2.75, 0.18]} color={palette.stone} />
      <Arch position={[-6.7, 0.05, -19.68]} width={2.75} height={2.95} depth={0.2} />
      <DecorativeBand position={[0, 2.72, -19.45]} width={24.4} count={54} />
      <Stone position={[5.8, 0.48, -19.89]} scale={[9.8, 0.12, 0.09]} color={palette.stone} />
      <Stone position={[5.8, 1.7, -19.89]} scale={[9.8, 0.08, 0.09]} color={palette.stone} />

      {porticoXs.map((x) => <Column key={x} position={[x, 0.08, -27.25]} height={2.5} radius={0.15} />)}
      <Stone position={[0, 2.75, -27.25]} scale={[19, 0.3, 0.55]} color={palette.stone} />
      <Stone position={[0, 3.03, -27.8]} scale={[20.5, 0.22, 1.7]} color={palette.tileWhite} />
      {[-6, 0, 6].map((x) => (
        <Lantern key={`portico-${x}`} position={[x, 2.55, -27.15]} intensity={lanternIntensity} />
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
  const lanternIntensity = timeOfDay === 'night' ? 24 : timeOfDay === 'day' ? 6 : 14

  return (
    <group>
      <CarthageTemplePrecinct />
      <ArchaeologyCourt />
      <TunisiaPrayerCourt lanternIntensity={lanternIntensity} />
    </group>
  )
}
