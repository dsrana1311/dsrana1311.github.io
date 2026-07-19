import { useEffect, useRef, useState } from 'react'
import { NODES, LINKS } from '../content.js'
import Playground from './Playground.jsx'

const alpha = (hex, a) =>
  hex + Math.round(a * 255).toString(16).padStart(2, '0')

/* ---------------- per-node bodies ---------------- */

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

function EducatorBody({ accent }) {
  return (
    <>
      <div>
        <div className="mono-label" style={{ color: accent, marginBottom: 8 }}>
          LIVE PROOF — A VECTOR FIELD YOU CAN BEND
        </div>
        <p className="overlay-intro" style={{ marginBottom: 14 }}>
          This isn’t a video of a simulation — it <em>is</em> the simulation, built into this
          page. Drop in vortices and sources, drag them around, and watch a thousand particles
          renegotiate their paths in real time. This is what I mean by making forces visible.
        </p>
        <Playground />
      </div>

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

      <div className="cta-row">
        <a
          className="btn-primary"
          style={{ background: accent }}
          href={LINKS.youtubeChannel}
          target="_blank"
          rel="noreferrer"
        >
          Visit the channel
        </a>
      </div>
    </>
  )
}

function CommunicatorBody({ accent }) {
  const steps = [
    ['01', 'Translate', 'Carry the math across languages without dropping a single ε of precision.'],
    ['02', 'Adapt', 'Rebuild the jokes, metaphors and rhythm so Hindi viewers feel the original wonder.'],
    ['03', 'Perform', 'Voice every line myself — pacing matched to Grant’s, energy matched to the idea.'],
    ['04', 'Sync', 'Time each take against the animation so the reveal lands on the exact frame.'],
  ]
  return (
    <>
      <div>
        <div className="mono-label" style={{ color: accent, marginBottom: 10 }}>
          WHAT LOCALIZATION ACTUALLY TAKES
        </div>
        <div className="step-row">
          {steps.map(([num, name, desc]) => (
            <div key={num} className="step-card">
              <span className="step-num" style={{ color: accent }}>{num}</span>
              <span className="step-name">{name}</span>
              <span className="step-desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="cta-row">
        <a
          className="btn-primary"
          style={{ background: accent }}
          href={LINKS.hindi3b1b}
          target="_blank"
          rel="noreferrer"
        >
          Watch 3Blue1Brown in Hindi
        </a>
      </div>
    </>
  )
}

function BuilderBody({ accent }) {
  const facts = [
    ['SCRIPT ALIGNMENT', 'Original and translated scripts side by side, line-locked, so nothing drifts.'],
    ['TAKE MANAGEMENT', 'Record, compare and pick takes without leaving the flow.'],
    ['TIMING & SYNC', 'Every line timed against the source narration — the reveal lands where it should.'],
  ]
  return (
    <>
      <div>
        <div className="mono-label" style={{ color: accent, marginBottom: 4 }}>
          WHAT DUBDESK DOES
        </div>
        {facts.map(([k, v]) => (
          <div key={k} className="fact-row">
            <span className="fact-key" style={{ color: accent }}>{k}</span>
            <span className="fact-val">{v}</span>
          </div>
        ))}
      </div>
      <div className="cta-row">
        <a
          className="btn-primary"
          style={{ background: accent }}
          href={LINKS.dubdesk}
          target="_blank"
          rel="noreferrer"
        >
          See DubDesk
        </a>
      </div>
    </>
  )
}

function LauncherFigure({ accent }) {
  return (
    <div className="fig-box">
      <svg width="240" height="150" viewBox="0 0 240 150" aria-hidden="true">
        {/* spin circle */}
        <circle
          cx="70" cy="70" r="40"
          fill="none"
          stroke="rgba(138,148,166,0.35)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        {/* tangent release line (top of circle) */}
        <line
          x1="70" y1="30" x2="225" y2="30"
          stroke={accent}
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.7"
        />
        <polygon points="225,30 216,26 216,34" fill={accent} opacity="0.7" />
        {/* rotating arm */}
        <g className="launcher-arm">
          <line x1="70" y1="70" x2="70" y2="30" stroke={accent} strokeWidth="1.5" />
          <circle cx="70" cy="30" r="5" fill={accent} />
        </g>
        {/* hub */}
        <circle cx="70" cy="70" r="4" fill="#E8EDF4" />
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
        FIG. 1 — RELEASE ALONG THE TANGENT · TENSION AT 10,000 RPM ≈ 4.2 kN
      </div>
    </div>
  )
}

function EngineerBody({ accent }) {
  const facts = [
    ['2019–2023', 'B.Tech, Mechanical Engineering — the grammar of the physical world.'],
    ['2022', 'Kinetic launch system inspired by SpinLaunch: CAD, fabrication, live spin tests.'],
    ['2023–2025', 'Body Design Engineer at Maruti Suzuki — front underbody packaging, a 400+ part list, and tolerances with consequences.'],
    ['2025', 'Left to make STEM education the day job. No regrets; excellent torque stories.'],
  ]
  return (
    <>
      <LauncherFigure accent={accent} />
      <div>
        <div className="mono-label" style={{ color: accent, marginBottom: 4 }}>
          THE RECORD
        </div>
        {facts.map(([k, v]) => (
          <div key={k} className="fact-row">
            <span className="fact-key" style={{ color: accent }}>{k}</span>
            <span className="fact-val">{v}</span>
          </div>
        ))}
      </div>
    </>
  )
}

const BODIES = {
  educator: EducatorBody,
  communicator: CommunicatorBody,
  builder: BuilderBody,
  engineer: EngineerBody,
}

/* ---------------- the overlay shell ---------------- */

export default function Overlay({ activeId, onClose }) {
  const open = Boolean(activeId)
  const [displayId, setDisplayId] = useState(activeId)
  const closeBtnRef = useRef(null)

  // keep content mounted during the slide-out animation
  useEffect(() => {
    if (activeId) {
      setDisplayId(activeId)
      return
    }
    const t = setTimeout(() => setDisplayId(null), 520)
    return () => clearTimeout(t)
  }, [activeId])

  // esc to close, scroll lock, focus management
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

  const node = displayId ? NODES[displayId] : null
  const Body = node ? BODIES[node.id] : null

  return (
    <>
      {node && (
        <div
          className={`overlay-backdrop${open ? ' open' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`overlay-panel${open ? ' open' : ''}`}
        style={node ? { borderLeft: `1px solid ${alpha(node.accent, 0.4)}` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={node ? node.label : undefined}
      >
        {node && (
          <div className="overlay-content" key={node.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: node.accent,
                  boxShadow: `0 0 14px ${alpha(node.accent, 0.6)}`,
                  flex: 'none',
                }}
              />
              <div className="mono-label" style={{ color: node.accent }}>
                {node.label}
              </div>
              <span style={{ flex: 1 }} />
              <button
                ref={closeBtnRef}
                className="overlay-close"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <h3 className="overlay-title">{node.title}</h3>
            <p className="overlay-intro">{node.intro}</p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {node.chips.map((c) => (
                <span
                  key={c}
                  className="chip"
                  style={{ color: node.accent, border: `1px solid ${alpha(node.accent, 0.4)}` }}
                >
                  {c}
                </span>
              ))}
            </div>

            {Body && <Body accent={node.accent} />}
          </div>
        )}
      </aside>
    </>
  )
}
