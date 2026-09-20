import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useExperienceStore } from '../store.js'

// ── Single 3D preview ──────────────────────────────────────────────────────

function RotatingModel({ url, fit = 1.8 }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => scene.clone(true), [scene])
  const ref = useRef()
  const norm = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    return { center, scale: fit / (Math.max(size.x, size.y, size.z) || 1) }
  }, [clone, fit])
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.4 })
  return (
    <group ref={ref} scale={norm.scale}>
      <primitive object={clone} position={norm.center.clone().multiplyScalar(-1)} />
    </group>
  )
}

function RotatingPlaceholder({ type }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.4 })
  let geo
  if (type === 'column')                         geo = <cylinderGeometry args={[0.5, 0.6, 2, 8]} />
  else if (type === 'base' || type === 'capital') geo = <cylinderGeometry args={[0.7, 0.6, 0.7, 8]} />
  else if (type === 'statue')                     geo = <dodecahedronGeometry args={[0.7, 0]} />
  else if (type === 'bust')                       geo = <dodecahedronGeometry args={[0.55, 0]} />
  else if (type === 'stela' || type === 'stela-row') geo = <boxGeometry args={[0.8, 1.6, 0.3]} />
  else if (type === 'mosaic')                     geo = <boxGeometry args={[1.8, 1.8, 0.1]} />
  else if (type === 'bird')                       geo = <octahedronGeometry args={[0.6, 0]} />
  else                                            geo = <icosahedronGeometry args={[0.65, 0]} />
  return (
    <mesh ref={ref}>
      {geo}
      <meshStandardMaterial color="#A89377" flatShading roughness={0.9} />
    </mesh>
  )
}

function PreviewCanvas({ artifact }) {
  return (
    <Canvas
      className="pamphlet__preview-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.5, 3.2], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 2]} intensity={2.2} />
      <Suspense fallback={null}>
        {artifact.model
          ? <RotatingModel key={artifact.id} url={artifact.model} fit={artifact.modelFit ?? 1.8} />
          : <RotatingPlaceholder key={artifact.id} type={artifact.placeholder} />}
      </Suspense>
    </Canvas>
  )
}

// ── Card visuals ────────────────────────────────────────────────────────────

const ZONE_GRAD = {
  byrsa:             'linear-gradient(145deg, #3a506b 0%, #5b8c9b 100%)',
  villas:            'linear-gradient(145deg, #5b8c9b 0%, #7fb3d1 100%)',
  tophet:            'linear-gradient(145deg, #8b6f47 0%, #c9b79c 100%)',
  baths:             'linear-gradient(145deg, #6b4c3b 0%, #a89377 100%)',
  'tunisia-details': 'linear-gradient(145deg, #2d4a34 0%, #3f5f4a 100%)',
}
const TYPE_ICON = {
  capital: '⬡', column: '▏', base: '▬', statue: '♟', bust: '◉',
  stela: '▯', 'stela-row': '▯▯', mosaic: '◫', bird: '🕊', fragment: '◇',
}

function MagCard({ artifact, isActive, onHover, onTeleport }) {
  const bg = ZONE_GRAD[artifact.zone] ?? ZONE_GRAD.byrsa
  const icon = TYPE_ICON[artifact.placeholder] ?? '◆'
  return (
    <button
      className={`mag-card${isActive ? ' mag-card--active' : ''}`}
      onClick={() => onTeleport(artifact)}
      onMouseEnter={() => onHover(artifact)}
    >
      <div className="mag-card__visual" style={{ background: bg }}>
        <span className="mag-card__icon">{icon}</span>
        {artifact.model && <span className="mag-card__3d">3D</span>}
      </div>
      <div className="mag-card__info">
        <h3 className="mag-card__title">{artifact.title}</h3>
        <p className="mag-card__meta">
          {artifact.period && <span>{artifact.period}</span>}
          {artifact.findSite && <span>{artifact.findSite}</span>}
        </p>
      </div>
    </button>
  )
}

// ── Gemini recommendation helper ────────────────────────────────────────────

async function getRecommendations(query) {
  const res = await fetch('http://localhost:3001/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Server error ${res.status}`)
  }
  return res.json() // { message, ids }
}

// ── Main Pamphlet ───────────────────────────────────────────────────────────

export default function Pamphlet({ content, archiveDb }) {
  const pamphletOpen      = useExperienceStore((s) => s.pamphletOpen)
  const setPamphletOpen   = useExperienceStore((s) => s.setPamphletOpen)
  const setTeleportTarget = useExperienceStore((s) => s.setTeleportTarget)
  const hasEntered        = useExperienceStore((s) => s.hasEntered)

  const allArtifacts = content.artifacts.map((world) => {
    const db = archiveDb.find((a) => a.id === world.id)
    return { ...world, period: db?.period ?? null, material: db?.material ?? null }
  })

  const [previewed, setPreviewed]   = useState(null)
  const [query, setQuery]           = useState('')
  const [aiMessage, setAiMessage]   = useState('')
  const [filteredIds, setFilteredIds] = useState(null) // null = show all
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const displayed = filteredIds
    ? allArtifacts.filter((a) => filteredIds.includes(a.id))
    : allArtifacts

  const active = previewed ?? displayed[0]

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setAiMessage('')
    setFilteredIds(null)
    try {
      const { message, ids } = await getRecommendations(query.trim())
      setAiMessage(message)
      setFilteredIds(ids.length > 0 ? ids : null)
      setPreviewed(null)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleClear = () => {
    setFilteredIds(null)
    setAiMessage('')
    setQuery('')
    setError('')
    setPreviewed(null)
  }

  const handleTeleport = (artifact) => {
    if (!artifact.position) return
    const [x, y, z] = artifact.position
    // Temple-zone artifacts are rendered inside a group rotated by Math.PI,
    // so we must apply the same 180° rotation to get the real world position.
    if (artifact.zone === 'temple') {
      setTeleportTarget([-x, y, -z])
    } else {
      setTeleportTarget([x, y, z])
    }
    setPamphletOpen(false)
    setTimeout(() => {
      document.querySelector('.experience-shell canvas')?.requestPointerLock?.()
    }, 100)
  }

  return (
    <>
      <div
        className={`pamphlet${pamphletOpen ? ' pamphlet--open' : ''}`}
        role="dialog"
        aria-hidden={!pamphletOpen}
      >
        <div className="pamphlet__tab">
          <button className="pamphlet__close" onClick={() => setPamphletOpen(false)}>↓ close</button>
          <span className="pamphlet__tab-title">Collection Guide</span>
          <span className="pamphlet__tab-count">{displayed.length} artifacts</span>
        </div>

        <div className="pamphlet__body">
          {/* Left: 3D preview */}
          <div className="pamphlet__preview">
            {pamphletOpen && active && <PreviewCanvas artifact={active} />}
            <div className="pamphlet__preview-info">
              <h3>{active?.title}</h3>
              {active?.period && <p>{active.period}</p>}
              {active?.findSite && <p>{active.findSite}</p>}
              <button className="pamphlet__go" onClick={() => active && handleTeleport(active)}>
                Visit in world →
              </button>
            </div>
          </div>

          {/* Right: search + grid */}
          <div className="pamphlet__grid-wrap">
            <form className="pamphlet__ask" onSubmit={handleAsk}>
              <input
                className="pamphlet__ask-input"
                type="text"
                placeholder="What interests you? e.g. Roman mosaics, Punic history, architecture…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                tabIndex={pamphletOpen ? 0 : -1}
              />
              <button className="pamphlet__ask-btn" type="submit" disabled={loading} tabIndex={pamphletOpen ? 0 : -1}>
                {loading ? '…' : 'Find'}
              </button>
              {filteredIds && (
                <button className="pamphlet__ask-clear" type="button" onClick={handleClear} tabIndex={pamphletOpen ? 0 : -1}>
                  Show all
                </button>
              )}
            </form>

            {aiMessage && <div className="pamphlet__ai-msg">{aiMessage}</div>}
            {error && <div className="pamphlet__ai-error">{error}</div>}

            <div className="pamphlet__grid">
              {displayed.map((a) => (
                <MagCard
                  key={a.id}
                  artifact={a}
                  isActive={active?.id === a.id}
                  onHover={setPreviewed}
                  onTeleport={handleTeleport}
                />
              ))}
              {displayed.length === 0 && (
                <p className="pamphlet__empty">No matching artifacts found. Try a different query.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
