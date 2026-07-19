import { useEffect, useRef, useState } from 'react'
import { DOSSIERS, LINKS } from '../content.js'
import LaserLab from './LaserLab.jsx'

const alpha = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`

// Wraps a local looping video so clicking it opens the full version on YouTube.
// Without an href the video stays a plain, non-interactive loop.
function VideoLink({ href, children }) {
  if (!href) return children
  return (
    <a
      className="video-link"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Watch on YouTube"
    >
      {children}
      <span className="video-link-cue" aria-hidden="true">▶</span>
    </a>
  )
}

function VideoEmbed({ id, href }) {
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
        <VideoLink href={href}>
          <video
            src={id}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        </VideoLink>
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

// A lesson that lives on its own site: show its opening screen inside a
// browser-chrome frame. Used as the left-hand visual of a lesson card.
function LessonWindow({ lab, accent }) {
  return (
    <a
      className="lesson-window"
      href={lab.href}
      target="_blank"
      rel="noreferrer"
      style={{ '--lw-accent': accent }}
      aria-label={`Open the ${lab.title} lesson`}
    >
      <span className="lesson-chrome">
        <span className="lesson-dots" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="lesson-url">{lab.href.replace(/^https?:\/\//, '')}</span>
      </span>
      <span className="lesson-shot">
        <img src={lab.shot} alt={lab.shotAlt} loading="lazy" />
        <span className="lesson-veil" aria-hidden="true">
          <span className="lesson-cta" style={{ background: accent }}>
            OPEN →
          </span>
        </span>
      </span>
    </a>
  )
}

// The tabbed lessons lab used by the present-day (SCENE 01) dossier.
// Each tab swaps in a live, self-contained interactive lesson; the
// caption argues WHY before HOW, matching the pedagogy on the page.
function LabSwitcher({ labs, accent }) {
  const [active, setActive] = useState(labs[0].id)
  const lab = labs.find((l) => l.id === active) || labs[0]
  return (
    <div className="lab-switcher">
      <div className="lab-tabs" role="tablist" aria-label="Interactive lessons">
        <span className="lab-tabs-label" style={{ color: accent }}>LESSONS</span>
        {labs.map((l) => {
          const on = l.id === active
          return (
            <button
              key={l.id}
              role="tab"
              aria-selected={on}
              className={`lab-tab${on ? ' on' : ''}`}
              style={on ? { borderColor: accent, color: accent } : undefined}
              onClick={() => setActive(l.id)}
            >
              {l.tab}
            </button>
          )
        })}
      </div>

      {/* keep each engine keyed so switching tabs cleanly remounts it.
          `link` lessons lay the shot and its description side by side to
          keep the footprint short; the laser bench stays full-width. */}
      {lab.kind === 'laser' ? (
        <>
          <div className="lab-caption">
            <span className="lab-caption-title">{lab.title}</span>
            <span className="lab-caption-blurb">{lab.blurb}</span>
          </div>
          <div className="lab-stage" key={lab.id}>
            <LaserLab />
          </div>
        </>
      ) : (
        <div className="lab-card" key={lab.id}>
          <LessonWindow lab={lab} accent={accent} />
          <div className="lab-card-body">
            <span className="lab-caption-title">{lab.title}</span>
            <span className="lab-caption-blurb">{lab.blurb}</span>
            <a
              className="lab-card-cta"
              href={lab.href}
              target="_blank"
              rel="noreferrer"
              style={{ color: accent, borderColor: accent }}
            >
              Take the lesson →
            </a>
          </div>
        </div>
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

// The inner content of a dossier sheet. Rendered both for the
// top-level chapter dossiers and for a nested one (e.g. DubDesk
// inside 3Blue1Brown), so the two always look and behave the same.
// `escHint` differs by level: nested dossiers return to their
// parent, top-level ones return to the timeline.
function DossierBody({
  data,
  accent,
  title,
  chapterKey,
  closeRef,
  onClose,
  onOpenNested,
  escHint,
}) {
  return (
    <div className="dossier-content" key={chapterKey}>
      <div className="dossier-head">
        <span className="dossier-diamond" style={{ borderColor: accent }} />
        <div className="mono-label" style={{ color: accent }}>
          {data.kicker}
        </div>
        <span style={{ flex: 1 }} />
        <button ref={closeRef} className="dossier-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {title && <h3 className="dossier-title">{title}</h3>}
      {data.intro && <p className="dossier-intro">{data.intro}</p>}

      {chapterKey === 'student' && <LauncherFigure accent={accent} />}

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

      {/* the tool-inside-the-work: a dossier nested one level deeper */}
      {data.nested && (
        <button className="nested-open" onClick={onOpenNested}>
          <span className="nested-open-note" style={{ color: accent }}>
            {data.nested.note}
          </span>
          <span className="nested-open-link" style={{ color: accent, borderColor: accent }}>
            {data.nested.linkText}
          </span>
        </button>
      )}

      {data.labs && <LabSwitcher labs={data.labs} accent={accent} />}

      {data.videos && (
        <div>
          <div className="mono-label" style={{ color: accent, marginBottom: 10 }}>
            FROM THE CHANNEL
          </div>
          <div className="video-grid">
            {LINKS.featuredVideoIds.map((id, i) => (
              <VideoEmbed key={id} id={id} href={LINKS.featuredVideoLinks[i]} />
            ))}
          </div>
        </div>
      )}

      <div className="cta-row">
        {data.ctaText && (
          <a
            className="btn-primary"
            style={{ background: accent }}
            href={LINKS[data.ctaLink]}
            target="_blank"
            rel="noreferrer"
          >
            {data.ctaText}
          </a>
        )}
        <span className="dossier-esc-hint">{escHint}</span>
      </div>
    </div>
  )
}

export default function Dossier({ chapter, origin, onClose }) {
  const open = Boolean(chapter)
  const [display, setDisplay] = useState(chapter)
  const [nestedOpen, setNestedOpen] = useState(false)
  const closeBtnRef = useRef(null)
  const nestedCloseRef = useRef(null)

  // keep content mounted during the slide-out animation
  useEffect(() => {
    if (chapter) {
      setDisplay(chapter)
      return
    }
    const t = setTimeout(() => setDisplay(null), 520)
    return () => clearTimeout(t)
  }, [chapter])

  // a nested dossier only belongs to its parent — closing the parent
  // (or switching chapters) must not leave it hanging open
  useEffect(() => {
    if (!chapter) setNestedOpen(false)
  }, [chapter])

  const closeNested = () => setNestedOpen(false)

  // esc: close the nested sheet first if it's open, else the whole
  // dossier. scroll lock (which also freezes the playhead) + focus.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (nestedOpen) closeNested()
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, nestedOpen])

  // move focus into the nested sheet when it opens
  useEffect(() => {
    if (nestedOpen) nestedCloseRef.current?.focus()
    else if (open) closeBtnRef.current?.focus()
  }, [nestedOpen, open])

  const ch = display
  const data = ch ? DOSSIERS[ch.key] : null
  if (!ch || !data) return null

  const accent = ch.color
  const nested = data.nested
  const nestedData = nested?.dossier

  return (
    <>
      <div
        className={`dossier-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`dossier-sheet${open ? ' open' : ''}`}
        style={{
          borderColor: alpha(ch.rgb, 0.45),
          '--from-x': `${origin ? origin.x : 0}px`,
          '--from-y': `${origin ? origin.y : 0}px`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={ch.label}
        aria-hidden={nestedOpen ? 'true' : undefined}
      >
        <DossierBody
          data={data}
          accent={accent}
          title={ch.title}
          chapterKey={ch.key}
          closeRef={closeBtnRef}
          onClose={onClose}
          onOpenNested={() => setNestedOpen(true)}
          escHint="ESC TO RETURN TO THE TIMELINE"
        />
      </aside>

      {/* nested deep-dive (DubDesk): stacks on top, closes back into
          the parent dossier rather than all the way to the timeline */}
      {nestedData && (
        <>
          <div
            className={`dossier-backdrop nested${nestedOpen ? ' open' : ''}`}
            onClick={closeNested}
            aria-hidden="true"
          />
          <aside
            className={`dossier-sheet nested${nestedOpen ? ' open' : ''}`}
            style={{ borderColor: alpha(ch.rgb, 0.45) }}
            role="dialog"
            aria-modal="true"
            aria-label={nested.note}
          >
            <DossierBody
              data={nestedData}
              accent={accent}
              title={null}
              chapterKey={`${ch.key}-nested`}
              closeRef={nestedCloseRef}
              onClose={closeNested}
              escHint="ESC TO RETURN TO 3BLUE1BROWN"
            />
          </aside>
        </>
      )}
    </>
  )
}
