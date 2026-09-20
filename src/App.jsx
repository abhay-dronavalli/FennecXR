import { Component, useCallback, useEffect, useState } from 'react'
import { KeyboardControls } from '@react-three/drei'
import Scene from './world/Scene.jsx'
import Onboarding from './ui/Onboarding.jsx'
import InfoPanel from './ui/InfoPanel.jsx'
import HelpBar from './ui/HelpBar.jsx'
import LoadingStatus from './ui/LoadingStatus.jsx'
import MusicPlayer from './ui/MusicPlayer.jsx'
import TimeOfDayControl from './ui/TimeOfDayControl.jsx'
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

function Experience({ content }) {
  const activeArtifact = useExperienceStore((state) => state.activeArtifact)
  const setActiveArtifact = useExperienceStore((state) => state.setActiveArtifact)
  const nearestArtifact = useExperienceStore((state) => state.nearestArtifact)
  const hasEntered = useExperienceStore((state) => state.hasEntered)
  const currentZone = useExperienceStore((state) => state.currentZone)
  const cycleTimeOfDay = useExperienceStore((state) => state.cycleTimeOfDay)
  const [pointerLocked, setPointerLocked] = useState(document.pointerLockElement != null)

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
      if (event.code === 'Escape' && activeArtifact) closeArtifact()
      if (event.code === 'KeyE' && nearestArtifact && !activeArtifact) {
        setActiveArtifact(nearestArtifact)
      }
      if (event.code === 'KeyT' && !event.repeat) cycleTimeOfDay()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeArtifact, closeArtifact, cycleTimeOfDay, nearestArtifact, setActiveArtifact])

  const zone = content.zones.find((item) => item.id === currentZone) ?? content.zones[0]

  return (
    <div className="experience-shell">
      <header className="site-mark" aria-label="Carthage Underfoot">
        <span className="site-mark__title">Carthage Underfoot</span>
        <span className="site-mark__place">{zone.name}</span>
      </header>
      <div className="interpretation-banner" role="note">
        <strong>Interpretive architecture</strong> — the textured fragments are scans; their surrounding structures are a modern contextual frame.
      </div>
      <TimeOfDayControl />
      <SceneBoundary>
        <KeyboardControls map={controls}>
          <Scene content={content} />
        </KeyboardControls>
      </SceneBoundary>
      <LoadingStatus />
      {hasEntered && <div className="crosshair" aria-hidden="true" />}
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
      <MusicPlayer />
      <Onboarding />
      {activeArtifact && <InfoPanel artifact={activeArtifact} onClose={closeArtifact} />}
      <HelpBar />
    </div>
  )
}

export default function App() {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/content.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Content request failed: ${response.status}`)
        return response.json()
      })
      .then(setContent)
      .catch(setError)
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
  return <Experience content={content} />
}
