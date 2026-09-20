import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildWorld, ModelRecord, PlacedModel, ZONES } from "./data";
import { installMovementKeys, requestPointerLock, WorldCanvas } from "./scene";
import {
  About,
  CollectionIndex,
  Examine,
  Grid2D,
  Hud,
  Landing,
  MapOverlay,
} from "./ui";

type Screen = "landing" | "world" | "grid";

/** Tour stops: the first few artifacts of each zone, in map order. */
function buildTour(all: PlacedModel[]): PlacedModel[] {
  const stops: PlacedModel[] = [];
  for (const z of ZONES) {
    const inZone = all.filter((m) => m.zone === z.id);
    const documented = inZone.filter((m) => m.description.trim().length >= 40);
    const pick = (documented.length ? documented : inZone).slice(
      0,
      z.id === "carthage" ? 3 : 2
    );
    stops.push(...pick);
  }
  return stops;
}

export default function App() {
  const [models, setModels] = useState<PlacedModel[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>("landing");
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  const [nearUid, setNearUid] = useState<string | null>(null);
  const [examineUid, setExamineUid] = useState<string | null>(null);
  // "walkMode" is what the player asked for; "pointerLocked" is what the
  // browser actually granted. They come apart, and Esc depends on both.
  const [walkMode, setWalkMode] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showIndex, setShowIndex] = useState(false);

  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const tourTimer = useRef<number | undefined>(undefined);

  /* ---------------------------------------------------------- data load */

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [mRes, manRes] = await Promise.all([
          fetch("/models.json"),
          fetch("/models/manifest.json").catch(() => null),
        ]);
        if (!mRes.ok) throw new Error(`models.json: HTTP ${mRes.status}`);
        const raw: ModelRecord[] = await mRes.json();
        let manifest: string[] = [];
        if (manRes && manRes.ok) {
          try {
            const j = await manRes.json();
            if (Array.isArray(j)) manifest = j.filter((x) => typeof x === "string");
          } catch {
            /* an absent or malformed manifest simply means no local models */
          }
        }
        if (!dead) setModels(buildWorld(raw, manifest));
      } catch (err) {
        if (!dead) setLoadError(String(err));
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  useEffect(installMovementKeys, []);

  const byUid = useMemo(() => {
    const m = new Map<string, PlacedModel>();
    for (const x of models ?? []) m.set(x.uid, x);
    return m;
  }, [models]);

  const tour = useMemo(() => (models ? buildTour(models) : []), [models]);
  const tourTarget = tourIndex !== null ? tour[tourIndex] ?? null : null;
  const near = nearUid ? byUid.get(nearUid) ?? null : null;
  const examine = examineUid ? byUid.get(examineUid) ?? null : null;

  const localCount = useMemo(
    () => (models ?? []).filter((m) => m.hasLocal).length,
    [models]
  );

  /* ------------------------------------------------------------- tour */

  const exitTour = useCallback(() => {
    window.clearTimeout(tourTimer.current);
    setTourIndex(null);
    setExamineUid(null);
  }, []);

  const goTour = useCallback(
    (i: number) => {
      window.clearTimeout(tourTimer.current);
      if (i < 0 || i >= tour.length) {
        exitTour();
        return;
      }
      setExamineUid(null);
      setTourIndex(i);
    },
    [tour.length, exitTour]
  );

  const onTourArrive = useCallback(() => {
    window.clearTimeout(tourTimer.current);
    tourTimer.current = window.setTimeout(() => {
      setTourIndex((i) => {
        if (i !== null) setExamineUid(tour[i]?.uid ?? null);
        return i;
      });
    }, 350);
  }, [tour]);

  /* -------------------------------------------------------- keyboard */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement;

      if (e.key === "Escape") {
        // Esc always escapes, one layer at a time.
        if (showMap) return setShowMap(false);
        if (showIndex) return setShowIndex(false);
        if (showAbout) return setShowAbout(false);
        if (examineUid && tourIndex === null) return setExamineUid(null);
        if (tourIndex !== null) return exitTour();
        if (screen === "grid") return setScreen("landing");
        if (screen === "world") {
          // The browser releases Pointer Lock on Esc by itself. The first Esc
          // just gives the mouse back; a second one leaves the world.
          if (pointerLocked || walkMode) {
            setWalkMode(false);
            return;
          }
          return setScreen("landing");
        }
        return;
      }

      if (typing || screen !== "world") return;

      if ((e.code === "KeyE" || e.key === "Enter") && !examineUid) {
        if (tourIndex !== null) return;
        if (nearUid) {
          e.preventDefault();
          setExamineUid(nearUid);
        }
        return;
      }
      if (e.code === "KeyM" && !examineUid) {
        e.preventDefault();
        setShowMap((v) => !v);
        return;
      }
      if (e.code === "Tab") {
        e.preventDefault();
        setShowIndex((v) => !v);
        return;
      }
      if (tourIndex !== null && !e.repeat) {
        if (e.code === "ArrowRight" || e.code === "Space") {
          e.preventDefault();
          goTour(tourIndex + 1);
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          goTour(tourIndex - 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    screen,
    pointerLocked,
    walkMode,
    nearUid,
    examineUid,
    showMap,
    showIndex,
    showAbout,
    tourIndex,
    goTour,
    exitTour,
  ]);

  /* ----------------------------------------------------------- render */

  if (loadError) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <h1>Ifriqiya</h1>
          <p className="tagline">The collection data could not be loaded.</p>
          <p className="credit">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!models) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <h1>Ifriqiya</h1>
          <p className="tagline">Loading the collection&hellip;</p>
        </div>
      </div>
    );
  }

  if (screen === "grid") {
    return <Grid2D models={models} onClose={() => setScreen("landing")} />;
  }

  const overlayOpen =
    !!examineUid || showMap || showIndex || showAbout || tourIndex !== null;

  return (
    <>
      {screen === "world" && (
        <WorldCanvas
          artifacts={models}
          nearUid={nearUid}
          onNear={setNearUid}
          wantLock={walkMode && !overlayOpen}
          walkable={!overlayOpen}
          onLockChange={setPointerLocked}
          reduceMotion={reduceMotion}
          tourTarget={tourTarget}
          onTourArrive={onTourArrive}
          paused={overlayOpen}
        />
      )}

      {screen === "world" && tourIndex === null && !overlayOpen && (
        <Hud
          near={near}
          locked={pointerLocked}
          onResume={() => {
            setWalkMode(true);
            requestPointerLock();
          }}
        />
      )}

      {screen === "landing" && (
        <Landing
          count={models.length}
          localCount={localCount}
          reduceMotion={reduceMotion}
          onReduceMotion={setReduceMotion}
          onEnter={() => {
            setScreen("world");
            setWalkMode(true);
          }}
          onTour={() => {
            setScreen("world");
            setWalkMode(false);
            goTour(0);
          }}
          onGrid={() => setScreen("grid")}
          onAbout={() => setShowAbout(true)}
        />
      )}

      {showAbout && <About models={models} onClose={() => setShowAbout(false)} />}

      {showMap && <MapOverlay onClose={() => setShowMap(false)} />}

      {showIndex && (
        <CollectionIndex
          models={models}
          onPick={(m) => {
            setShowIndex(false);
            setExamineUid(m.uid);
          }}
          onClose={() => setShowIndex(false)}
        />
      )}

      {examine && tourIndex === null && (
        <Examine
          model={examine}
          byUid={byUid}
          onClose={() => setExamineUid(null)}
        />
      )}

      {examine && tourIndex !== null && (
        <Examine
          model={examine}
          byUid={byUid}
          docked
          onClose={exitTour}
          tour={{
            index: tourIndex,
            total: tour.length,
            next: () => goTour(tourIndex + 1),
            prev: () => goTour(tourIndex - 1),
          }}
        />
      )}

      {screen === "world" && tourIndex !== null && !examine && (
        <div className="tour-travel" role="status" aria-live="polite">
          Travelling to stop {tourIndex + 1} of {tour.length}
          {tourTarget ? `: ${tourTarget.name}` : ""}&hellip;
          <button className="btn small" onClick={exitTour}>
            Exit tour
          </button>
        </div>
      )}

      {screen === "world" && (
        <button className="fallback-link" onClick={() => setScreen("grid")}>
          Browse all {models.length} models without 3D
        </button>
      )}
    </>
  );
}
