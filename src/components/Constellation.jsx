import { NODES } from '../content.js'

// Node positions in the constellation (percent of the constellation area)
const POS = {
  educator: { x: 26, y: 22, drift: 'drift-a 8s ease-in-out infinite' },
  communicator: { x: 74, y: 26, drift: 'drift-b 9s ease-in-out infinite' },
  builder: { x: 24, y: 76, drift: 'drift-c 8.5s ease-in-out infinite' },
  engineer: { x: 76, y: 72, drift: 'drift-d 9.5s ease-in-out infinite' },
}

const alpha = (hex, a) =>
  hex + Math.round(a * 255).toString(16).padStart(2, '0')

function Node({ node, active, onOpen }) {
  const p = POS[node.id]
  return (
    <div
      className={`node-wrap${active ? ' active' : ''}`}
      style={{ left: `${p.x}%`, top: `${p.y}%` }}
    >
      <button
        className="node-drift"
        style={{ animation: p.drift }}
        onClick={() => onOpen(node.id)}
        aria-label={`Open ${node.label}`}
      >
        <div className="node-hit">
          <div
            className="node-dot"
            style={{
              border: `1.5px solid ${node.accent}`,
              background: active ? node.accent : alpha(node.accent, 0.12),
              boxShadow: `0 0 18px 2px ${alpha(node.accent, 0.35)}`,
              '--pulse-strong': alpha(node.accent, 0.35),
              '--pulse-stronger': alpha(node.accent, 0.55),
            }}
          />
        </div>
        <div className="node-label" style={{ color: node.accent }}>
          {node.label}
        </div>
        <div className="node-punchline">{node.hoverLine}</div>
      </button>
    </div>
  )
}

export default function Constellation({ activeId, onOpen }) {
  const nodes = Object.values(NODES)
  return (
    <>
      {/* desktop: the graph */}
      <div className={`constellation${activeId ? ' dimmed' : ''}`}>
        <svg className="edges" aria-hidden="true">
          {nodes.map((n) => (
            <line
              key={n.id}
              x1="50%"
              y1="50%"
              x2={`${POS[n.id].x}%`}
              y2={`${POS[n.id].y}%`}
            />
          ))}
          <line
            x1={`${POS.educator.x}%`}
            y1={`${POS.educator.y}%`}
            x2={`${POS.builder.x}%`}
            y2={`${POS.builder.y}%`}
            style={{ stroke: 'rgba(138,148,166,0.1)', animation: 'none', strokeDasharray: '2 6' }}
          />
          <line
            x1={`${POS.communicator.x}%`}
            y1={`${POS.communicator.y}%`}
            x2={`${POS.engineer.x}%`}
            y2={`${POS.engineer.y}%`}
            style={{ stroke: 'rgba(138,148,166,0.1)', animation: 'none', strokeDasharray: '2 6' }}
          />
        </svg>

        <div className="node-center" aria-hidden="true">
          <div className="dr-badge">DR</div>
        </div>

        {nodes.map((n) => (
          <Node key={n.id} node={n} active={activeId === n.id} onOpen={onOpen} />
        ))}
      </div>

      {/* mobile: the journey */}
      <div className="node-cards">
        {nodes.map((n) => (
          <button key={n.id} className="node-card" onClick={() => onOpen(n.id)}>
            <div
              className="node-dot"
              style={{
                border: `1.5px solid ${n.accent}`,
                background: alpha(n.accent, 0.12),
                boxShadow: `0 0 14px 1px ${alpha(n.accent, 0.3)}`,
              }}
            />
            <span className="node-card-text">
              <span className="node-card-label" style={{ color: n.accent }}>
                {n.label}
              </span>
              <span className="node-card-line">{n.hoverLine}</span>
            </span>
            <span className="node-card-arrow">→</span>
          </button>
        ))}
      </div>
    </>
  )
}
