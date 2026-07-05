import { useState } from 'react'
import { TIMELINE } from '../content.js'

const alpha = (hex, a) =>
  hex + Math.round(a * 255).toString(16).padStart(2, '0')

// x positions for 5 milestones across the 1000-wide viewBox, and their
// heights along a rising "growth curve" (SVG y is inverted).
const XS = [100, 300, 500, 700, 900]
const YS = [172, 150, 116, 76, 42]
const CURVE =
  'M100,172 C180,166 220,160 300,150 C380,140 420,132 500,116 C580,100 620,92 700,76 C780,60 820,54 900,42'

export default function Trajectory({ onOpen }) {
  const [active, setActive] = useState(-1)

  return (
    <section className="section trajectory" id="trajectory">
      <div className="section-head">
        <div className="section-kicker">§ 01 — THE TRAJECTORY</div>
        <h2 className="serif-h2">From torque wrenches to teaching.</h2>
        <p>
          Seven years, one continuous function. Hover the curve; click a milestone to open its
          node.
        </p>
      </div>

      {/* desktop: the curve */}
      <div className="traj-horizontal">
        <div className="traj-svg-wrap">
          <svg className="traj-svg" viewBox="0 0 1000 210" aria-hidden="true">
            <path
              d={CURVE}
              fill="none"
              stroke="rgba(138,148,166,0.4)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            {TIMELINE.map((item, i) => (
              <g
                key={item.year}
                className="traj-point"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(-1)}
                onClick={() => onOpen(item.node)}
              >
                {/* generous invisible hit area */}
                <circle cx={XS[i]} cy={YS[i]} r="22" fill="transparent" />
                <circle
                  cx={XS[i]}
                  cy={YS[i]}
                  r={active === i ? 13 : 10}
                  fill="none"
                  stroke={alpha(item.accent, active === i ? 0.55 : 0.3)}
                  strokeWidth="1"
                  style={{ transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
                />
                <circle
                  className="core"
                  cx={XS[i]}
                  cy={YS[i]}
                  r={active === i ? 7 : 5}
                  fill={item.accent}
                  style={{
                    filter: `drop-shadow(0 0 ${active === i ? 10 : 5}px ${alpha(item.accent, 0.7)})`,
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
                <text
                  x={XS[i]}
                  y={YS[i] - 24}
                  textAnchor="middle"
                  fill={active === i ? item.accent : 'rgba(138,148,166,0.8)'}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="13"
                  letterSpacing="2"
                  style={{ transition: 'fill 0.3s ease' }}
                >
                  {item.year}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="traj-grid">
          {TIMELINE.map((item, i) => (
            <div
              key={item.year}
              className="traj-card"
              style={{
                borderColor: active === i ? alpha(item.accent, 0.5) : undefined,
              }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(-1)}
              onClick={() => onOpen(item.node)}
            >
              <div className="traj-year" style={{ color: item.accent }}>
                {item.year}
              </div>
              <div className="traj-title">{item.title}</div>
              <div className="traj-detail">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* mobile: vertical rail */}
      <div className="traj-vertical">
        {TIMELINE.map((item, i) => (
          <div key={item.year} className="traj-v-item" onClick={() => onOpen(item.node)}>
            <div className="traj-v-rail">
              <div
                className="traj-v-dot"
                style={{
                  background: item.accent,
                  boxShadow: `0 0 10px ${alpha(item.accent, 0.6)}`,
                }}
              />
              {i < TIMELINE.length - 1 && <div className="traj-v-line" />}
            </div>
            <div className="traj-card" style={{ minHeight: 0 }}>
              <div className="traj-year" style={{ color: item.accent }}>
                {item.year}
              </div>
              <div className="traj-title">{item.title}</div>
              <div className="traj-detail">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
