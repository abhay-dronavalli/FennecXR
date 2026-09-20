import { useExperienceStore } from '../store.js'

export default function Onboarding() {
  const hasEntered = useExperienceStore((state) => state.hasEntered)
  const enter = useExperienceStore((state) => state.enter)
  if (hasEntered) return null

  return (
    <section className="onboarding" aria-labelledby="welcome-title">
      <div className="onboarding__compass" aria-hidden="true">
        <span>N</span>
        <i />
      </div>
      <div className="onboarding__copy">
        <p className="kicker">A walk through the Tanit XR archive</p>
        <h1 id="welcome-title">Put the fragments<br />back on the ground.</h1>
        <p>
          Twenty-one scans. Four places on this map. Everything textured is documentation;
          everything faceted is an honest abstraction.
        </p>
        <div className="onboarding__actions">
          <button id="enter-world" className="button" onClick={enter}>Enter the landscape</button>
          <a className="button button--quiet" href="/text">Read as text</a>
        </div>
        <p className="onboarding__note">Mouse look · WASD or arrow keys · E to inspect</p>
      </div>
      <p className="onboarding__disclosure">
        The guide’s answers are generated from cited archive records. Voice, when enabled, is synthetic.
      </p>
    </section>
  )
}
