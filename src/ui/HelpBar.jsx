import { useExperienceStore } from '../store.js'

export default function HelpBar() {
  const hasEntered = useExperienceStore((state) => state.hasEntered)
  if (!hasEntered) return null

  return (
    <div className="help-bar" aria-label="Controls">
      <span><kbd>WASD</kbd> move</span>
      <span><kbd>E</kbd> inspect</span>
      <span><kbd>G</kbd> guide</span>
      <span><kbd>,</kbd><kbd>.</kbd> track  <kbd>M</kbd> mute</span>
      <span><kbd>T</kbd> time</span>
      <span><kbd>H</kbd> hide HUD</span>
      <span><kbd>Esc</kbd> release mouse</span>
    </div>
  )
}
