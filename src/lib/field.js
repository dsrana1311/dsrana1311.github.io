// ============================================================
//  Vector field engine — powers the ambient hero background
//  and the interactive playground. Pure canvas, no deps.
//
//  The field is a superposition of a gentle base flow and
//  point elements: vortices (curl) and sources/sinks (div).
// ============================================================

const SOFTEN = 900        // r² softening so velocity stays finite at element centers
const STRENGTH = 14000    // global scale for element strength
const MAX_SPEED = 260     // px/s clamp
const MAX_ELEMENTS = 14

export function createFieldEngine(canvas, opts = {}) {
  const ambient = !!opts.ambient
  const onChange = opts.onChange || null
  const ctx = canvas.getContext('2d')

  let w = 0
  let h = 0
  let dpr = 1
  let elements = []
  let particles = []
  let showArrows = false
  let raf = 0
  let last = performance.now()
  let t = 0
  let destroyed = false
  let running = true

  const FADE = ambient ? 0.05 : 0.09

  // ---------- presets ----------
  function presetElements() {
    if (ambient) {
      return [
        { type: 'vortex', s: 1.1, fx: 0.28, fy: 0.62 },
        { type: 'vortex', s: -0.9, fx: 0.72, fy: 0.3 },
        { type: 'source', s: 0.5, fx: 0.5, fy: 1.05 },
      ].map(materialize)
    }
    return [
      { type: 'vortex', s: 1.2, fx: 0.32, fy: 0.52 },
      { type: 'vortex', s: -1.0, fx: 0.68, fy: 0.44 },
    ].map(materialize)
  }

  function materialize(e) {
    return { type: e.type, s: e.s, x: e.fx * (w || 800), y: e.fy * (h || 400) }
  }

  // ---------- field math ----------
  function velocity(x, y, out) {
    let vx, vy
    if (ambient) {
      vx = 14 + 10 * Math.sin(y * 0.006 + t * 0.15)
      vy = 7 * Math.sin(x * 0.005 - t * 0.12)
    } else {
      vx = 8
      vy = 0
    }
    for (let i = 0; i < elements.length; i++) {
      const e = elements[i]
      const dx = x - e.x
      const dy = y - e.y
      const k = (e.s * STRENGTH) / (dx * dx + dy * dy + SOFTEN)
      if (e.type === 'vortex') {
        vx += -dy * k
        vy += dx * k
      } else {
        vx += dx * k
        vy += dy * k
      }
    }
    const sp = Math.hypot(vx, vy)
    if (sp > MAX_SPEED) {
      const f = MAX_SPEED / sp
      vx *= f
      vy *= f
    }
    out.vx = vx
    out.vy = vy
    return out
  }

  // ---------- particles ----------
  function spawn(p) {
    p.x = Math.random() * w
    p.y = Math.random() * h
    p.life = 4 + Math.random() * 6
    return p
  }

  function seedParticles() {
    const target = ambient
      ? Math.max(200, Math.min(650, Math.floor((w * h) / 4500)))
      : Math.max(300, Math.min(750, Math.floor((w * h) / 2600)))
    particles = []
    for (let i = 0; i < target; i++) particles.push(spawn({}))
  }

  // ---------- drawing ----------
  const v = { vx: 0, vy: 0 }

  function drawArrows() {
    const step = 46
    ctx.strokeStyle = 'rgba(88, 196, 221, 0.16)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let gx = step / 2; gx < w; gx += step) {
      for (let gy = step / 2; gy < h; gy += step) {
        velocity(gx, gy, v)
        const sp = Math.hypot(v.vx, v.vy) || 1
        const len = Math.min(15, 4 + sp * 0.055)
        const ux = (v.vx / sp) * len
        const uy = (v.vy / sp) * len
        ctx.moveTo(gx - ux / 2, gy - uy / 2)
        ctx.lineTo(gx + ux / 2, gy + uy / 2)
        // arrowhead tick
        const hx = gx + ux / 2
        const hy = gy + uy / 2
        ctx.moveTo(hx, hy)
        ctx.lineTo(hx - ux * 0.32 - uy * 0.22, hy - uy * 0.32 + ux * 0.22)
      }
    }
    ctx.stroke()
  }

  const GLYPH_COLOR = { vortex: '#58C4DD', source: '#FFC857', sink: '#FC6255' }

  function drawElements() {
    if (ambient) return
    ctx.save()
    ctx.font = '600 11px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const e of elements) {
      const color = GLYPH_COLOR[e.type]
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(e.x, e.y, 9, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.fillStyle = color
      const glyph = e.type === 'vortex' ? (e.s > 0 ? '↻' : '↺') : e.type === 'source' ? '+' : '−'
      ctx.fillText(glyph, e.x, e.y + 0.5)
    }
    ctx.restore()
  }

  function frame(now) {
    if (destroyed) return
    raf = requestAnimationFrame(frame)
    if (!running || w === 0 || h === 0) {
      last = now
      return
    }
    let dt = (now - last) / 1000
    last = now
    if (dt > 0.05) dt = 0.05
    t += dt

    ctx.fillStyle = `rgba(11, 14, 20, ${FADE})`
    ctx.fillRect(0, 0, w, h)

    if (showArrows) drawArrows()

    ctx.lineWidth = 1
    ctx.beginPath()
    let strokes = null
    // ambient: single low-alpha pass; playground: brightness follows speed (two buckets)
    if (ambient) {
      ctx.strokeStyle = 'rgba(88, 196, 221, 0.26)'
    }
    const slow = []
    for (const p of particles) {
      velocity(p.x, p.y, v)
      const nx = p.x + v.vx * dt
      const ny = p.y + v.vy * dt
      p.life -= dt
      const out = nx < -24 || nx > w + 24 || ny < -24 || ny > h + 24
      if (out || p.life <= 0) {
        spawn(p)
        continue
      }
      if (ambient) {
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(nx, ny)
      } else {
        const sp = Math.hypot(v.vx, v.vy)
        if (sp > 70) {
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(nx, ny)
        } else {
          slow.push(p.x, p.y, nx, ny)
        }
      }
      p.x = nx
      p.y = ny
    }
    if (ambient) {
      ctx.stroke()
    } else {
      ctx.strokeStyle = 'rgba(88, 196, 221, 0.72)'
      ctx.stroke()
      ctx.beginPath()
      for (let i = 0; i < slow.length; i += 4) {
        ctx.moveTo(slow[i], slow[i + 1])
        ctx.lineTo(slow[i + 2], slow[i + 3])
      }
      ctx.strokeStyle = 'rgba(88, 196, 221, 0.3)'
      ctx.stroke()
    }

    drawElements()
  }

  // ---------- sizing ----------
  function resize() {
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (cw === 0 || ch === 0) return
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    const firstSize = w === 0
    // keep elements at their fractional positions across resizes
    const fracs = elements.map((e) => ({ ...e, fx: w ? e.x / w : 0.5, fy: h ? e.y / h : 0.5 }))
    w = cw
    h = ch
    canvas.width = Math.round(cw * dpr)
    canvas.height = Math.round(ch * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#0B0E14'
    ctx.fillRect(0, 0, w, h)
    if (firstSize) {
      elements = presetElements()
      seedParticles()
    } else {
      elements = fracs.map((e) => ({ type: e.type, s: e.s, x: e.fx * w, y: e.fy * h }))
      seedParticles()
    }
    emit()
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()
  raf = requestAnimationFrame(frame)

  function onVis() {
    running = document.visibilityState === 'visible'
  }
  document.addEventListener('visibilitychange', onVis)

  // ---------- stats / change notifications ----------
  function getStats() {
    let gamma = 0
    let flux = 0
    for (const e of elements) {
      if (e.type === 'vortex') gamma += e.s
      else flux += e.s
    }
    return { count: elements.length, gamma, flux }
  }

  function emit() {
    if (onChange) onChange(getStats())
  }

  // ---------- public API ----------
  return {
    addElement(type, x, y) {
      const s = type === 'vortexCCW' ? -1.15 : type === 'sink' ? -0.9 : type === 'source' ? 0.9 : 1.15
      const kind = type === 'vortex' || type === 'vortexCCW' ? 'vortex' : type
      if (elements.length >= MAX_ELEMENTS) elements.shift()
      elements.push({ type: kind === 'source' && s < 0 ? 'sink' : kind, s, x, y })
      emit()
      return elements.length - 1
    },
    hitTest(x, y) {
      for (let i = elements.length - 1; i >= 0; i--) {
        if (Math.hypot(x - elements[i].x, y - elements[i].y) < 18) return i
      }
      return -1
    },
    moveElement(i, x, y) {
      if (elements[i]) {
        elements[i].x = x
        elements[i].y = y
      }
    },
    removeAt(x, y) {
      const i = this.hitTest(x, y)
      if (i >= 0) {
        elements.splice(i, 1)
        emit()
        return true
      }
      return false
    },
    reset() {
      elements = presetElements()
      emit()
    },
    setArrows(on) {
      showArrows = on
    },
    getStats,
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    },
  }
}
