import { useEffect, useRef, useState } from 'react'
import { DOSSIERS, LINKS } from '../content.js'
import LaserLab from './LaserLab.jsx'

const alpha = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`

function VideoEmbed({ id }) {
  const isPlaceholder = id.startsWith('VIDEO_ID')
  const isLocal = /\.(mp4|webm|ogg)$/i.test(id)
  return (
    <div className="video-embed">
      {isPlaceholder ? (
        <div className="video-placeholder">
          <span style={{ fontSize: 22 }}>▶</span>
          <span>VIDEO EMBED</span>
          <span style={{ opacity: 0.6 }}>add ID in src/content.js</span>
        </div>
      ) : isLocal ? (
        <video
          src={id}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  )
}

const CX = 70
const CY = 70
const R = 40
const RELEASE_X = 225 // x at which the launched projectile leaves the visible stage
const BASE_DEG_PER_SEC = 360 / 2.2 // matches the old CSS spin360 2.2s default

function LauncherFigure({ accent }) {
  const rafRef = useRef(null)
  const lastTRef = useRef(null)
  const angleRef = useRef(0) // degrees, 0 = top of circle, increases clockwise
  const armGroupRef = useRef(null)
  const projRef = useRef(null)

  const [speed, setSpeed] = useState(1) // multiplier on BASE_DEG_PER_SEC
  const armedRef = useRef(false) // launch requested, waiting for the arm to reach the top
  const [armed, setArmed] = useState(false)
  const launchingRef = useRef(false)
  const [launching, setLaunching] = useState(false)
  const launchXRef = useRef(RELEASE_X)
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    const tick = (t) => {
      if (lastTRef.current == null) lastTRef.current = t
      const dt = (t - lastTRef.current) / 1000
      lastTRef.current = t

      if (launchingRef.current) {
        // straight-line flight along the tangent, always to the right
        const v = BASE_DEG_PER_SEC * speedRef.current * (Math.PI / 180) * R
        launchXRef.current += v * dt
        if (projRef.current) {
          projRef.current.setAttribute('cx', String(launchXRef.current))
        }
        if (launchXRef.current > RELEASE_X + 40) {
          // reset back into orbit
          launchingRef.current = false
          setLaunching(false)
          angleRef.current = 0
          launchXRef.current = RELEASE_X
        }
      } else {
        const prevAngle = angleRef.current
        const nextAngle = prevAngle + BASE_DEG_PER_SEC * speedRef.current * dt

        if (armedRef.current && nextAngle >= 360) {
          // arm has come back round to the top — release now
          armedRef.current = false
          setArmed(false)
          launchingRef.current = true
          setLaunching(true)
          angleRef.current = 0
          launchXRef.current = CX
        } else {
          angleRef.current = nextAngle % 360
          if (armGroupRef.current) {
            armGroupRef.current.setAttribute('transform', `rotate(${angleRef.current} ${CX} ${CY})`)
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleLaunch = () => {
    if (launchingRef.current || armedRef.current) return
    armedRef.current = true
    setArmed(true)
  }

  return (
    <div className="fig-box">
      <svg width="240" height="150" viewBox="0 0 240 150" aria-hidden="true">
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="rgba(138,148,166,0.35)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <line
          x1={CX} y1={CY - R} x2="225" y2={CY - R}
          stroke={accent}
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.7"
        />
        <polygon points="225,30 216,26 216,34" fill={accent} opacity="0.7" />
        {!launching && (
          <g ref={armGroupRef}>
            <line x1={CX} y1={CY} x2={CX} y2={CY - R} stroke={accent} strokeWidth="1.5" />
            <circle cx={CX} cy={CY - R} r="5" fill={accent} />
          </g>
        )}
        {launching && (
          <circle ref={projRef} cx={CX} cy={CY - R} r="5" fill={accent} />
        )}
        <circle cx={CX} cy={CY} r="4" fill="#E8EDF4" />
        <text
          x="150" y="52"
          fill="rgba(138,148,166,0.9)"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="10"
          letterSpacing="1"
        >
          v = ωr
        </text>
      </svg>
      <div className="fig-caption">
        FIG. 1 — RELEASE ALONG THE TANGENT
      </div>
      <div className="launcher-controls">
        <span className="mono-label" style={{ color: 'var(--graphite)' }}>SPIN</span>
        <button className="tool-btn" onClick={() => setSpeed((s) => Math.max(0.25, s - 0.25))}>−</button>
        <span className="launcher-speed-val">{speed.toFixed(2)}×</span>
        <button className="tool-btn" onClick={() => setSpeed((s) => Math.min(4, s + 0.25))}>+</button>
        <span style={{ flex: 1 }} />
        <button
          className={`tool-btn launch-btn${launching || armed ? ' on' : ''}`}
          style={launching || armed ? { borderColor: accent, background: accent } : undefined}
          onClick={handleLaunch}
          disabled={launching || armed}
        >
          {launching ? 'IN FLIGHT →' : armed ? 'RELEASING…' : 'LAUNCH →'}
        </button>
      </div>
    </div>
  )
}

export default function Dossier({ chapter, onClose }) {
  const open = Boolean(chapter)
  const [display, setDisplay] = useState(chapter)
  const closeBtnRef = useRef(null)

  // keep content mounted during the slide-out animation
  useEffect(() => {
    if (chapter) {
      setDisplay(chapter)
      return
    }
    const t = setTimeout(() => setDisplay(null), 520)
    return () => clearTimeout(t)
  }, [chapter])

  // esc to close, scroll lock (which also freezes the playhead), focus
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const ch = display
  const data = ch ? DOSSIERS[ch.key] : null
  if (!ch || !data) return null

  const accent = ch.color

  return (
    <>
      <div
        className={`dossier-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`dossier-sheet${open ? ' open' : ''}`}
        style={{ borderTop: `1px solid ${alpha(ch.rgb, 0.5)}` }}
        role="dialog"
        aria-modal="true"
        aria-label={ch.label}
      >
        <div className="dossier-content" key={ch.key}>
          <div className="dossier-head">
            <span className="dossier-diamond" style={{ borderColor: accent }} />
            <div className="mono-label" style={{ color: accent }}>
              {data.kicker}
            </div>
            <span style={{ flex: 1 }} />
            <button ref={closeBtnRef} className="dossier-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <h3 className="dossier-title">{ch.title}</h3>
          <p className="dossier-intro">{data.intro}</p>

          {ch.key === 'student' && <LauncherFigure accent={accent} />}

          {data.facts && (
            <div>
              {data.facts.map(([k, v]) => (
                <div key={k} className="fact-row">
                  <span className="fact-key" style={{ color: accent }}>{k}</span>
                  <span className="fact-val">{v}</span>
                </div>
              ))}
            </div>
          )}

          {data.steps && (
            <div className="step-row">
              {data.steps.map(([num, name, desc]) => (
                <div key={num} className="step-card">
                  <span className="step-num" style={{ color: accent }}>{num}</span>
                  <span className="step-name">{name}</span>
                  <span className="step-desc">{desc}</span>
                </div>
              ))}
            </div>
          )}

          {data.playground && <LaserLab />}

          {data.videos && (
            <div>
              <div className="mono-label" style={{ color: accent, marginBottom: 10 }}>
                FROM THE CHANNEL
              </div>
              <div className="video-grid">
                {LINKS.featuredVideoIds.map((id) => (
                  <VideoEmbed key={id} id={id} />
                ))}
              </div>
            </div>
          )}

          {data.ctaText && (
            <div className="cta-row">
              <a
                className="btn-primary"
                style={{ background: accent }}
                href={LINKS[data.ctaLink]}
                target="_blank"
                rel="noreferrer"
              >
                {data.ctaText}
              </a>
              <span className="dossier-esc-hint">ESC TO RETURN TO THE TIMELINE</span>
            </div>
          )}
          {!data.ctaText && (
            <div className="cta-row">
              <span className="dossier-esc-hint">ESC TO RETURN TO THE TIMELINE</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
