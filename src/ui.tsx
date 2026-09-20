import { useEffect, useMemo, useRef, useState } from "react";
import {
  blurb,
  isDocumented,
  PlacedModel,
  VOLUNTEER_FORM,
  WORLD_HALF,
  ZONE_BY_ID,
  ZONES,
} from "./data";
import { InspectCanvas, live } from "./scene";

const CREDIT = "3D scan by TanitXR, licensed CC-BY 4.0";

/* --------------------------------------------------------------- landing */

export function Landing({
  count,
  localCount,
  reduceMotion,
  onReduceMotion,
  onEnter,
  onTour,
  onGrid,
  onAbout,
}: {
  count: number;
  localCount: number;
  reduceMotion: boolean;
  onReduceMotion: (v: boolean) => void;
  onEnter: () => void;
  onTour: () => void;
  onGrid: () => void;
  onAbout: () => void;
}) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="eyebrow">Northeast Tunisia, walkable</p>
        <h1>Ifriqiya</h1>
        <p className="tagline">
          Walk the places where Tunisia&rsquo;s heritage was scanned.
        </p>

        <div className="btn-row">
          <button className="btn primary" onClick={onEnter} autoFocus>
            Enter the map
          </button>
          <button className="btn primary" onClick={onTour}>
            Guided tour
          </button>
        </div>
        <div className="btn-row">
          <button className="btn link" onClick={onGrid}>
            Browse all {count} models
          </button>
          <button className="btn link" onClick={onAbout}>
            About this project
          </button>
        </div>

        <dl className="legend">
          <div>
            <dt>WASD / arrows</dt>
            <dd>move</dd>
          </div>
          <div>
            <dt>Mouse</dt>
            <dd>look</dd>
          </div>
          <div>
            <dt>Shift</dt>
            <dd>run</dd>
          </div>
          <div>
            <dt>E / Enter</dt>
            <dd>examine</dd>
          </div>
          <div>
            <dt>M</dt>
            <dd>map</dd>
          </div>
          <div>
            <dt>Tab</dt>
            <dd>collection index</dd>
          </div>
          <div>
            <dt>Esc</dt>
            <dd>exit / release mouse</dd>
          </div>
        </dl>

        <div className="motion-note">
          <p>
            <strong>Motion notice.</strong> Entering the map uses first-person
            camera movement, which can cause discomfort for people sensitive to
            motion. The guided tour and the 2D collection avoid mouse-look
            entirely.
          </p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => onReduceMotion(e.target.checked)}
            />
            <span>Reduce motion (slower camera, no artifact spin)</span>
          </label>
        </div>

        <p className="credit">
          3D scans by TanitXR, CC-BY 4.0. {localCount} of {count} models are
          loaded as local geometry; the rest are live Sketchfab embeds. Built at
          CityCamp Gainesville 2026.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- about */

export function About({
  models,
  onClose,
}: {
  models: PlacedModel[];
  onClose: () => void;
}) {
  const noTags = models.filter((m) => m.tags.length === 0).length;
  const noCats = models.filter((m) => m.categories.length === 0).length;
  const thin = models.filter((m) => !isDocumented(m.description)).length;
  const unplaced = models.filter((m) => m.zone === "unplaced").length;
  const geomTwins = models.filter((m) => m.geomTwin).length;
  const nameShared = models.filter((m) => m.nameSiblings.length > 0).length;
  const truncated = models.filter((m) => /…$/.test(m.name)).length;

  return (
    <Overlay onClose={onClose} label="About this project">
      <h2>About Ifriqiya</h2>

      <h3>What TanitXR is</h3>
      <p>
        TanitXR is a digital preservation initiative that photographs Tunisian
        cultural heritage and publishes the results as free, openly licensed 3D
        scans. Every model in this app was uploaded by a TanitXR volunteer to
        Sketchfab under CC-BY 4.0.
      </p>

      <h3>What this project does</h3>
      <p>
        A photogrammetry scan preserves the form of an object and destroys its
        context. On Sketchfab each of these {models.length} scans sits alone on
        a grey turntable: you see a column, but not the hilltop it came from,
        not the six other things recovered twenty metres away, and not the fact
        that a volunteer physically went to that place. Ifriqiya gives the
        collection its geography back, so that adjacency becomes readable.
      </p>

      <h3>The data finding</h3>
      <p>
        We read all {models.length} records from the Sketchfab API.{" "}
        <strong>
          {noTags} of {models.length} carry an empty <code>tags</code> array
        </strong>{" "}
        and {noCats} carry an empty <code>categories</code> array. Nothing in
        the collection is filterable or discoverable at source: you cannot ask
        Sketchfab for &ldquo;everything from Byrsa Hill&rdquo; or
        &ldquo;every mosaic&rdquo;. That is the gap this project fills, and it
        is why the zone assignment below had to be derived from free text.
      </p>
      <ul className="findings">
        <li>
          <strong>{thin}</strong> records have no description, or one under 40
          characters. Those objects are scanned but undocumented.
        </li>
        <li>
          <strong>{truncated}</strong> model names are visibly truncated at 48
          characters <em>at source</em>, ending mid-word. Site names are lost
          inside the cut.
        </li>
        <li>
          <strong>{nameShared}</strong> records share a normalised name with at
          least one other record but have a different triangle count. Some are
          clearly lower-poly versions of the same scan, marked
          &ldquo;- OPT&rdquo;; others, like the eight records all called
          &ldquo;Punic Stelae &ndash; Tophet of Salammbo&rdquo;, look like
          genuinely different objects filed under one name.{" "}
          <strong>
            Nothing in the metadata distinguishes a second version of an object
            from a second object.
          </strong>{" "}
          That is the collection's most consequential gap, and it is why we
          flag rather than merge.
        </li>
        <li>
          <strong>{geomTwins}</strong> records have byte-identical triangle and
          vertex counts to another record &mdash; near-certain double uploads.
        </li>
        <li>
          <strong>{unplaced}</strong> records name no site in either their name
          or their description. They stand in the &ldquo;Not Yet
          Located&rdquo; pavilion rather than being guessed into a zone.
        </li>
      </ul>

      <h3>What is documented, and what is our arrangement</h3>
      <p>
        <strong>Every word of history shown in this app is verbatim</strong>{" "}
        from TanitXR&rsquo;s own model descriptions on Sketchfab. Nothing is
        summarised, paraphrased, embellished or invented. Where a description
        is missing, the app says so and offers the volunteer form rather than
        filling the gap.
      </p>
      <p>
        <strong>The geography is our arrangement.</strong> The zone each object
        stands in was derived by matching its name, and then its
        description&rsquo;s &ldquo;Location:&rdquo; line, against site names.
        Every object&rsquo;s examine panel prints the exact evidence used, so
        you can check our work.
      </p>

      <h3>The honesty note on distance</h3>
      <p>
        Site positions preserve real relative geography. Distances are
        compressed for walking. This is a schematic, not a survey. Positions
        come from the real latitude and longitude of each site under a uniform
        kilometre projection; Carthage and the Medina of Tunis are only about
        14&nbsp;km apart in reality and were pushed apart along their real
        bearing so you can walk between them. Kairouan is included because
        three scans document it, even though it lies outside the northeast
        region this map otherwise covers.
      </p>

      <h3>How this continues after Hack Day</h3>
      <ul className="findings">
        <li>
          Export the zone assignments and object types back to Sketchfab as
          real tags, so the collection becomes searchable at source and this
          app stops being the only index.
        </li>
        <li>
          Re-run the collection fetch on a schedule so newly uploaded scans
          appear on the map without a code change.
        </li>
        <li>
          Let a volunteer claim an undocumented object and write its record,
          turning the {thin} empty descriptions into a work queue.
        </li>
      </ul>

      <p>
        <a href={VOLUNTEER_FORM} target="_blank" rel="noreferrer">
          Volunteer with TanitXR
        </a>
      </p>
      <p className="credit">
        All models &copy; TanitXR, CC-BY 4.0, individually linked. Built at
        CityCamp Gainesville 2026.
      </p>
    </Overlay>
  );
}

/* ------------------------------------------------------- ambiguity note */

/**
 * The collection cannot distinguish a second version of an object from a
 * different object with the same name. We say exactly that, and merge nothing.
 */
export function Ambiguity({
  model,
  byUid,
}: {
  model: PlacedModel;
  byUid: Map<string, PlacedModel>;
}) {
  if (!model.nameSiblings.length && !model.geomTwin) return null;
  const twin = model.geomTwin ? byUid.get(model.geomTwin) : null;

  return (
    <p className="warn">
      {twin && (
        <>
          <strong>Identical geometry</strong> to &ldquo;{twin.name}&rdquo; &mdash;
          the same {model.faceCount?.toLocaleString()} triangles and{" "}
          {model.vertexCount?.toLocaleString()} vertices. Almost certainly one
          scan uploaded twice.{" "}
        </>
      )}
      {!!model.nameSiblings.length && (
        <>
          <strong>
            Shares its name with {model.nameSiblings.length} other record
            {model.nameSiblings.length > 1 ? "s" : ""}
          </strong>{" "}
          at different triangle counts. The metadata cannot tell us whether
          those are lower-poly versions of this object or different objects
          filed under one name.{" "}
        </>
      )}
      Flagged, not merged.
    </p>
  );
}

/* --------------------------------------------------------------- overlay */

function Overlay({
  children,
  onClose,
  label,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className={`overlay ${className}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="sheet" tabIndex={-1} ref={ref}>
        <button className="close" onClick={onClose} aria-label="Close (Escape)">
          Close &nbsp;Esc
        </button>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- examine */

export function Examine({
  model,
  byUid,
  docked,
  onClose,
  tour,
}: {
  model: PlacedModel;
  byUid: Map<string, PlacedModel>;
  docked?: boolean;
  onClose: () => void;
  tour?: { index: number; total: number; next: () => void; prev: () => void };
}) {
  const zone = ZONE_BY_ID[model.zone];
  const documented = isDocumented(model.description);

  const body = (
    <>
      <p className="eyebrow">{zone.label}</p>
      <h2>{model.name}</h2>
      <p className="evidence">
        Placed here because {model.zoneEvidence}.
        {model.zone === "unplaced" &&
          " We have not guessed a site for this object."}
      </p>
      <Ambiguity model={model} byUid={byUid} />

      <div className="viewer">
        {model.hasLocal ? (
          <InspectCanvas uid={model.uid} />
        ) : (
          <iframe
            title={`Sketchfab 3D viewer: ${model.name}`}
            src={model.embedUrl}
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>
      {model.hasLocal && (
        <p className="hint">Drag to rotate, scroll to zoom. Local scan geometry.</p>
      )}

      <h3>What is documented</h3>
      {documented ? (
        <p className="verbatim">{model.description}</p>
      ) : (
        <div className="undocumented">
          <p>
            <strong>Not yet documented.</strong> This scan exists but its
            history has not been recorded.
          </p>
          <p>
            <a href={VOLUNTEER_FORM} target="_blank" rel="noreferrer">
              Help TanitXR document it &rarr;
            </a>
          </p>
        </div>
      )}

      <h3>Scan facts</h3>
      <dl className="facts">
        <div>
          <dt>Triangles</dt>
          <dd>{model.faceCount?.toLocaleString() ?? "Not documented"}</dd>
        </div>
        <div>
          <dt>Vertices</dt>
          <dd>{model.vertexCount?.toLocaleString() ?? "Not documented"}</dd>
        </div>
        <div>
          <dt>Textures</dt>
          <dd>{model.textureCount ?? "Not documented"}</dd>
        </div>
        <div>
          <dt>Licence</dt>
          <dd>{model.license ?? "Not documented"}</dd>
        </div>
        <div>
          <dt>Uploader</dt>
          <dd>{model.uploader ?? "Not documented"}</dd>
        </div>
        <div>
          <dt>Downloadable</dt>
          <dd>{model.isDownloadable ? "Yes" : "No — embed only"}</dd>
        </div>
      </dl>
      <p className="hint">
        This object exists as {model.faceCount?.toLocaleString() ?? "an unknown number of"}{" "}
        triangles because a volunteer walked around it with a camera.
      </p>

      <p className="credit">
        {CREDIT}.{" "}
        <a href={model.viewerUrl} target="_blank" rel="noreferrer">
          View on Sketchfab
        </a>
        {model.licenseUrl && (
          <>
            {" · "}
            <a href={model.licenseUrl} target="_blank" rel="noreferrer">
              Licence terms
            </a>
          </>
        )}
      </p>
    </>
  );

  if (docked) {
    return (
      <aside className="docked" aria-label={`Information: ${model.name}`}>
        <div className="sheet">
          {tour && (
            <div className="tourbar">
              <button className="btn small" onClick={tour.prev}>
                &larr; Previous
              </button>
              <span>
                Stop {tour.index + 1} of {tour.total}
              </span>
              <button className="btn small primary" onClick={tour.next} autoFocus>
                Next &rarr;
              </button>
              <button className="btn small" onClick={onClose}>
                Exit tour
              </button>
            </div>
          )}
          {body}
        </div>
      </aside>
    );
  }

  return (
    <Overlay onClose={onClose} label={`Information: ${model.name}`} className="examine">
      {body}
    </Overlay>
  );
}

/* ------------------------------------------------------------ 2D fallback */

export function Grid2D({
  models,
  onClose,
}: {
  models: PlacedModel[];
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [zone, setZone] = useState<string>("all");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return models.filter(
      (m) =>
        (zone === "all" || m.zone === zone) &&
        (!needle ||
          m.name.toLowerCase().includes(needle) ||
          m.description.toLowerCase().includes(needle))
    );
  }, [models, q, zone]);

  return (
    <div className="grid-page">
      <header className="grid-head">
        <div>
          <h1>The whole collection</h1>
          <p>
            All {models.length} TanitXR scans, with their documentation as
            written. No 3D required.
          </p>
        </div>
        <button className="btn" onClick={onClose}>
          Back &nbsp;Esc
        </button>
      </header>

      <div className="grid-controls">
        <label>
          <span>Search names and descriptions</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="mosaic, column, Zaghouan"
          />
        </label>
        <label>
          <span>Site</span>
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="all">All sites ({models.length})</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label} ({models.filter((m) => m.zone === z.id).length})
              </option>
            ))}
          </select>
        </label>
        <p className="count" role="status">
          Showing {shown.length} of {models.length}
        </p>
      </div>

      <ul className="cards">
        {shown.map((m) => {
          const documented = isDocumented(m.description);
          return (
            <li key={m.uid} className="card">
              {m.thumbnail ? (
                <img
                  src={m.thumbnail}
                  alt={`Photogrammetry scan of ${m.name}, from ${
                    ZONE_BY_ID[m.zone].label
                  }`}
                  loading="lazy"
                  width={320}
                  height={180}
                />
              ) : (
                <div className="nothumb" role="img" aria-label="No preview image available" />
              )}
              <h2>{m.name}</h2>
              <p className="site">{ZONE_BY_ID[m.zone].label}</p>
              {(m.geomTwin || m.nameSiblings.length > 0) && (
                <p className="warn">
                  {m.geomTwin
                    ? "Identical geometry to another record"
                    : `Shares its name with ${m.nameSiblings.length} other record${
                        m.nameSiblings.length > 1 ? "s" : ""
                      }`}
                </p>
              )}
              {documented ? (
                <p className="desc">{blurb(m.description, 260)}</p>
              ) : (
                <p className="desc undoc">
                  Not yet documented. This scan exists but its history has not
                  been recorded.{" "}
                  <a href={VOLUNTEER_FORM} target="_blank" rel="noreferrer">
                    Document it
                  </a>
                  .
                </p>
              )}
              <p className="meta">
                {m.faceCount ? `${m.faceCount.toLocaleString()} triangles` : "Triangle count not documented"}
                {" · "}
                {m.license ?? "Licence not documented"}
              </p>
              <p className="credit">
                {CREDIT}.{" "}
                <a href={m.viewerUrl} target="_blank" rel="noreferrer">
                  View on Sketchfab
                </a>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------- collection index */

export function CollectionIndex({
  models,
  onPick,
  onClose,
}: {
  models: PlacedModel[];
  onPick: (m: PlacedModel) => void;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose} label="Collection index" className="index">
      <h2>Collection index</h2>
      <p>All {models.length} scans. Choose one to read its record.</p>
      {ZONES.map((z) => {
        const list = models.filter((m) => m.zone === z.id);
        if (!list.length) return null;
        return (
          <section key={z.id}>
            <h3>
              {z.label} <span className="n">{list.length}</span>
            </h3>
            <ul className="idx">
              {list.map((m) => (
                <li key={m.uid}>
                  <button onClick={() => onPick(m)}>
                    <span>{m.name}</span>
                    {m.hasLocal && <em className="tag">3D</em>}
                    {m.geomTwin && <em className="tag dup">identical geometry</em>}
                    {!m.geomTwin && m.nameSiblings.length > 0 && (
                      <em className="tag dup">shared name</em>
                    )}
                    {!isDocumented(m.description) && (
                      <em className="tag undoc">undocumented</em>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Overlay>
  );
}

/* ------------------------------------------------------------- map overlay */

export function MapOverlay({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(t);
  }, []);

  const S = 520;
  const toPx = (v: number) => ((v + WORLD_HALF) / (WORLD_HALF * 2)) * S;

  return (
    <Overlay onClose={onClose} label="Map" className="map">
      <h2>Where you are</h2>
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" role="img" aria-label="Top-down map of the five site zones and your position">
        <rect x={0} y={0} width={S} height={S} fill="#e7d9bd" />
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 8} fill="#c8a678" />
        {ZONES.map((z) => (
          <g key={z.id}>
            <circle
              cx={toPx(z.center[0])}
              cy={toPx(z.center[1])}
              r={(z.radius / (WORLD_HALF * 2)) * S}
              fill={z.id === "unplaced" ? "#ffffff88" : "#e6ded0"}
              stroke="#8a7350"
            />
            <text
              x={toPx(z.center[0])}
              y={toPx(z.center[1]) - (z.radius / (WORLD_HALF * 2)) * S - 6}
              textAnchor="middle"
              fontSize={13}
              fill="#2d2419"
            >
              {z.label}
            </text>
          </g>
        ))}
        <g
          transform={`translate(${toPx(live.x)} ${toPx(live.z)}) rotate(${
            (live.yaw * 180) / Math.PI
          })`}
        >
          <path d="M 0 -9 L 6 7 L 0 3 L -6 7 Z" fill="#b5342a" />
        </g>
        <text x={12} y={S - 12} fontSize={12} fill="#4a3d2b">
          North is up. Bearings are real; distances are compressed.
        </text>
      </svg>
      <p className="hint">Press M to close the map.</p>
    </Overlay>
  );
}

/* ----------------------------------------------------------------- HUD */

export function Hud({
  near,
  locked,
  onResume,
}: {
  near: PlacedModel | null;
  locked: boolean;
  onResume: () => void;
}) {
  return (
    <>
      <div className="crosshair" aria-hidden="true" />
      <div className="hud-prompt" role="status" aria-live="polite">
        {near ? (
          <>
            <strong>{near.name}</strong>
            <span>Press E to examine</span>
          </>
        ) : null}
      </div>
      {!locked && (
        <button className="resume" onClick={onResume}>
          Click to look around
          <small>Esc releases the mouse at any time</small>
        </button>
      )}
      <div className="hud-keys" aria-hidden="true">
        WASD move &middot; E examine &middot; M map &middot; Tab index &middot; Esc exit
      </div>
    </>
  );
}
