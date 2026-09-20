import { useProgress } from '@react-three/drei'

export default function LoadingStatus() {
  const { active, progress, errors } = useProgress()
  if (!active && errors.length === 0) return null

  return (
    <div className="loading-status" role="status" aria-live="polite">
      {errors.length > 0 ? (
        <span>{errors.length} scan{errors.length === 1 ? '' : 's'} unavailable · showing stone proxies</span>
      ) : (
        <>
          <span>Loading scans</span>
          <progress max="100" value={progress}>{Math.round(progress)}%</progress>
        </>
      )}
    </div>
  )
}
