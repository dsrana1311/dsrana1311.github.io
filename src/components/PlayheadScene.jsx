import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS, PREMISE } from '../content.js'
import { buildLayouts, piLayout, idlePerturb, STAGE_W, STAGE_H } from '../lib/shapes.js'
import { tick, chord } from '../lib/audio.js'
import Dossier from './Dossier.jsx'

const STOPS = CHAPTERS.length - 1 // 4 segments between 5 keyframes
const PLAY_MS = 20000 // seven years in twenty seconds
const EGG_MS = 3400
const SPEEDS = [1, 2, 0.5]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const smooth = (x) => x * x * (3 - 2 * x)

function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

export default function PlayheadScene() {
  const containerRef = useRef(null)

  const [view, setView] = useState({ t: 0, clock: 0 })
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [touched, setTouched] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dossierId, setDossierId] = useState(null)
  const [pulse, setPulse] = useState({ idx: -1, stamp: 0 })
  const [eggStart, setEggStart] = useState(0)

  // refs mirroring state, so the rAF loop and listeners never go stale
  const viewRef = useRef(view)
  const playingRef = useRef(false)
  const speedRef = useRef(1)
  const soundRef = useRef(true)
  const touchedRef = useRef(false)
  const dossierRef = useRef(null)
  const eggRef = useRef(0)
  const tweenRef = useRef(0)
  const dragRef = useRef(false)
  const lastTimeRef = useRef(0)
  const lastIdxRef = useRef(0)
  const trailRef = useRef([])
  const typedRef = useRef('')
  const reducedRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const geometry = useCallback(() => {
    const el = containerRef.current
    const rect = el.getBoundingClientRect()
    const total = Math.max(1, el.offsetHeight - window.innerHeight)
    return { topDoc: rect.top + window.scrollY, total, rectTop: rect.top }
  }, [])

  const markTouched = useCallback(() => {
    if (!touchedRef.current) {
      touchedRef.current = true
      setTouched(true)
    }
  }, [])

  const stopMotion = useCallback(() => {
    if (playingRef.current) {
      playingRef.current = false
      setPlaying(false)
    }
    if (tweenRef.current) {
      cancelAnimationFrame(tweenRef.current)
      tweenRef.current = 0
    }
  }, [])

  const scrollToT = useCallback(
    (t) => {
      const { topDoc, total } = geometry()
      window.scrollTo(0, topDoc + clamp(t, 0, 1) * total)
    },
    [geometry]
  )

  const tweenTo = useCallback(
    (target) => {
      markTouched()
      stopMotion()
      const from = viewRef.current.t
      const start = performance.now()
      const dur = 900
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur)
        const e = 1 - Math.pow(1 - p, 3)
        scrollToT(from + (target - from) * e)
        tweenRef.current = p < 1 ? requestAnimationFrame(step) : 0
      }
      tweenRef.current = requestAnimationFrame(step)
    },
    [markTouched, stopMotion, scrollToT]
  )

  const togglePlay = useCallback(() => {
    markTouched()
    if (playingRef.current) {
      stopMotion()
      return
    }
    stopMotion()
    if (viewRef.current.t >= 0.999) scrollToT(0)
    playingRef.current = true
    setPlaying(true)
  }, [markTouched, stopMotion, scrollToT])

  const toggleSound = useCallback(() => {
    soundRef.current = !soundRef.current
    if (soundRef.current) tick(lastIdxRef.current)
  }, [])

  const triggerEgg = useCallback(() => {
    if (eggRef.current) return
    const now = performance.now()
    eggRef.current = now
    setEggStart(now)
    if (soundRef.current) chord()
    setTimeout(() => {
      eggRef.current = 0
      setEggStart(0)
    }, EGG_MS)
  }, [])

  // ---------- the main loop: scroll is the playhead ----------
  useEffect(() => {
    let raf
    const loop = (time) => {
      raf = requestAnimationFrame(loop)
      const el = containerRef.current
      if (!el || document.hidden) return
      const { topDoc, total, rectTop } = geometry()
      let t = clamp(-rectTop / total, 0, 1)

      if (playingRef.current) {
        const dt = Math.min(64, time - lastTimeRef.current)
        let nt = t + dt / (PLAY_MS / speedRef.current)
        if (nt >= 1) {
          nt = 1
          playingRef.current = false
          setPlaying(false)
          if (soundRef.current) chord()
        }
        window.scrollTo(0, topDoc + nt * total)
        t = nt
      }
      lastTimeRef.current = time

      const buf = trailRef.current
      buf.push({ t, time })
      while (buf.length && time - buf[0].time > 400) buf.shift()

      const idx = Math.min(STOPS, Math.round(t * STOPS))
      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx
        setPulse({ idx, stamp: time })
        if (soundRef.current) tick(idx)
      }

      if (t > 0.004) markTouched()

      // with reduced motion there is no idle animation, so skip
      // re-renders while parked
      if (reducedRef.current && Math.abs(t - viewRef.current.t) < 1e-5 && !eggRef.current) return
      viewRef.current = { t, clock: time }
      setView(viewRef.current)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [geometry, markTouched])

  // user scroll intent interrupts playback / tweens
  useEffect(() => {
    const interrupt = () => {
      if (playingRef.current || tweenRef.current) stopMotion()
    }
    window.addEventListener('wheel', interrupt, { passive: true })
    window.addEventListener('touchmove', interrupt, { passive: true })
    return () => {
      window.removeEventListener('wheel', interrupt)
      window.removeEventListener('touchmove', interrupt)
    }
  }, [stopMotion])

  // ---------- keyboard: it behaves like a real editor ----------
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key.length === 1) {
        typedRef.current = (typedRef.current + e.key.toLowerCase()).slice(-5)
        if (typedRef.current === 'manim') triggerEgg()
      }
      if (dossierRef.current) return // Esc is handled by the dossier itself

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const idx = clamp(Math.round(viewRef.current.t * STOPS) + dir, 0, STOPS)
        tweenTo(idx / STOPS)
      } else if (/^[1-5]$/.test(e.key)) {
        tweenTo((Number(e.key) - 1) / STOPS)
      } else if (e.key === 's') {
        toggleSound()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, tweenTo, toggleSound, triggerEgg])

  // a note for the curious
  useEffect(() => {
    console.log(
      '%c ▶ you found the console. ',
      'background:#0B0E14;color:#58C4DD;font-family:monospace;font-size:14px;padding:6px 4px;border:1px solid #58C4DD;border-radius:4px'
    )
    console.log('%ctry typing "manim" on the page. — DR', 'color:#8A94A6;font-family:monospace')
  }, [])

  const openDossier = useCallback((id) => {
    stopMotion()
    dossierRef.current = id
    setDossierId(id)
  }, [stopMotion])

  const closeDossier = useCallback(() => {
    dossierRef.current = null
    setDossierId(null)
  }, [])

  // ---------- track interactions ----------
  const trackT = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    return clamp((e.clientX - r.left) / r.width, 0, 1)
  }
  const onTrackDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = true
    setDragging(true)
    markTouched()
    stopMotion()
    scrollToT(trackT(e))
  }
  const onTrackMove = (e) => {
    if (dragRef.current) scrollToT(trackT(e))
  }
  const onTrackUp = () => {
    dragRef.current = false
    setDragging(false)
  }

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speedRef.current) + 1) % SPEEDS.length]
    speedRef.current = next
    setSpeed(next)
  }

  // ============================================================
  //  render-time math (pure function of view + interaction state)
  // ============================================================
  const { t, clock } = view
  const layouts = buildLayouts()
  const reduced = reducedRef.current

  const seg = Math.min(STOPS - 1, Math.floor(t * STOPS))
  const local = t * STOPS - seg
  const s = smooth(local)

  const morphAt = (tt) => {
    const sg = Math.min(STOPS - 1, Math.floor(tt * STOPS))
    const lc = smooth(tt * STOPS - sg)
    const A = reduced ? layouts[sg] : idlePerturb(sg, layouts[sg], clock)
    const B = reduced ? layouts[sg + 1] : idlePerturb(sg + 1, layouts[sg + 1], clock)
    const pts = new Array(A.length)
    for (let i = 0; i < A.length; i++) {
      pts[i] = [A[i][0] + (B[i][0] - A[i][0]) * lc, A[i][1] + (B[i][1] - A[i][1]) * lc]
    }
    return pts
  }

  let pts = morphAt(t)

  // color: blend the two neighbouring chapter colors
  const c1 = CHAPTERS[seg].rgb
  const c2 = CHAPTERS[seg + 1].rgb
  let R = c1[0] + (c2[0] - c1[0]) * s
  let G = c1[1] + (c2[1] - c1[1]) * s
  let B = c1[2] + (c2[2] - c1[2]) * s

  // the "manim" easter egg: everything becomes π for a moment
  if (eggStart && clock > eggStart) {
    const e = clamp((clock - eggStart) / EGG_MS, 0, 1)
    const w = smooth(clamp(e / 0.18, 0, 1)) * smooth(clamp((1 - e) / 0.22, 0, 1))
    const pi = piLayout()
    pts = pts.map((p, i) => [p[0] + (pi[i][0] - p[0]) * w, p[1] + (pi[i][1] - p[1]) * w])
    const [er, eg, eb] = hslToRgb((clock * 0.12) % 360, 0.85, 0.66)
    R += (er - R) * w
    G += (eg - G) * w
    B += (eb - B) * w
  }

  const shapeColor = `rgb(${R | 0},${G | 0},${B | 0})`
  const shapeGlow = `rgba(${R | 0},${G | 0},${B | 0},0.35)`

  // motion trails: ghosts of where the points just were
  const ghosts = []
  if (!reduced) {
    const buf = trailRef.current
    for (const lag of [90, 180]) {
      const cutoff = clock - lag
      let entry = null
      for (let i = buf.length - 1; i >= 0; i--) {
        if (buf[i].time <= cutoff) {
          entry = buf[i]
          break
        }
      }
      if (entry && Math.abs(entry.t - t) > 0.0008) {
        ghosts.push({ pts: morphAt(entry.t), opacity: lag === 90 ? 0.16 : 0.07, r: lag === 90 ? 2.4 : 1.8 })
      }
    }
  }

  const dParts = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
  const d = dParts.join(' ')

  const idx = Math.min(STOPS, Math.round(t * STOPS))
  const ch = CHAPTERS[idx]
  const chipBorder = `rgba(${ch.rgb[0]},${ch.rgb[1]},${ch.rgb[2]},0.4)`
  const yearNow = CHAPTERS[seg].year + (CHAPTERS[seg + 1].year - CHAPTERS[seg].year) * local
  const pct = `${(t * 100).toFixed(2)}%`
  const frame = Math.round(t * 168)

  const dossierChapter = dossierId ? CHAPTERS.find((c) => c.key === dossierId) : null

  return (
    <div className="playhead-scroll" ref={containerRef}>
      <div className="playhead-stage">
        {/* masthead */}
        <header className="ph-masthead">
          <span style={{ color: 'var(--blue)' }}>DR</span>
          <span>/</span>
          <span className="ph-domain">{PREMISE.domain}</span>
          <span style={{ flex: 1 }} />
          <span className="ph-scene" key={ch.key} style={{ color: ch.color }}>
            {ch.scene}
          </span>
          <button className="ph-mast-btn" onClick={() => tweenTo(1)} title="jump to the end">
            SKIP TO NOW ⇥
          </button>
        </header>

        {/* premise */}
        <div className="ph-premise">
          <h1 className="ph-headline">
            {PREMISE.headline[0]}
            <br />
            <span>{PREMISE.headline[1]}</span>
          </h1>
          <button
            className="ph-year"
            style={{ color: ch.color }}
            onClick={cycleSpeed}
            title="playback speed"
          >
            t = {yearNow.toFixed(1)}
            {speed !== 1 && <span className="ph-speed"> ×{speed}</span>}
          </button>
        </div>

        {/* morph stage */}
        <div className="ph-stage-wrap">
          <svg
            className="ph-stage-svg"
            viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {/* faint manim-style axis */}
            <line
              x1="0"
              y1={STAGE_H / 2}
              x2={STAGE_W}
              y2={STAGE_H / 2}
              stroke="rgba(138,148,166,0.1)"
              strokeWidth="1"
              strokeDasharray="2 8"
            />
            {Array.from({ length: 13 }, (_, i) => (
              <line
                key={i}
                x1={20 + i * ((STAGE_W - 40) / 12)}
                y1={STAGE_H / 2 - 4}
                x2={20 + i * ((STAGE_W - 40) / 12)}
                y2={STAGE_H / 2 + 4}
                stroke="rgba(138,148,166,0.14)"
                strokeWidth="1"
              />
            ))}
            {/* viewfinder corners */}
            {[
              [8, 8, 1, 1],
              [STAGE_W - 8, 8, -1, 1],
              [8, STAGE_H - 8, 1, -1],
              [STAGE_W - 8, STAGE_H - 8, -1, -1],
            ].map(([x, y, dx, dy], i) => (
              <path
                key={i}
                d={`M${x + dx * 22} ${y} L${x} ${y} L${x} ${y + dy * 22}`}
                fill="none"
                stroke="rgba(138,148,166,0.3)"
                strokeWidth="1.5"
              />
            ))}
            {/* frame counter */}
            <text
              x={STAGE_W - 16}
              y={STAGE_H - 14}
              textAnchor="end"
              fill="rgba(138,148,166,0.55)"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10.5"
              letterSpacing="1.5"
            >
              f {String(frame).padStart(3, '0')} / 168
            </text>

            {/* trails */}
            {ghosts.map((g, gi) => (
              <g key={gi} opacity={g.opacity}>
                {g.pts.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r={g.r} fill={shapeColor} />
                ))}
              </g>
            ))}

            {/* the shape */}
            <path d={d} fill="none" stroke={shapeColor} strokeWidth="1" opacity="0.22" />
            {pts.map((p, i) => (
              <circle key={`h${i}`} cx={p[0]} cy={p[1]} r="9" fill={shapeGlow} opacity="0.28" />
            ))}
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill={shapeColor} />
            ))}
          </svg>

          <div className={`ph-hint${touched ? ' gone' : ''}`}>⟵ {PREMISE.hint} ⟶</div>
        </div>

        {/* chapter readout */}
        <div className="ph-readout">
          <div className="ph-read-main" key={ch.key}>
            <div className="ph-chap-label" style={{ color: ch.color }}>
              {ch.label}
            </div>
            <div className="ph-chap-title">{ch.title}</div>
            <p className="ph-chap-body">{ch.body}</p>
          </div>
          <div className="ph-read-side" key={`${ch.key}-side`}>
            {ch.dossierLink && (
              <button
                className="ph-dossier-link"
                style={{ color: ch.color, borderColor: chipBorder }}
                onClick={() => openDossier(ch.key)}
              >
                {ch.dossierLink}
              </button>
            )}
          </div>
        </div>

        {/* player bar */}
        <div className="ph-player">
          <button
            className="ph-play"
            style={{ borderColor: ch.color, color: ch.color, '--glow': chipBorder }}
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play — seven years in twenty seconds'}
          >
            {playing ? '❚❚' : '▶'}
          </button>

          <div
            className="ph-track"
            onPointerDown={onTrackDown}
            onPointerMove={onTrackMove}
            onPointerUp={onTrackUp}
            onPointerCancel={onTrackUp}
          >
            <div className="ph-rail" />
            <div
              className="ph-progress"
              style={{ width: pct, background: ch.color, boxShadow: `0 0 12px ${chipBorder}` }}
            />
            {CHAPTERS.map((c, i) => {
              const left = `${(i / STOPS) * 100}%`
              const pulsing = pulse.idx === i
              return (
                <button
                  key={pulsing ? `${c.key}-${pulse.stamp}` : c.key}
                  className={`ph-kf${pulsing ? ' pulse' : ''}${i === idx ? ' active' : ''}`}
                  style={{ left, '--kf': c.color }}
                  onClick={(e) => {
                    e.stopPropagation()
                    tweenTo(i / STOPS)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={`Jump to ${c.mark}`}
                />
              )
            })}
            <div
              className="ph-knob"
              style={{ left: pct, background: ch.color, boxShadow: `0 0 18px ${chipBorder}` }}
            />
            {dragging && (
              <div className="ph-scrub-tip" style={{ left: pct, color: ch.color }}>
                {yearNow.toFixed(1)}
              </div>
            )}
            {CHAPTERS.map((c, i) => (
              <div
                key={c.key}
                className={`ph-kf-label${i === idx ? ' active' : ''}`}
                style={{
                  left: `${(i / STOPS) * 100}%`,
                  transform: i === 0 ? 'none' : i === STOPS ? 'translateX(-100%)' : 'translateX(-50%)',
                  color: i === idx ? c.color : undefined,
                }}
              >
                {c.mark}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dossier chapter={dossierChapter} onClose={closeDossier} />
    </div>
  )
}
