// ============================================================
//  Tiny WebAudio sound design. Everything is synthesized —
//  no assets, no requests. Only ever called after the user
//  explicitly enables sound (a user gesture), so creating the
//  AudioContext here is allowed.
// ============================================================

let ctx = null

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// one pentatonic step per chapter — scrubbing the timeline plays a scale
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]

/** Short soft blip when the playhead crosses keyframe `i`. */
export function tick(i) {
  const ac = ensure()
  if (!ac) return
  const t0 = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length]
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + 0.25)
}

/** Quiet resolving arpeggio for reaching NOW (or the easter egg). */
export function chord() {
  const ac = ensure()
  if (!ac) return
  ;[0, 2, 4, 5].forEach((step, k) => {
    const t0 = ac.currentTime + k * 0.09
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = SCALE[step]
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6)
    osc.connect(gain).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + 0.65)
  })
}
