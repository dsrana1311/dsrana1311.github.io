import { useEffect, useRef, useState } from 'react'
import { createOpticsEngine } from '../lib/optics.js'

// The player's inventory. Each chip is dragged from the tray onto
// the board; once placed, the tool is manipulated on the canvas.
const PALETTE = [
  { type: 'convex', title: 'Convex lens — converges the beam', glyph: 'convex' },
  { type: 'concave', title: 'Concave lens — diverges the beam', glyph: 'concave' },
  { type: 'mirror', title: 'Flat mirror — angle in = angle out', glyph: 'mirror' },
  { type: 'mirrorConcave', title: 'Concave mirror — focuses reflection', glyph: 'mirrorConcave' },
  { type: 'mirrorConvex', title: 'Convex mirror — spreads reflection', glyph: 'mirrorConvex' },
  { type: 'prism', title: 'Glass prism — splits light into a spectrum', glyph: 'prism' },
]

// Tiny inline SVG so each palette chip previews its optic.
function Glyph({ kind }) {
  const s = { width: 26, height: 26, viewBox: '0 0 26 26', fill: 'none' }
  const stroke = 'currentColor'
  if (kind === 'convex')
    return (
      <svg {...s}>
        <path d="M10 4 Q16 13 10 22 Q4 13 10 4 Z" stroke={stroke} strokeWidth="1.4" />
        <line x1="3" y1="13" x2="17" y2="13" stroke={stroke} strokeWidth="1" opacity="0.5" />
      </svg>
    )
  if (kind === 'concave')
    return (
      <svg {...s}>
        <path d="M8 4 Q13 13 8 22 M16 4 Q11 13 16 22" stroke={stroke} strokeWidth="1.4" />
        <path d="M8 4 L16 4 M8 22 L16 22" stroke={stroke} strokeWidth="1.4" />
      </svg>
    )
  if (kind === 'mirror')
    return (
      <svg {...s}>
        <line x1="7" y1="4" x2="19" y2="22" stroke={stroke} strokeWidth="2" />
        <line x1="9" y1="6" x2="6" y2="9" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="13" y1="12" x2="10" y2="15" stroke={stroke} strokeWidth="1" opacity="0.6" />
      </svg>
    )
  if (kind === 'mirrorConcave')
    return (
      <svg {...s}>
        {/* dish opening to the right (reflective/concave face) */}
        <path d="M16 4 Q8 13 16 22" stroke={stroke} strokeWidth="2" fill="none" />
        <line x1="16" y1="4" x2="19" y2="3" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="11.7" y1="13" x2="8.7" y2="13" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="16" y1="22" x2="19" y2="23" stroke={stroke} strokeWidth="1" opacity="0.6" />
      </svg>
    )
  if (kind === 'mirrorConvex')
    return (
      <svg {...s}>
        {/* dome bulging to the right (reflective/convex face) */}
        <path d="M10 4 Q18 13 10 22" stroke={stroke} strokeWidth="2" fill="none" />
        <line x1="10" y1="4" x2="7" y2="3" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="14.3" y1="13" x2="17.3" y2="13" stroke={stroke} strokeWidth="1" opacity="0.6" />
        <line x1="10" y1="22" x2="7" y2="23" stroke={stroke} strokeWidth="1" opacity="0.6" />
      </svg>
    )
  return (
    <svg {...s}>
      <path d="M13 4 L21 20 L5 20 Z" stroke={stroke} strokeWidth="1.4" />
    </svg>
  )
}

// A compact, illustrated explainer for Snell's law that appears once the
// beam lands on target. Instead of just printing the formula, it shows a
// live little diagram: a ray crossing from air into glass, bending toward
// the normal, with the two angles and refractive indices labelled — plus a
// one-line intuition. Slower medium ⇒ steeper bend.
function SnellCard({ onClose }) {
  // geometry of the mini diagram (SVG viewBox 0..160 x 0..120)
  const cx = 80, iy = 60           // interface crossing point
  const thetaI = 42 * Math.PI / 180  // incidence angle from the normal
  const n1 = 1.0, n2 = 1.5
  // Snell: n1 sinθ1 = n2 sinθ2  →  θ2 = asin(n1/n2 · sinθ1)
  const thetaT = Math.asin((n1 / n2) * Math.sin(thetaI))
  const L = 52
  // incoming ray (upper-left → crossing), measured from the vertical normal
  const inX = cx - Math.sin(thetaI) * L
  const inY = iy - Math.cos(thetaI) * L
  // refracted ray (crossing → lower-right), bent toward the normal
  const outX = cx + Math.sin(thetaT) * L
  const outY = iy + Math.cos(thetaT) * L

  return (
    <div className="snell-card" role="dialog" aria-label="Snell's law explainer">
      <button className="snell-close" onClick={onClose} aria-label="Dismiss">×</button>
      <div className="snell-head">
        <span className="snell-kicker">◎ TARGET ACQUIRED</span>
        <span className="snell-title">Why the beam bends — Snell's Law</span>
      </div>

      <div className="snell-body">
        <svg className="snell-diagram" viewBox="0 0 160 120" aria-hidden="true">
          {/* two media */}
          <rect x="0" y="0" width="160" height={iy} className="snell-air" />
          <rect x="0" y={iy} width="160" height={120 - iy} className="snell-glass" />
          <text x="8" y="16" className="snell-medium">air · n₁ = 1.00</text>
          <text x="8" y={iy + 18} className="snell-medium">glass · n₂ = 1.50</text>
          {/* interface + normal */}
          <line x1="0" y1={iy} x2="160" y2={iy} className="snell-interface" />
          <line x1={cx} y1={iy - 46} x2={cx} y2={iy + 46} className="snell-normal" />
          {/* angle arcs */}
          <path
            d={describeArc(cx, iy, 20, -90, -90 + thetaI * 180 / Math.PI)}
            className="snell-arc"
          />
          <path
            d={describeArc(cx, iy, 20, 90 - thetaT * 180 / Math.PI, 90)}
            className="snell-arc"
          />
          <text x={cx - 30} y={iy - 22} className="snell-angle">θ₁</text>
          <text x={cx + 20} y={iy + 30} className="snell-angle">θ₂</text>
          {/* the ray */}
          <line x1={inX} y1={inY} x2={cx} y2={iy} className="snell-ray-in" />
          <line x1={cx} y1={iy} x2={outX} y2={outY} className="snell-ray-out" />
          <circle cx={cx} cy={iy} r="2.4" className="snell-node" />
        </svg>

        <div className="snell-explain">
          <div className="snell-eq">
            n₁&nbsp;sin&nbsp;θ₁ = n₂&nbsp;sin&nbsp;θ₂
          </div>
          <p>
            Light slows in denser glass, so its wavefronts pile up and the ray
            pivots <em>toward the normal</em>. The bigger the jump in refractive
            index n, the sharper the bend — that's how a lens steers a beam.
          </p>
          <div className="snell-readout">
            θ₁ = {Math.round(thetaI * 180 / Math.PI)}° &nbsp;→&nbsp; θ₂ ={' '}
            {Math.round(thetaT * 180 / Math.PI)}°
          </div>
        </div>
      </div>
    </div>
  )
}

// SVG arc-path helper (polar → cartesian sweep) for the angle markers.
function describeArc(cx, cy, r, startDeg, endDeg) {
  const p = (deg) => {
    const a = (deg - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }
  const s = p(startDeg), e = p(endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

export default function LaserLab() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const engineRef = useRef(null)
  const drag = useRef({ mode: null, id: -1 })
  const [stats, setStats] = useState({ count: 0, solved: false })
  const [selected, setSelected] = useState(-1)   // tool whose index slider shows
  const [indexVal, setIndexVal] = useState(1.5)
  const [ghost, setGhost] = useState(null)       // {type} while dragging from palette
  const [snellDismissed, setSnellDismissed] = useState(false)
  const wasSolved = useRef(false)

  useEffect(() => {
    const engine = createOpticsEngine(canvasRef.current, { onChange: setStats })
    engineRef.current = engine
    return () => engine.destroy()
  }, [])

  // Reset the explainer's dismissed flag on each fresh solve so it reappears
  // when the player lands a new target (but stays hidden if they dismissed it
  // and the beam is still on target).
  useEffect(() => {
    if (stats.solved && !wasSolved.current) setSnellDismissed(false)
    wasSolved.current = stats.solved
  }, [stats.solved])

  const coords = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // ---------- placing from the palette (HTML5 drag) ----------
  const onChipDragStart = (type) => (e) => {
    e.dataTransfer.setData('text/optic', type)
    e.dataTransfer.effectAllowed = 'copy'
    setGhost({ type })
  }
  const onChipDragEnd = () => setGhost(null)

  const onBoardDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }
  const onBoardDrop = (e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('text/optic')
    if (!type) return
    const { x, y } = coords(e)
    const id = engineRef.current.addTool(type, x, y)
    setGhost(null)
    selectTool(id)
  }

  const selectTool = (id) => {
    setSelected(id)
    const t = engineRef.current?.getTool(id)
    if (t && t.n != null) setIndexVal(t.n)
    engineRef.current?.setHover(id)
  }

  // ---------- in-canvas interaction ----------
  const onPointerDown = (e) => {
    const engine = engineRef.current
    if (!engine) return
    canvasRef.current.setPointerCapture(e.pointerId)
    const { x, y } = coords(e)

    // rotate handle of the selected tool takes priority
    const handleId = engine.pickHandle(x, y)
    if (handleId >= 0) {
      drag.current = { mode: 'rotate', id: handleId }
      selectTool(handleId)
      return
    }
    // laser emitter is draggable vertically
    if (engine.sourceHitTest(x, y)) {
      drag.current = { mode: 'source', id: -1 }
      return
    }
    const id = engine.pickTool(x, y)
    if (id >= 0) {
      drag.current = { mode: 'move', id }
      selectTool(id)
    } else {
      drag.current = { mode: null, id: -1 }
      selectTool(-1)
    }
  }

  const onPointerMove = (e) => {
    const engine = engineRef.current
    if (!engine) return
    const { x, y } = coords(e)
    const d = drag.current
    if (d.mode === 'move') engine.moveTool(d.id, x, y)
    else if (d.mode === 'rotate') engine.angleTo(d.id, x, y)
    else if (d.mode === 'source') engine.moveSource(y)
    else {
      // hover highlight
      const id = engine.pickTool(x, y)
      engine.setHover(id >= 0 ? id : selected)
      canvasRef.current.style.cursor = id >= 0 || engine.sourceHitTest(x, y) ? 'grab' : 'crosshair'
    }
  }

  const onPointerUp = () => {
    drag.current = { mode: null, id: -1 }
  }

  const onDoubleClick = (e) => {
    const engine = engineRef.current
    const { x, y } = coords(e)
    const id = engine.pickTool(x, y)
    if (id >= 0) {
      engine.removeTool(id)
      if (selected === id) setSelected(-1)
    }
  }

  const onIndexChange = (e) => {
    const v = parseFloat(e.target.value)
    setIndexVal(v)
    engineRef.current?.setIndex(selected, v)
  }

  const selTool = engineRef.current?.getTool?.(selected)
  const showSlider = selTool && selTool.n != null

  return (
    <div className="laser-lab">
      {/* palette / inventory tray */}
      <div className="laser-palette">
        <span className="laser-palette-label">INVENTORY</span>
        {PALETTE.map((p) => (
          <button
            key={p.type}
            className={`optic-chip${ghost?.type === p.type ? ' dragging' : ''}`}
            draggable
            onDragStart={onChipDragStart(p.type)}
            onDragEnd={onChipDragEnd}
            title={p.title}
            aria-label={p.title}
          >
            <Glyph kind={p.glyph} />
          </button>
        ))}
      </div>

      {/* board */}
      <div className="laser-board-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="laser-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          onDragOver={onBoardDragOver}
          onDrop={onBoardDrop}
          aria-label="Laser optics puzzle board"
        />
        <div className="laser-hud">
          <div className="laser-hud-line">
            <span className="laser-dot" />
            {stats.solved ? 'TARGET ACQUIRED' : 'DRAG OPTICS FROM THE TRAY · BEND THE BEAM TO THE TARGET'}
          </div>
          <div className="laser-hud-sub">
            DRAG BODY: MOVE · DRAG HANDLE: ROTATE · 2×CLICK: REMOVE
          </div>
        </div>
        {stats.solved && snellDismissed && (
          <div className="laser-solved-badge">
            <span>◎ BEAM ON TARGET</span>
            <span className="laser-solved-law">n₁ sin θ₁ = n₂ sin θ₂</span>
          </div>
        )}
        {stats.solved && !snellDismissed && (
          <SnellCard onClose={() => setSnellDismissed(true)} />
        )}
      </div>

      {/* controls */}
      <div className="laser-controls">
        <button className="tool-btn laser-new" onClick={() => engineRef.current?.newTarget()}>
          ⟳ NEW TARGET
        </button>
        <button className="tool-btn" onClick={() => { engineRef.current?.clearTools(); setSelected(-1) }}>
          CLEAR OPTICS
        </button>
        <span className="laser-controls-spacer" />
        {showSlider ? (
          <label className="laser-index">
            <span>REFRACTIVE INDEX n</span>
            <input
              type="range" min="1" max="2.4" step="0.01"
              value={indexVal} onChange={onIndexChange}
            />
            <span className="laser-index-val">{indexVal.toFixed(2)}</span>
          </label>
        ) : (
          <span className="laser-index-empty">SELECT A LENS OR PRISM TO TUNE ITS INDEX</span>
        )}
      </div>
    </div>
  )
}
