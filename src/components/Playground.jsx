import { useEffect, useRef, useState } from 'react'
import { createFieldEngine } from '../lib/field.js'

const TOOLS = [
  { id: 'vortex', label: 'VORTEX ↻', cls: 'vortex' },
  { id: 'vortexCCW', label: 'VORTEX ↺', cls: 'vortex' },
  { id: 'source', label: 'SOURCE +', cls: 'source' },
  { id: 'sink', label: 'SINK −', cls: 'sink' },
]

const fmt = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`

/**
 * The proof-of-skill centerpiece: an interactive vector field.
 * Click to place vortices / sources / sinks, drag to move them,
 * double-click to remove — and watch the flow rearrange itself.
 */
export default function Playground() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const dragRef = useRef(-1)
  const [tool, setTool] = useState('vortex')
  const toolRef = useRef(tool)
  toolRef.current = tool
  const [arrows, setArrows] = useState(false)
  const [stats, setStats] = useState({ count: 0, gamma: 0, flux: 0 })

  useEffect(() => {
    const engine = createFieldEngine(canvasRef.current, {
      ambient: false,
      onChange: setStats,
    })
    engineRef.current = engine
    return () => engine.destroy()
  }, [])

  const coords = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e) => {
    const engine = engineRef.current
    if (!engine) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = coords(e)
    const hit = engine.hitTest(x, y)
    dragRef.current = hit >= 0 ? hit : engine.addElement(toolRef.current, x, y)
  }

  const onPointerMove = (e) => {
    if (dragRef.current < 0) return
    const { x, y } = coords(e)
    engineRef.current?.moveElement(dragRef.current, x, y)
  }

  const onPointerUp = () => {
    dragRef.current = -1
  }

  const onDoubleClick = (e) => {
    const { x, y } = coords(e)
    engineRef.current?.removeAt(x, y)
  }

  const toggleArrows = () => {
    const next = !arrows
    setArrows(next)
    engineRef.current?.setArrows(next)
  }

  return (
    <div className="playground">
      <div className="playground-canvas-wrap">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          aria-label="Interactive vector field playground"
        />
        <div className="playground-hud">
          <div>
            ELEMENTS {stats.count}/14 · Γ = {fmt(stats.gamma)} · FLUX = {fmt(stats.flux)}
          </div>
          <div>CLICK: PLACE · DRAG: MOVE · 2×CLICK: REMOVE</div>
        </div>
      </div>
      <div className="playground-toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tool-btn ${t.cls}${tool === t.id ? ' on' : ''}`}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className={`tool-btn${arrows ? ' on' : ''}`} onClick={toggleArrows}>
          ARROWS
        </button>
        <button className="tool-btn" onClick={() => engineRef.current?.reset()}>
          RESET
        </button>
      </div>
    </div>
  )
}
