import { useCallback, useEffect, useRef, useState } from 'react'
import { useExperienceStore } from '../store.js'

function buildNarration(artifact, archiveEntry) {
  const parts = []
  parts.push(artifact.title + '.')
  if (artifact.findSite) parts.push('Found at ' + artifact.findSite + '.')
  const desc = archiveEntry?.description ?? artifact.description
  if (desc) parts.push(desc)
  if (archiveEntry?.period) parts.push('Period: ' + archiveEntry.period + '.')
  if (archiveEntry?.material) parts.push('Material: ' + archiveEntry.material + '.')
  if (archiveEntry?.what) parts.push(archiveEntry.what + '.')
  if (archiveEntry?.significance) parts.push(archiveEntry.significance + '.')
  if (artifact.context) parts.push('Why it is here: ' + artifact.context)
  if (artifact.interpretation) parts.push(artifact.interpretation)
  return parts.join(' ')
}

export default function InfoPanel({ artifact, archiveEntry, onClose, onView3D }) {
  const closeButton = useRef(null)
  const [speaking, setSpeaking] = useState(false)
  const setTtsSpeaking = useExperienceStore((s) => s.setTtsSpeaking)

  useEffect(() => {
    if (document.pointerLockElement) document.exitPointerLock()
    closeButton.current?.focus()
  }, [])

  // Stop speech when panel closes
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      setTtsSpeaking(false)
    }
  }, [setTtsSpeaking])

  const toggleSpeech = useCallback(() => {
    const synth = window.speechSynthesis
    if (!synth) return

    if (synth.speaking) {
      synth.cancel()
      setSpeaking(false)
      setTtsSpeaking(false)
      return
    }

    const text = buildNarration(artifact, archiveEntry)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onend = () => { setSpeaking(false); setTtsSpeaking(false) }
    utterance.onerror = () => { setSpeaking(false); setTtsSpeaking(false) }
    setSpeaking(true)
    setTtsSpeaking(true)
    synth.speak(utterance)
  }, [artifact, archiveEntry, setTtsSpeaking])

  return (
    <aside className="info-panel" role="dialog" aria-modal="true" aria-labelledby="artifact-title">
      <div className="info-panel__rail" aria-hidden="true" />
      <div className="info-panel__top-bar">
        <button className="narrate-btn" onClick={toggleSpeech} aria-label={speaking ? 'Stop narration' : 'Listen to description'}>
          {speaking ? '◼' : '🔊'}
          <span>{speaking ? 'Stop' : 'Listen'}</span>
        </button>
        <button ref={closeButton} className="close-button" onClick={onClose} aria-label="Close artifact record">×</button>
      </div>

      <p className="kicker">{artifact.findSite}</p>
      <h2 id="artifact-title">{artifact.title}</h2>
      <p className="artifact-lede">{archiveEntry?.description ?? artifact.description}</p>

      {/* Archive-db facts */}
      <dl className="artifact-facts">
        {archiveEntry?.period && (
          <div><dt>Period</dt><dd>{archiveEntry.period}</dd></div>
        )}
        {archiveEntry?.material && (
          <div><dt>Material</dt><dd>{archiveEntry.material}</dd></div>
        )}
        {archiveEntry?.what && (
          <div><dt>What it is</dt><dd>{archiveEntry.what}</dd></div>
        )}
        {archiveEntry?.significance && (
          <div><dt>Significance</dt><dd>{archiveEntry.significance}</dd></div>
        )}
        <div><dt>Why it is here</dt><dd>{artifact.context}</dd></div>
        <div><dt>Risk</dt><dd>{artifact.threat}</dd></div>
      </dl>

      {/* View in 3D button */}
      {(artifact.model || artifact.placeholder) && (
        <button className="view-3d-btn" onClick={onView3D}>
          View in 3D →
        </button>
      )}

      {artifact.interpretation && (
        <div className="interpretation-note">
          <span>Interpretation</span>
          <p>{artifact.interpretation}</p>
        </div>
      )}

      <footer className="artifact-credit">
        {archiveEntry?.scanMethod && <p>Scan method: {archiveEntry.scanMethod}</p>}
        <p>Scan: {archiveEntry?.scannedBy ?? artifact.scannedBy}</p>
        <p>{artifact.license}</p>
        <div className="artifact-links">
          {archiveEntry?.archiveUrl && <a href={archiveEntry.archiveUrl} target="_blank" rel="noreferrer">Tanit XR archive</a>}
          {artifact.modelUrl && <a href={artifact.modelUrl} target="_blank" rel="noreferrer">Original model</a>}
          {artifact.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
          ))}
        </div>
      </footer>
    </aside>
  )
}
