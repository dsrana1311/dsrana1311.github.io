import { useEffect, useRef, useState } from 'react'

// Continuous looping background music that persists across the whole site.
//
// Two browser rules shape this, and they interact:
//  1. Audible autoplay needs "user activation". Scroll/wheel do NOT grant it —
//     only clicks, keys and touches do.
//  2. Muted autoplay is usually allowed, but not always: with no site media
//     engagement Chrome can refuse even a muted play().
//
// So we do both: start muted and try to get rolling immediately, and then on
// the first activity of any kind, unmute AND (synchronously — see below) retry
// play() in case rule 2 bit us. Unmuting an already-playing element isn't
// gated, which is what lets a plain scroll turn the sound on.
export default function BackgroundMusic() {
  const audioRef = useRef(null)
  // Starts muted (that's what makes autoplay legal) and flips on first
  // activity, so the icon reflects reality from the very first paint.
  const [muted, setMuted] = useState(true)
  const userMutedRef = useRef(false) // true only once the user has opted out

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.245

    // Start muted and get the element rolling immediately: muted playback is
    // never blocked, so by the time any gesture arrives the track is already
    // running and we only have to unmute it — and unmuting a playing element
    // is not gated by user activation. This is what lets a scroll work.
    audio.muted = true
    audio.play().catch(() => {})

    // Capture phase so inner handlers that stop propagation can't hide the
    // gesture from us; passive because we never preventDefault. `scroll` has
    // to be on document (it doesn't bubble to window from inner scrollers).
    const events = ['pointerdown', 'click', 'keydown', 'wheel', 'touchstart', 'scroll']
    const opts = { capture: true, passive: true }

    const removeListeners = () => {
      events.forEach((e) => document.removeEventListener(e, activate, opts))
    }

    function activate() {
      if (userMutedRef.current) {
        removeListeners()
        return
      }

      audio.muted = false

      // play() MUST be called synchronously here. Deferring it (even by one
      // microtask, e.g. off a .then()) puts it outside the gesture's window
      // and the browser stops treating it as user-initiated.
      const p = audio.play()

      if (p && typeof p.then === 'function') {
        p.then(() => {
          // Confirmed audible and rolling — safe to stop listening.
          removeListeners()
          setMuted(false)
        }).catch(() => {
          // Rejected: a scroll alone couldn't grant activation. Go back to
          // silently-armed and wait for a gesture that can (click/key/touch).
          audio.muted = true
        })
      } else {
        removeListeners()
        setMuted(false)
      }
    }

    events.forEach((e) => document.addEventListener(e, activate, opts))

    return removeListeners
  }, [])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    userMutedRef.current = next
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
        muted
        playsInline
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
