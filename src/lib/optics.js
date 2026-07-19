// ============================================================
//  Geometric-optics engine — powers the "Laser Logic" lab.
//
//  A laser fires from the left. The player drops lenses,
//  mirrors and prisms on the board; the beam is ray-marched
//  through them, refracting by Snell's law (n1 sinθ1 = n2 sinθ2)
//  at every glass surface, reflecting off mirrors, and — for
//  prisms — dispersing into a spectrum via Cauchy's relation.
//  Goal: bend the light around obstacles onto the target.
//
//  Pure canvas, no deps. Same spirit as lib/field.js.
// ============================================================

const EPS = 1e-4          // nudge past a surface after a hit
const MAX_BOUNCES = 60    // ray-march step budget per beam
const N_AIR = 1.0

// Wavelengths (nm) sampled across the visible band. A single
// "white" laser is traced once per wavelength so a prism fans
// it into a real rainbow; a monochrome beam uses just its own.
const SPECTRUM = [
  { nm: 660, color: '#ff4d4d' }, // red
  { nm: 610, color: '#ff9f45' }, // orange
  { nm: 560, color: '#ffe14d' }, // yellow
  { nm: 510, color: '#83e06a' }, // green
  { nm: 470, color: '#4db8ff' }, // blue
  { nm: 430, color: '#9d7dff' }, // violet
]
const LASER_COLOR = '#ff5064'   // the resting monochrome beam

// ---------- small vector helpers ----------
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })
const mul = (a, s) => ({ x: a.x * s, y: a.y * s })
const dot = (a, b) => a.x * b.x + a.y * b.y
const len = (a) => Math.hypot(a.x, a.y)
const norm = (a) => {
  const l = len(a) || 1
  return { x: a.x / l, y: a.y / l }
}
const rot = (a, ang) => {
  const c = Math.cos(ang), s = Math.sin(ang)
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c }
}

// Cauchy dispersion: index rises slightly toward the blue end,
// which is what actually splits white light in a prism.
// n(λ) = base + B / λ²  (λ in µm). Lenses keep it near-flat.
function indexAt(el, nm) {
  if (el.type !== 'prism') return el.n
  const um = nm / 1000
  // Coefficient tuned so red→violet spread ≈ 0.02 (crown-glass scale):
  // visibly fans the beam without behaving unlike real glass.
  return el.n + 0.007 / (um * um) - 0.007 / (0.589 * 0.589)
}

// ---------- geometry builders (local → world) ----------
// Each optic exposes surfaces the ray-marcher understands:
//   { kind:'arc',  c, r, a0, a1, glassInside, n }  (lens face)
//   { kind:'seg',  a, b, reflect|glass, n }         (mirror/prism edge/wall)
// glassInside flags which side of the surface is the denser medium.

// A lens has two spherical faces. `el.angle` is the OPTICAL AXIS: light
// travelling along it passes straight through the center. `H` is the
// aperture half-height (perpendicular to the axis); `bulge` is how far
// each face curves from the rim plane (+convex bulges out, −concave
// scoops in). The collision arcs and the drawing derive from the same
// axis/perp frame (see drawLensBody for how the concave silhouette
// deliberately differs from its collision arcs).
function lensGeom(el) {
  const axis = { x: Math.cos(el.angle), y: Math.sin(el.angle) } // optical axis
  const perp = { x: -axis.y, y: axis.x }                        // along the rim
  const H = el.h
  const bulge = Math.abs(el.bulge)
  const R = (H * H + bulge * bulge) / (2 * bulge)               // sphere radius
  return { axis, perp, H, bulge, R }
}

function lensSurfaces(el) {
  const { axis, R, bulge } = lensGeom(el)
  const c = { x: el.x, y: el.y }
  // Each face is a sphere through the rim chord (at alongAxis=0) with its
  // apex at alongAxis = ±bulge. The center of curvature sits a distance
  // (R − bulge) from the chord plane, on the side OPPOSITE the apex.
  const d = R - bulge
  if (el.convex) {
    // Convex: apexes poke OUT (+axis apex at +bulge, −axis apex at −bulge).
    // Centers therefore sit on the inner side (toward the lens center).
    const cPos = { x: c.x - axis.x * d, y: c.y - axis.y * d } // +axis face
    const cNeg = { x: c.x + axis.x * d, y: c.y + axis.y * d } // −axis face
    return [
      { c: cPos, r: R, side: +1, el },
      { c: cNeg, r: R, side: -1, el },
    ]
  }
  // Concave: apexes scoop IN (+axis apex at −bulge, −axis apex at +bulge).
  // Centers sit on the outer side (away from the lens center).
  const cPos = { x: c.x + axis.x * d, y: c.y + axis.y * d } // +axis face
  const cNeg = { x: c.x - axis.x * d, y: c.y - axis.y * d } // −axis face
  return [
    { c: cPos, r: R, side: +1, el },
    { c: cNeg, r: R, side: -1, el },
  ]
}

function prismCorners(el) {
  // Equilateral triangle, "point up" along the local axis.
  const s = el.size
  const R = s / Math.sqrt(3)
  const pts = [0, 1, 2].map((i) => {
    const a = el.angle - Math.PI / 2 + (i * 2 * Math.PI) / 3
    return { x: el.x + R * Math.cos(a), y: el.y + R * Math.sin(a) }
  })
  return pts
}

function mirrorEnds(el) {
  const axis = { x: Math.cos(el.angle), y: Math.sin(el.angle) }
  return [
    { x: el.x - axis.x * el.h, y: el.y - axis.y * el.h },
    { x: el.x + axis.x * el.h, y: el.y + axis.y * el.h },
  ]
}

// Spherical mirror. `el.angle` = the way the reflective face POINTS (toward
// the light). The vertex (surface center) is at el.x,el.y. `dish` = +1
// concave / −1 convex; `curve` = sagitta (depth), `h` = aperture half-height.
//   concave: center of curvature is in FRONT (light side) → focuses.
//   convex : center of curvature is BEHIND → diverges.
function curvedMirrorGeom(el) {
  const H = el.h
  const sag = Math.max(2, el.curve)
  const R = (H * H + sag * sag) / (2 * sag)     // radius from sagitta
  const face = { x: Math.cos(el.angle), y: Math.sin(el.angle) } // outward normal at vertex
  const perp = { x: -face.y, y: face.x }        // aperture spreads along here
  const vertex = { x: el.x, y: el.y }
  // center of curvature: +face for concave, −face for convex
  const c = { x: vertex.x + face.x * R * el.dish, y: vertex.y + face.y * R * el.dish }
  return { c, R, H, face, perp, vertex, sag }
}

// ---------- ray ∩ primitives ----------
function raySeg(o, d, a, b) {
  // Returns t along ray for hit with segment a→b, or Infinity.
  const e = sub(b, a)
  const denom = d.x * e.y - d.y * e.x
  if (Math.abs(denom) < 1e-9) return Infinity
  const diff = sub(a, o)
  const t = (diff.x * e.y - diff.y * e.x) / denom
  const u = (diff.x * d.y - diff.y * d.x) / denom
  if (t > EPS && u >= 0 && u <= 1) return t
  return Infinity
}

function rayCircle(o, d, c, r) {
  // Nearest positive t for hit with full circle centered c radius r.
  const oc = sub(o, c)
  const b = dot(oc, d)
  const cc = dot(oc, oc) - r * r
  const disc = b * b - cc
  if (disc < 0) return Infinity
  const sq = Math.sqrt(disc)
  const t1 = -b - sq
  const t2 = -b + sq
  if (t1 > EPS) return t1
  if (t2 > EPS) return t2
  return Infinity
}

// A lens face is the cap of a sphere clipped to the lens body. Accept a
// circle hit only if it lies (1) within ±H of the axis across the aperture,
// (2) within the lens's axial extent (±bulge), and (3) on this face's side.
// This rejects the far side of the (large) scooping/bulging spheres.
function rayLensFace(o, d, face) {
  const { c, r, el, side } = face
  const { axis, perp, H, bulge } = lensGeom(el)
  const center = { x: el.x, y: el.y }
  const oc = sub(o, c)
  const b = dot(oc, d)
  const cc = dot(oc, oc) - r * r
  const disc = b * b - cc
  if (disc < 0) return Infinity
  const sq = Math.sqrt(disc)
  for (const t of [-b - sq, -b + sq]) {
    if (t <= EPS) continue
    const p = add(o, mul(d, t))
    const rel = sub(p, center)
    const alongPerp = dot(rel, perp)
    const alongAxis = dot(rel, axis)
    if (Math.abs(alongPerp) > H + 0.5) continue           // within aperture
    if (Math.abs(alongAxis) > bulge + 1) continue         // within lens thickness
    return t
  }
  return Infinity
}

// Curved mirror: circle hit clipped to the reflective cap only — within
// ±H across the aperture (perp) AND within the sagitta depth along the
// facing normal, so the ray can't catch the far side of the sphere.
function rayCurvedMirror(o, d, el) {
  const { c, R, H, perp, face, vertex, sag } = curvedMirrorGeom(el)
  const oc = sub(o, c)
  const b = dot(oc, d)
  const cc = dot(oc, oc) - R * R
  const disc = b * b - cc
  if (disc < 0) return Infinity
  const sq = Math.sqrt(disc)
  for (const t of [-b - sq, -b + sq]) {
    if (t <= EPS) continue
    const p = add(o, mul(d, t))
    const rel = sub(p, vertex)
    if (Math.abs(dot(rel, perp)) > H + 0.5) continue        // within aperture
    // depth along the facing normal must be within the dish (0..sag,
    // measured on the concave side / behind on convex). Reject far cap.
    const depth = dot(rel, face) * el.dish
    if (depth > 0.5 || depth < -sag - 0.5) continue
    return t
  }
  return Infinity
}

// ---------- Snell refraction / reflection ----------
function reflect(d, n) {
  return sub(d, mul(n, 2 * dot(d, n)))
}

function refract(d, n, n1, n2) {
  // d, n unit vectors; n points against the incoming ray.
  const eta = n1 / n2
  let cosI = -dot(d, n)
  let N = n
  if (cosI < 0) { cosI = -cosI; N = mul(n, -1) }
  const k = 1 - eta * eta * (1 - cosI * cosI)
  if (k < 0) return null // total internal reflection
  return add(mul(d, eta), mul(N, eta * cosI - Math.sqrt(k)))
}

// ============================================================
export function createOpticsEngine(canvas, opts = {}) {
  const ctx = canvas.getContext('2d')
  const onChange = opts.onChange || null

  let w = 0, h = 0, dpr = 1
  let optics = []          // placed tools
  let obstacles = []       // walls to route around
  let target = null        // { x, y, r }
  let source = null        // { x, y, angle }
  let raf = 0, destroyed = false
  let hitPulse = 0         // 0..1 animation when target is lit
  let solved = false
  let idSeq = 1
  let hoverId = -1

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const rand = (a, b) => a + Math.random() * (b - a)

  // ---------- audio: a short "lock-on" chime when the target is hit ----------
  // Lazily created on first use (browsers require a user gesture before audio
  // can start — placing an optic / dragging counts, so by the time a beam
  // lands on target the context is unlocked).
  let audioCtx = null
  function ensureAudio() {
    if (audioCtx) return audioCtx
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try { audioCtx = new AC() } catch { audioCtx = null }
    return audioCtx
  }
  function playChime() {
    const ac = ensureAudio()
    if (!ac) return
    if (ac.state === 'suspended') ac.resume().catch(() => {})
    const now = ac.currentTime
    // A bright three-note arpeggio (major triad) — reads as "success".
    const notes = [660, 880, 1320]
    const master = ac.createGain()
    master.gain.value = 0.0001
    master.connect(ac.destination)
    // gentle overall envelope
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.28, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    notes.forEach((freq, i) => {
      const t0 = now + i * 0.075
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t0)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32)
      osc.connect(g); g.connect(master)
      osc.start(t0)
      osc.stop(t0 + 0.35)
    })
  }

  // ---------- sizing ----------
  // NOTE: defined after clamp/rand because the immediate resize()
  // below (and randomizeTarget it calls) use them — declaring them
  // later would hit the temporal dead zone and throw at construct.
  function resize() {
    const rect = canvas.getBoundingClientRect()
    // Fall back to the CSS/attribute box if the element hasn't been
    // laid out yet (e.g. observer fires a beat before first paint).
    const nw = rect.width || canvas.clientWidth || canvas.offsetWidth || 0
    const nh = rect.height || canvas.clientHeight || canvas.offsetHeight || 0
    if (!nw || !nh) return           // nothing to do until we have a real box
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = nw
    h = nh
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Emitter sits just inside the left edge so the beam is on-screen.
    if (!source) source = { x: 30, y: h * 0.5, angle: 0 }
    else source.y = clamp(source.y, 16, h - 16)
    if (!target) randomizeTarget()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize() // attempt an immediate sizing; draw() also retries until sized

  // ---------- level generation ----------
  function randomizeTarget() {
    if (!w) return
    // Target lives in the right ~40% of the board.
    target = { x: rand(w * 0.62, w * 0.92), y: rand(h * 0.15, h * 0.85), r: 15 }
    // 1–2 walls between the laser and the target so the straight
    // shot is blocked and tools are actually needed.
    obstacles = []
    const nWalls = Math.random() < 0.5 ? 1 : 2
    for (let i = 0; i < nWalls; i++) {
      const wx = rand(w * 0.34, w * 0.6)
      const wy = rand(h * 0.12, h * 0.88)
      const wh = rand(h * 0.16, h * 0.3)
      obstacles.push({ x: wx, y: wy, hw: 7, hh: wh, angle: rand(-0.5, 0.5) })
    }
    // Make sure the laser's straight line is actually interrupted;
    // if not, drop a wall right on the sight line.
    if (!straightLineBlocked()) {
      obstacles.push({
        x: rand(w * 0.4, w * 0.55),
        y: source.y + rand(-20, 20),
        hw: 7, hh: rand(h * 0.14, h * 0.24), angle: rand(-0.4, 0.4),
      })
    }
    solved = false
    hitPulse = 0
    emit()
  }

  function straightLineBlocked() {
    const o = { x: source.x, y: source.y }
    const d = { x: 1, y: 0 }
    let tHit = Infinity
    for (const ob of obstacles) tHit = Math.min(tHit, rayObstacle(o, d, ob).t)
    const tTarget = (target.x - o.x) / d.x
    return tHit < tTarget
  }

  function obstacleSurfaces(ob) {
    // rectangle (rotated) → 4 segments
    const ax = { x: Math.cos(ob.angle), y: Math.sin(ob.angle) }
    const ay = { x: -Math.sin(ob.angle), y: Math.cos(ob.angle) }
    const c = { x: ob.x, y: ob.y }
    const p = (sx, sy) => add(c, add(mul(ax, sx * ob.hw), mul(ay, sy * ob.hh)))
    const a = p(-1, -1), b = p(1, -1), d = p(1, 1), e = p(-1, 1)
    return [[a, b], [b, d], [d, e], [e, a]]
  }
  function rayObstacle(o, d, ob) {
    let t = Infinity
    for (const [a, b] of obstacleSurfaces(ob)) t = Math.min(t, raySeg(o, d, a, b))
    return { t }
  }

  // ---------- tool factory ----------
  // Angle conventions:
  //   lens  → optical axis (0 = horizontal, facing the leftward beam)
  //   flat mirror → the mirror line direction
  //   curved mirror → the way the reflective face points (toward the light)
  function makeTool(type, x, y) {
    const base = { id: idSeq++, type, x, y, angle: 0 }
    if (type === 'convex') return { ...base, convex: true, h: 34, bulge: 15, n: 1.5, angle: 0 }
    if (type === 'concave') return { ...base, convex: false, h: 34, bulge: 12, n: 1.5, angle: 0 }
    if (type === 'mirror') return { ...base, h: 42, angle: Math.PI / 2.6 }
    // Curved mirrors default facing up-left so they deflect (not retro-reflect)
    // a beam arriving from the left. Concave focuses, convex diverges.
    if (type === 'mirrorConcave') return { ...base, h: 38, curve: 18, dish: 1, angle: Math.PI * 0.82 }
    if (type === 'mirrorConvex') return { ...base, h: 38, curve: 18, dish: -1, angle: Math.PI * 0.82 }
    if (type === 'prism') return { ...base, size: 76, n: 1.5, angle: -0.15 }
    return base
  }

  function addTool(type, x, y) {
    const t = makeTool(type, clamp(x, 24, w - 24), clamp(y, 24, h - 24))
    optics.push(t)
    emit()
    return t.id
  }
  function removeTool(id) {
    optics = optics.filter((o) => o.id !== id)
    emit()
  }
  function clearTools() {
    optics = []
    emit()
  }

  // ---------- hit-testing for interaction ----------
  function pickTool(x, y) {
    // topmost first
    for (let i = optics.length - 1; i >= 0; i--) {
      const o = optics[i]
      const r = sub({ x, y }, o)
      const reach = o.type === 'prism' ? o.size * 0.5 : Math.max(o.h, 22)
      if (len(r) <= reach + 8) return o.id
    }
    return -1
  }
  const getTool = (id) => optics.find((o) => o.id === id)
  function moveTool(id, x, y) {
    const o = getTool(id)
    if (!o) return
    o.x = clamp(x, 20, w - 20)
    o.y = clamp(y, 20, h - 20)
    emit()
  }
  function rotateTool(id, delta) {
    const o = getTool(id)
    if (!o) return
    o.angle += delta
    emit()
  }
  function setIndex(id, n) {
    const o = getTool(id)
    if (!o || o.n == null) return
    o.n = clamp(n, 1.0, 2.4)
    emit()
  }
  function setHover(id) { hoverId = id }

  // ---------- the ray march ----------
  // Trace one beam of a given wavelength; returns polyline points
  // and whether it reached the target.
  function traceBeam(o, d, nm) {
    const pts = [{ x: o.x, y: o.y }]
    let origin = { x: o.x, y: o.y }
    let dir = norm(d)
    let reached = false

    for (let bounce = 0; bounce < MAX_BOUNCES; bounce++) {
      let best = { t: Infinity, kind: null, ref: null, extra: null }

      // walls
      for (const ob of obstacles) {
        for (const [a, b] of obstacleSurfaces(ob)) {
          const t = raySeg(origin, dir, a, b)
          if (t < best.t) best = { t, kind: 'wall' }
        }
      }
      // target
      if (target) {
        const t = rayCircle(origin, dir, target, target.r)
        if (t < best.t) best = { t, kind: 'target' }
      }
      // optics
      for (const el of optics) {
        if (el.type === 'mirror') {
          const [a, b] = mirrorEnds(el)
          const t = raySeg(origin, dir, a, b)
          if (t < best.t) best = { t, kind: 'mirror', ref: el, extra: { a, b } }
        } else if (el.type === 'mirrorConcave' || el.type === 'mirrorConvex') {
          const t = rayCurvedMirror(origin, dir, el)
          if (t < best.t) best = { t, kind: 'curvedMirror', ref: el }
        } else if (el.type === 'prism') {
          const c = prismCorners(el)
          for (let i = 0; i < 3; i++) {
            const a = c[i], b = c[(i + 1) % 3]
            const t = raySeg(origin, dir, a, b)
            if (t < best.t) best = { t, kind: 'glass', ref: el, extra: { a, b } }
          }
        } else if (el.type === 'convex' || el.type === 'concave') {
          // lens: two faces
          for (const face of lensSurfaces(el)) {
            const t = rayLensFace(origin, dir, face)
            if (t < best.t) best = { t, kind: 'lens', ref: el, extra: { face } }
          }
        }
      }

      if (best.t === Infinity) {
        // fly off to the board edge
        const tEdge = edgeT(origin, dir)
        pts.push(add(origin, mul(dir, tEdge)))
        break
      }

      const hit = add(origin, mul(dir, best.t))
      pts.push(hit)

      if (best.kind === 'wall') break
      if (best.kind === 'target') { reached = true; break }

      if (best.kind === 'mirror') {
        // A flat mirror is silvered on ONE face only. Its reflective side
        // faces +faceNormal (the hatch is drawn on the opposite/back side).
        // A ray striking the back is absorbed (the beam stops here).
        const { a, b } = best.extra
        const faceNrm = norm({ x: -(b.y - a.y), y: b.x - a.x })
        if (dot(dir, faceNrm) > 0) break        // hit the absorbing back → stop
        dir = norm(reflect(dir, faceNrm))
        origin = add(hit, mul(dir, EPS))
        continue
      }

      if (best.kind === 'curvedMirror') {
        // Silvered on the concave/convex FACE only; the back absorbs.
        // The outward face normal at the vertex points along el.angle; on the
        // arc, the reflective side is the one whose normal opposes the ray.
        const el = best.ref
        const { c } = curvedMirrorGeom(el)
        // Radius direction at the hit point. Orient it to the SILVERED front:
        // the reflective face always looks along el.angle (`outward`), toward
        // the light, for both concave and convex dishes. A ray landing on the
        // matte back (dir agreeing with the front normal) is absorbed.
        let nrm = norm(sub(hit, c))
        const outward = { x: Math.cos(el.angle), y: Math.sin(el.angle) }
        if (dot(nrm, outward) < 0) nrm = mul(nrm, -1)  // face the light side
        if (dot(dir, nrm) > 0) break                    // hit absorbing back → stop
        dir = norm(reflect(dir, nrm))
        origin = add(hit, mul(dir, EPS))
        continue
      }

      if (best.kind === 'glass' || best.kind === 'lens') {
        const el = best.ref
        let nrm
        if (best.kind === 'glass') {
          const { a, b } = best.extra
          nrm = norm({ x: -(b.y - a.y), y: b.x - a.x })
        } else {
          nrm = norm(sub(hit, best.extra.face.c)) // circle normal
        }
        // decide entering vs leaving glass by whether ray goes into
        // the surface (dot < 0 means normal faces the ray)
        let facing = nrm
        if (dot(dir, facing) > 0) facing = mul(facing, -1)
        const entering = pointInsideOptic(add(hit, mul(dir, EPS)), el)
        const nGlass = indexAt(el, nm)
        const n1 = entering ? N_AIR : nGlass
        const n2 = entering ? nGlass : N_AIR
        const refr = refract(dir, facing, n1, n2)
        if (!refr) {
          dir = norm(reflect(dir, facing)) // total internal reflection
        } else {
          dir = norm(refr)
        }
        origin = add(hit, mul(dir, EPS))
        continue
      }
    }
    return { pts, reached }
  }

  function edgeT(o, d) {
    let t = Infinity
    if (d.x > 0) t = Math.min(t, (w - o.x) / d.x)
    if (d.x < 0) t = Math.min(t, (0 - o.x) / d.x)
    if (d.y > 0) t = Math.min(t, (h - o.y) / d.y)
    if (d.y < 0) t = Math.min(t, (0 - o.y) / d.y)
    return Math.max(0, t)
  }

  function pointInsideOptic(p, el) {
    if (el.type === 'prism') return pointInTriangle(p, prismCorners(el))
    // lens: must be within the aperture, then convex = inside BOTH spheres,
    // concave = within the rim slab but OUTSIDE both scooping spheres.
    const { axis, perp, H, bulge } = lensGeom(el)
    const rel = sub(p, { x: el.x, y: el.y })
    if (Math.abs(dot(rel, perp)) > H) return false
    const faces = lensSurfaces(el)
    if (el.convex) {
      return faces.every((f) => len(sub(p, f.c)) <= f.r)
    }
    // concave: inside the flat rim slab (±bulge along axis) but carved by spheres
    if (Math.abs(dot(rel, axis)) > bulge) return false
    return faces.every((f) => len(sub(p, f.c)) >= f.r)
  }
  function pointInTriangle(p, c) {
    const s = (a, b) => (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y)
    const d1 = s(c[0], c[1]), d2 = s(c[1], c[2]), d3 = s(c[2], c[0])
    const neg = d1 < 0 || d2 < 0 || d3 < 0
    const pos = d1 > 0 || d2 > 0 || d3 > 0
    return !(neg && pos)
  }

  // ---------- render ----------
  function draw() {
    // If we haven't been sized yet (canvas mounted inside an animating
    // panel), keep retrying until the element has a real box.
    if (!w || !h) {
      resize()
      if (!w || !h) { raf = requestAnimationFrame(draw); return }
    }
    ctx.clearRect(0, 0, w, h)
    drawGrid()

    // obstacles
    for (const ob of obstacles) drawObstacle(ob)

    // beams — split into spectrum if any prism is present so the
    // dispersion is visible; otherwise a single clean laser line.
    const dispersive = optics.some((o) => o.type === 'prism')
    let anyReached = false
    const start = { x: source.x, y: source.y }
    const dir0 = { x: Math.cos(source.angle), y: Math.sin(source.angle) }
    if (dispersive) {
      for (const band of SPECTRUM) {
        const { pts, reached } = traceBeam(start, dir0, band.nm)
        drawBeam(pts, band.color, 1.4, reached)
        anyReached = anyReached || reached
      }
    } else {
      const { pts, reached } = traceBeam(start, dir0, 560)
      drawBeam(pts, LASER_COLOR, 2, reached)
      anyReached = reached
    }

    // optics on top
    for (const el of optics) drawOptic(el)

    drawSource()
    drawTarget(anyReached)

    if (anyReached && !solved) { solved = true; hitPulse = 1; playChime(); emit() }
    if (!anyReached && solved) { solved = false; emit() }
    if (hitPulse > 0) hitPulse = Math.max(0, hitPulse - 0.012)

    raf = requestAnimationFrame(draw)
  }

  function drawGrid() {
    ctx.save()
    ctx.strokeStyle = 'rgba(138,148,166,0.06)'
    ctx.lineWidth = 1
    const step = 34
    for (let x = step; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    ctx.restore()
  }

  function drawBeam(pts, color, width, reached) {
    if (pts.length < 2) return
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    // soft outer glow
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.18
    ctx.lineWidth = width + 5
    strokePath(pts)
    // core
    ctx.globalAlpha = 0.95
    ctx.lineWidth = width
    strokePath(pts)
    ctx.restore()
  }
  function strokePath(pts) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  }

  function drawObstacle(ob) {
    ctx.save()
    ctx.translate(ob.x, ob.y)
    ctx.rotate(ob.angle)
    ctx.fillStyle = 'rgba(18,24,38,0.95)'
    ctx.strokeStyle = 'rgba(138,148,166,0.5)'
    ctx.lineWidth = 1.5
    roundRect(-ob.hw, -ob.hh, ob.hw * 2, ob.hh * 2, 3)
    ctx.fill(); ctx.stroke()
    // hatch
    ctx.strokeStyle = 'rgba(138,148,166,0.25)'
    ctx.lineWidth = 1
    for (let yy = -ob.hh + 4; yy < ob.hh; yy += 7) {
      ctx.beginPath(); ctx.moveTo(-ob.hw, yy); ctx.lineTo(ob.hw, yy + 4); ctx.stroke()
    }
    ctx.restore()
  }

  function drawSource() {
    ctx.save()
    ctx.translate(source.x, source.y)
    // emitter body
    ctx.fillStyle = '#1a2333'
    ctx.strokeStyle = LASER_COLOR
    ctx.lineWidth = 1.5
    roundRect(-6, -14, 16, 28, 3)
    ctx.fill(); ctx.stroke()
    ctx.fillStyle = LASER_COLOR
    ctx.beginPath(); ctx.arc(10, 0, 3.2, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  function drawTarget(lit) {
    if (!target) return
    ctx.save()
    ctx.translate(target.x, target.y)
    const pulse = hitPulse
    const baseColor = lit ? '#83e06a' : '#58C4DD'
    // lock-on pulse ring
    if (pulse > 0) {
      ctx.strokeStyle = `rgba(131,224,106,${pulse * 0.8})`
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(0, 0, target.r + (1 - pulse) * 26, 0, Math.PI * 2); ctx.stroke()
    }
    // rings
    ctx.strokeStyle = baseColor
    ctx.globalAlpha = lit ? 1 : 0.85
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, 0, target.r, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = lit ? 0.9 : 0.4
    ctx.beginPath(); ctx.arc(0, 0, target.r * 0.55, 0, Math.PI * 2); ctx.stroke()
    // center dot
    ctx.globalAlpha = 1
    ctx.fillStyle = baseColor
    if (lit) { ctx.shadowColor = baseColor; ctx.shadowBlur = 16 }
    ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill()
    // crosshair ticks
    ctx.shadowBlur = 0
    ctx.strokeStyle = baseColor
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 1.5
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * (target.r + 3), Math.sin(a) * (target.r + 3))
      ctx.lineTo(Math.cos(a) * (target.r + 9), Math.sin(a) * (target.r + 9))
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawOptic(el) {
    const active = el.id === hoverId
    const glass = 'rgba(88,196,221,'
    ctx.save()
    if (el.type === 'mirror') {
      const [a, b] = mirrorEnds(el)
      // Reflective face is +faceNormal; the back (−faceNormal) is a matte,
      // absorbing backing drawn with hatch ticks so the silvered side reads.
      const nx = -(b.y - a.y), ny = b.x - a.x
      const nl = Math.hypot(nx, ny) || 1
      const ux = nx / nl, uy = ny / nl
      // matte absorbing backing, offset a hair behind the silvered line
      ctx.strokeStyle = 'rgba(90,98,116,0.9)'
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.moveTo(a.x - ux * 1.5, a.y - uy * 1.5)
      ctx.lineTo(b.x - ux * 1.5, b.y - uy * 1.5)
      ctx.stroke()
      // silvered reflective face
      ctx.strokeStyle = active ? '#E8EDF4' : '#c9d3e0'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      // hatch ticks on the absorbing back
      ctx.strokeStyle = 'rgba(138,148,166,0.55)'
      ctx.lineWidth = 1
      for (let s = 0.08; s < 1; s += 0.12) {
        const px = a.x + (b.x - a.x) * s
        const py = a.y + (b.y - a.y) * s
        ctx.beginPath()
        ctx.moveTo(px - ux * 1.5, py - uy * 1.5)
        ctx.lineTo(px - ux * 6, py - uy * 6)
        ctx.stroke()
      }
    } else if (el.type === 'prism') {
      const c = prismCorners(el)
      ctx.beginPath()
      ctx.moveTo(c[0].x, c[0].y)
      ctx.lineTo(c[1].x, c[1].y)
      ctx.lineTo(c[2].x, c[2].y)
      ctx.closePath()
      const g = ctx.createLinearGradient(c[0].x, c[0].y, c[1].x, c[2].y)
      g.addColorStop(0, glass + '0.14)')
      g.addColorStop(1, glass + '0.05)')
      ctx.fillStyle = g
      ctx.fill()
      ctx.strokeStyle = active ? '#7fdcef' : glass + '0.7)'
      ctx.lineWidth = active ? 2 : 1.5
      ctx.stroke()
    } else if (el.type === 'mirrorConcave' || el.type === 'mirrorConvex') {
      drawCurvedMirror(el, active)
    } else {
      drawLensBody(el, active)
    }
    if (active) drawRotateHandle(el)
    ctx.restore()
  }

  function drawCurvedMirror(el, active) {
    const { c, R, H, vertex } = curvedMirrorGeom(el)
    // angular half-span of the aperture as seen from the center of curvature
    const half = Math.asin(Math.min(1, H / R))
    // direction from center of curvature toward the vertex = middle of the arc
    const toVertex = Math.atan2(vertex.y - c.y, vertex.x - c.x)
    ctx.lineCap = 'round'
    // matte absorbing backing behind the silvered arc (on the back side)
    ctx.strokeStyle = 'rgba(90,98,116,0.9)'
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.arc(c.x, c.y, R + 1.6 * el.dish, toVertex - half, toVertex + half)
    ctx.stroke()
    // silvered reflective face
    ctx.strokeStyle = active ? '#E8EDF4' : '#c9d3e0'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(c.x, c.y, R, toVertex - half, toVertex + half)
    ctx.stroke()
    // hatch ticks on the NON-reflective back (away from the light side)
    ctx.strokeStyle = 'rgba(138,148,166,0.6)'
    ctx.lineWidth = 1
    const ticks = 7
    for (let i = 0; i <= ticks; i++) {
      const a = toVertex - half + (2 * half * i) / ticks
      const px = c.x + Math.cos(a) * R
      const py = c.y + Math.sin(a) * R
      // back = along the radius, away from the center for concave (dish +1),
      // toward the center for convex (dish −1)
      const bx = Math.cos(a) * 6 * el.dish
      const by = Math.sin(a) * 6 * el.dish
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + bx, py + by)
      ctx.stroke()
    }
  }

  function drawLensBody(el, active) {
    // Sample each face as a short polyline of points on a circular arc;
    // walking the +axis face one way and the −axis face back the other
    // closes the lens outline.
    //
    // CONVEX: the outline exactly matches the collision geometry — each
    // face's apex pokes OUT to ±bulge and the faces meet at the rim,
    // giving the classic pointed-oval silhouette.
    //
    // CONCAVE: the refracting arcs model a vanishingly thin biconcave
    // lens, so tracing them literally would render a convex-looking oval.
    // Instead draw the classic biconcave silhouette — a rim slab ±bulge
    // thick (matching the collision slab) whose faces scoop inward to a
    // thin waist. Purely cosmetic; the ray physics is untouched.
    const { axis, perp, H, bulge, R } = lensGeom(el)
    const N = 18
    // walk a face across the aperture; `along(off)` gives its axis coord
    const facePts = (along, dir) => {
      const pts = []
      for (let i = 0; i <= N; i++) {
        const s = (dir > 0 ? i : N - i) / N        // 0..1 along the aperture
        const off = (s * 2 - 1) * H                 // −H..+H across perp
        pts.push({
          x: el.x + axis.x * along(off) + perp.x * off,
          y: el.y + axis.y * along(off) + perp.y * off,
        })
      }
      return pts
    }
    let a, b
    if (el.convex) {
      // sagitta of a sphere of radius R at perpendicular distance |off|:
      // depth = R − sqrt(R² − off²), measured from the apex toward the rim
      // (the rim plane sits at along = 0).
      const depth = (off) => R - Math.sqrt(Math.max(0, R * R - off * off))
      a = facePts((off) => +bulge - depth(off), +1)
      b = facePts((off) => -bulge + depth(off), -1)
    } else {
      // biconcave: faces run from the rim corners (±bulge at off = ±H)
      // inward to a thin waist on the axis; the straight rim edges at
      // off = ±H close the outline into an hourglass profile.
      const waist = bulge * 0.3
      const D = bulge - waist                       // scoop depth
      const Rf = (H * H + D * D) / (2 * D)          // face arc radius
      const scoop = (off) => Rf - Math.sqrt(Math.max(0, Rf * Rf - off * off))
      a = facePts((off) => +waist + scoop(off), +1)
      b = facePts((off) => -waist - scoop(off), -1)
    }
    ctx.beginPath()
    ctx.moveTo(a[0].x, a[0].y)
    for (const p of a.slice(1)) ctx.lineTo(p.x, p.y)
    for (const p of b) ctx.lineTo(p.x, p.y)
    ctx.closePath()
    ctx.fillStyle = 'rgba(88,196,221,0.12)'
    ctx.fill()
    ctx.strokeStyle = active ? '#7fdcef' : 'rgba(88,196,221,0.75)'
    ctx.lineWidth = active ? 2 : 1.5
    ctx.stroke()
    // optical-axis tick (reuses `axis` from lensGeom above)
    const reach = Math.abs(el.bulge) + 8
    ctx.strokeStyle = 'rgba(88,196,221,0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(el.x - axis.x * reach, el.y - axis.y * reach)
    ctx.lineTo(el.x + axis.x * reach, el.y + axis.y * reach)
    ctx.stroke()
  }

  function drawRotateHandle(el) {
    const axis = { x: Math.cos(el.angle), y: Math.sin(el.angle) }
    const reach = (el.type === 'prism' ? el.size * 0.5 : el.h) + 16
    const hx = el.x + axis.x * reach
    const hy = el.y + axis.y * reach
    ctx.strokeStyle = 'rgba(88,196,221,0.5)'
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(hx, hy); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#58C4DD'
    ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill()
  }

  function roundRect(x, y, ww, hh, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + ww, y, x + ww, y + hh, r)
    ctx.arcTo(x + ww, y + hh, x, y + hh, r)
    ctx.arcTo(x, y + hh, x, y, r)
    ctx.arcTo(x, y, x + ww, y, r)
    ctx.closePath()
  }

  // rotate-handle hit test (returns id if a handle is grabbed)
  function pickHandle(x, y) {
    for (let i = optics.length - 1; i >= 0; i--) {
      const el = optics[i]
      const axis = { x: Math.cos(el.angle), y: Math.sin(el.angle) }
      const reach = (el.type === 'prism' ? el.size * 0.5 : el.h) + 16
      const hx = el.x + axis.x * reach
      const hy = el.y + axis.y * reach
      if (Math.hypot(x - hx, y - hy) <= 10) return el.id
    }
    return -1
  }
  function angleTo(id, x, y) {
    const el = getTool(id)
    if (!el) return
    el.angle = Math.atan2(y - el.y, x - el.x)
    emit()
  }

  // ---------- stats out ----------
  function emit() {
    if (!onChange) return
    onChange({ count: optics.length, solved })
  }

  // ---------- lifecycle ----------
  raf = requestAnimationFrame(draw)

  return {
    addTool, removeTool, clearTools, moveTool, rotateTool, setIndex,
    pickTool, pickHandle, angleTo, getTool, setHover,
    newTarget: randomizeTarget,
    moveSource: (y) => { source.y = clamp(y, 16, h - 16); emit() },
    sourceHitTest: (x, y) => Math.hypot(x - source.x, y - source.y) <= 18,
    get size() { return { w, h } },
    isSolved: () => solved,
    // --- test/debug hooks ---
    _setSource: (x, y, angle = 0) => { source = { x, y, angle } },
    _setTarget: (x, y, r = 15) => { target = { x, y, r } },
    _clearObstacles: () => { obstacles = [] },
    _traceReaches: () => traceBeam(
      { x: source.x, y: source.y },
      { x: Math.cos(source.angle), y: Math.sin(source.angle) },
      560,
    ).reached,
    _tracePoints: () => traceBeam(
      { x: source.x, y: source.y },
      { x: Math.cos(source.angle), y: Math.sin(source.angle) },
      560,
    ).pts,
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null }
    },
  }
}
