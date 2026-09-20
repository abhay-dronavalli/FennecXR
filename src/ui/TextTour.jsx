export default function TextTour({ content }) {
  return (
    <div className="text-tour">
      <a className="skip-link" href="#artifacts">Skip to artifacts</a>
      <header className="text-tour__header">
        <a href="/" className="back-link">Return to 3D</a>
        <p className="kicker">Low-bandwidth and screen-reader route</p>
        <h1>Carthage Underfoot</h1>
        <p className="text-tour__intro">{content.meta.honestyNote}</p>
        <p className="verification-note">{content.meta.status}</p>
      </header>
      <main id="artifacts">
        {content.zones.map((zone) => (
          <section className="text-zone" key={zone.id} aria-labelledby={`zone-${zone.id}`}>
            <header>
              <p className="text-zone__count">{content.artifacts.filter((item) => item.zone === zone.id).length} archive records</p>
              <h2 id={`zone-${zone.id}`}>{zone.name}</h2>
              <p>{zone.blurb}</p>
            </header>
            <div className="artifact-list">
              {content.artifacts.filter((item) => item.zone === zone.id).map((artifact) => (
                <article className="text-artifact" key={artifact.id}>
                  <p className="kicker">{artifact.findSite}</p>
                  <h3>{artifact.title}</h3>
                  <p>{artifact.description}</p>
                  {artifact.interpretation && <p className="text-interpretation"><strong>Interpretation:</strong> {artifact.interpretation}</p>}
                  <p className="text-credit">Scan: {artifact.scannedBy} · {artifact.license}</p>
                  <div className="artifact-links">
                    {artifact.modelUrl && <a href={artifact.modelUrl}>Original model</a>}
                    {artifact.sources.map((source) => <a key={source.url} href={source.url}>{source.label}</a>)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="text-tour__footer">3D scans by Tanit XR volunteers. Credits are being verified before the live release.</footer>
    </div>
  )
}
