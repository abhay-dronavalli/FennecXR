import { useState, useRef, useEffect } from 'react'
import { useExperienceStore } from '../store.js'

const TRACKS = [
  { name: 'Jasmine and Kerosene',        file: '/music/Jasmine and Kerosene.mp4' },
  { name: 'Fisherman of Kerkannah',      file: '/music/FIsherman of Kerkannah.mp4' },
  { name: 'Midnight',                    file: '/music/Midnight .mp4' },
  { name: 'No Copyright Tunisian Music', file: '/music/No Copyright Tunisian Music.mp4' },
]

export default function MusicPlayer() {
  const [trackIndex, setTrackIndex] = useState(0)
  const [isOpen, setIsOpen]         = useState(false)
  const [isMuted, setIsMuted]       = useState(false)

  const audioRef    = useRef()
  const flashTimer  = useRef()
  const hasEntered  = useExperienceStore((s) => s.hasEntered)
  const ttsSpeaking = useExperienceStore((s) => s.ttsSpeaking)

  // Duck music volume while TTS is speaking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = ttsSpeaking ? 0 : 0.35
  }, [ttsSpeaking])

  // Set softer base volume on mount
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = 0.35
  }, [])

  const flashRibbon = () => {
    setIsOpen(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setIsOpen(false), 2000)
  }

  // Start playing the moment the user enters the museum
  useEffect(() => {
    if (!hasEntered) return
    audioRef.current?.play().catch(() => {})
    flashRibbon()
  }, [hasEntered])

  const goTo = (delta) => {
    const next = ((trackIndex + delta) + TRACKS.length) % TRACKS.length
    setTrackIndex(next)
    flashRibbon()
    const audio = audioRef.current
    if (!audio) return
    audio.src = TRACKS[next].file
    audio.addEventListener('canplay', () => audio.play().catch(() => {}), { once: true })
    audio.load()
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !isMuted
    audio.muted = next
    setIsMuted(next)
  }

  const actionsRef = useRef({})
  actionsRef.current = { toggleMute, goTo }

  // Keyboard: M=mute, ,=prev, .=next
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'KeyM')   { e.preventDefault(); actionsRef.current.toggleMute() }
      if (e.code === 'Comma')  { e.preventDefault(); actionsRef.current.goTo(-1) }
      if (e.code === 'Period') { e.preventDefault(); actionsRef.current.goTo(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className={`music-player ${isOpen ? 'music-player--open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <audio ref={audioRef} src={TRACKS[trackIndex].file} onEnded={() => goTo(1)} muted={isMuted} />

      <div className="music-player__ribbon">
        <div className="music-player__ribbon-content">
          <button className="music-player__arrow" onClick={() => goTo(-1)} aria-label="Previous">‹</button>
          <span className="music-player__song">{TRACKS[trackIndex].name}</span>
          <button className="music-player__arrow" onClick={() => goTo(1)} aria-label="Next">›</button>
        </div>
      </div>

      <div className="music-player__vinyl-wrap" onClick={toggleMute}>
        <img
          src="/music/vinyl_gif.gif"
          alt="vinyl"
          className="music-player__vinyl"
          draggable={false}
        />
        <div className="music-player__vinyl-hint">
          {isMuted ? '🔇' : '🔊'}
        </div>
      </div>
    </div>
  )
}
