import { Component, useCallback, useEffect, useState } from 'react'
import { KeyboardControls } from '@react-three/drei'
import Scene from './world/Scene.jsx'
import Onboarding from './ui/Onboarding.jsx'
import InfoPanel from './ui/InfoPanel.jsx'
import HelpBar from './ui/HelpBar.jsx'
import LoadingStatus from './ui/LoadingStatus.jsx'
import MusicPlayer from './ui/MusicPlayer.jsx'
import TimeOfDayControl from './ui/TimeOfDayControl.jsx'
import Pamphlet from './ui/Pamphlet.jsx'
import ArtifactViewer from './ui/ArtifactViewer.jsx'
import { useExperienceStore } from './store.js'

const controls = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
]

class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('The 3D scene could not start.', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="scene-fallback">
          <p className="kicker">3D unavailable</p>
          <h1>This landscape needs WebGL.</h1>
          <p>Enable hardware acceleration in your browser, then reload the experience.</p>
          <button className="button button--light" onClick={() => window.location.reload()}>Reload</button>
        </main>
      )
    }
    return this.props.children
  }
}

function Experience({ content, archiveDb }) {
  const activeArtifact  = useExperienceStore((state) => state.activeArtifact)
  const setActiveArtifact = useExperienceStore((state) => state.setActiveArtifact)
  const nearestArtifact = useExperienceStore((state) => state.nearestArtifact)
  const hasEntered      = useExperienceStore((state) => state.hasEntered)
  const currentZone     = useExperienceStore((state) => state.currentZone)
  const cycleTimeOfDay  = useExperienceStore((state) => state.cycleTimeOfDay)
  const pamphletOpen    = useExperienceStore((state) => state.pamphletOpen)
  const setPamphletOpen = useExperienceStore((state) => state.setPamphletOpen)
  const hudHidden       = useExperienceStore((state) => state.hudHidden)
  const toggleHud       = useExperienceStore((state) => state.toggleHud)
  const [pointerLocked, setPointerLocked] = useState(document.pointerLockElement != null)
  const [viewerArtifact, setViewerArtifact] = useState(null)

  const resumeWorld = useCallback(() => {
    document.querySelector('.experience-shell canvas')?.requestPointerLock?.()
  }, [])

  const closeArtifact = useCallback(() => {
    setActiveArtifact(null)
    resumeWorld()
  }, [resumeWorld, setActiveArtifact])

  useEffect(() => {
    const handlePointerLockChange = () => setPointerLocked(document.pointerLockElement != null)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange)
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.code === 'Escape') {
        if (viewerArtifact) { setViewerArtifact(null); return }
        if (pamphletOpen) { setPamphletOpen(false); return }
        if (activeArtifact) closeArtifact()
      }
      if (event.code === 'KeyE' && nearestArtifact && !activeArtifact && !pamphletOpen) {
        setActiveArtifact(nearestArtifact)
      }
      if (event.code === 'KeyT' && !event.repeat && !pamphletOpen) cycleTimeOfDay()
      if (event.code === 'KeyG' && !event.repeat && !activeArtifact) {
        if (pamphletOpen) { setPamphletOpen(false) }
        else { document.exitPointerLock?.(); setPamphletOpen(true) }
      }
      if (event.code === 'KeyH' && !event.repeat) toggleHud()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeArtifact, closeArtifact, cycleTimeOfDay,
      nearestArtifact, pamphletOpen, setActiveArtifact, setPamphletOpen, toggleHud])

  const zone = content.zones.find((item) => item.id === currentZone) ?? content.zones[0]

  return (
    <div className="experience-shell">
      {!hudHidden && (
        <header className="site-mark" aria-label="Carthage Underfoot">
          <span className="site-mark__title">Carthage Underfoot</span>
          <span className="site-mark__place">{zone.name}</span>
        </header>
      )}
      {!viewerArtifact && !hudHidden && <TimeOfDayControl />}
      {!viewerArtifact && (
        <SceneBoundary>
          <KeyboardControls map={controls}>
            <Scene content={content} />
          </KeyboardControls>
        </SceneBoundary>
      )}
      {!viewerArtifact && <LoadingStatus />}
      {hasEntered && !hudHidden && <div className="crosshair" aria-hidden="true" />}
      {hasEntered && !activeArtifact && !pointerLocked && (
        <button className="resume-prompt" onClick={resumeWorld}>
          <strong>Resume exploring</strong>
          <small>Click to capture the mouse</small>
        </button>
      )}
      {hasEntered && nearestArtifact && !activeArtifact && (
        <button className="proximity-prompt" onClick={() => setActiveArtifact(nearestArtifact)}>
          <kbd>E</kbd>
          <span><strong>{nearestArtifact.title}</strong><small>Open artifact record</small></span>
        </button>
      )}
      {!hudHidden && <MusicPlayer />}
      <Pamphlet content={content} archiveDb={archiveDb} />
      <Onboarding />
      {activeArtifact && !viewerArtifact && (
        <InfoPanel
          artifact={activeArtifact}
          archiveEntry={archiveDb.find((a) => a.id === activeArtifact.id)}
          onClose={closeArtifact}
          onView3D={() => setViewerArtifact(activeArtifact)}
        />
      )}
      {viewerArtifact && (
        <ArtifactViewer
          artifact={viewerArtifact}
          onClose={() => setViewerArtifact(null)}
        />
      )}
      {!hudHidden && <HelpBar />}
    </div>
  )
}

export default function App() {
  const [content, setContent]     = useState(null)
  const [archiveDb, setArchiveDb] = useState([])
  const [error, setError]         = useState(null)

  useEffect(() => {
    fetch('/content.json')
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setContent)
      .catch(setError)
    // Archive-db is optional — don't block the scene on it
    fetch('/archive-db.json')
      .then((r) => r.ok ? r.json() : { artifacts: [] })
      .then((data) => setArchiveDb(data.artifacts ?? data))
      .catch(() => setArchiveDb([]))
  }, [])

  if (error) {
    return (
      <main className="scene-fallback">
        <p className="kicker">Archive unavailable</p>
        <h1>The artifact records could not be loaded.</h1>
        <p>Reload the page to try again. No unsourced substitute content will be shown.</p>
      </main>
    )
  }

  if (!content) return <div className="loading-screen" role="status">Preparing the archive…</div>
  return <Experience content={content} archiveDb={archiveDb} />
}
