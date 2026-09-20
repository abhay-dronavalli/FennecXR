import { useEffect, useRef } from 'react'

export default function InfoPanel({ artifact, onClose }) {
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
      <p className="artifact-lede">{artifact.description}</p>
      <dl className="artifact-facts">
        <div><dt>Why it is here</dt><dd>{artifact.context}</dd></div>
        <div><dt>Risk</dt><dd>{artifact.threat}</dd></div>
      </dl>
      {artifact.interpretation && (
        <div className="interpretation-note">
          <span>Interpretation</span>
          <p>{artifact.interpretation}</p>
        </div>
      )}
      <footer className="artifact-credit">
        <p>Scan: {artifact.scannedBy}</p>
        <p>{artifact.license}</p>
        <div className="artifact-links">
          {artifact.modelUrl && <a href={artifact.modelUrl} target="_blank" rel="noreferrer">Original model</a>}
          {artifact.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
          ))}
        </div>
      </footer>
    </aside>
  )
}
