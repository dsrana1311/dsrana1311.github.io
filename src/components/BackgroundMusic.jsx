import { useEffect, useRef, useState } from 'react'

// Continuous looping background music that persists across the whole site.
// Browsers block autoplay until the user interacts, so we attempt to play
// immediately and, if blocked, kick it off on the first real user gesture
// (click, scroll/wheel, touch, or key) — whichever happens first.
export default function BackgroundMusic() {
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.35

    const events = ['pointerdown', 'click', 'keydown', 'wheel', 'touchstart', 'scroll']

    const removeListeners = () => {
      events.forEach((e) => window.removeEventListener(e, start))
    }

    // Only tear down the gesture listeners once playback has actually begun,
    // so a blocked attempt still leaves the fallback armed for the next gesture.
    const start = () => {
      audio
        .play()
        .then(removeListeners)
        .catch(() => {})
    }

    // Attempt immediate autoplay; if it works, drop the listeners.
    audio.play().then(removeListeners).catch(() => {})

    events.forEach((e) =>
      window.addEventListener(e, start, { passive: true })
    )

    return removeListeners
  }, [])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    audio.muted = next
    setMuted(next)
    // Ensure playback is running when the user unmutes.
    if (!next) audio.play().catch(() => {})
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}bgm.mp3`}
        loop
        autoPlay
        preload="auto"
      />
      <button
        type="button"
        className="bgm-toggle"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute background music' : 'Mute background music'}
        title={muted ? 'Unmute music' : 'Mute music'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </>
  )
}
