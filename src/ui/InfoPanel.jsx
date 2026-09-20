import { useEffect, useRef } from 'react'

export default function InfoPanel({ artifact, archiveEntry, onClose, onView3D }) {
  const closeButton = useRef(null)

  useEffect(() => {
    if (document.pointerLockElement) document.exitPointerLock()
    closeButton.current?.focus()
  }, [])

  return (
    <aside className="info-panel" role="dialog" aria-modal="true" aria-labelledby="artifact-title">
      <div className="info-panel__rail" aria-hidden="true" />
      <button ref={closeButton} className="close-button" onClick={onClose} aria-label="Close artifact record">×</button>

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
