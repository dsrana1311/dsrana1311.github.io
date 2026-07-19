// ============================================================
//  Point-cloud shape layouts for the morph stage.
//  Every shape is N points in a 1064 × 320 viewBox, in matching
//  order, so linear interpolation between any two reads as a
//  continuous transformation.
// ============================================================

export const N = 44
export const STAGE_W = 1064
export const STAGE_H = 320
// The story runs in REVERSE chronology: it opens on the present
// (sine — the live lessons) and traces back to the origin (gear —
// the mechanical-engineering student). buildLayouts() returns the
// shapes already in that present→past order.

const cx = STAGE_W / 2
const cy = STAGE_H / 2

/** Resample a closed polygon into exactly n evenly spaced points. */
function resample(verts, n) {
  const segs = []
  let total = 0
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i]
    const b = verts[(i + 1) % verts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    segs.push({ a, b, len, acc: total })
    total += len
  }
  const out = []
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total
    let placed = false
    for (let j = 0; j < segs.length; j++) {
      const s = segs[j]
      if ((target >= s.acc && target <= s.acc + s.len) || j === segs.length - 1) {
        const f = s.len ? (target - s.acc) / s.len : 0
        out.push([s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f])
        placed = true
        break
      }
    }
    if (!placed) out.push(verts[0].slice())
  }
  return out
}

let cache = null

/**
 * Build the four chapter layouts, in reverse-chronological order:
 * sine (the present — live lessons) → voice waveform (3Blue1Brown,
 * with DubDesk folded into it) → car chassis (Maruti) → gear (the
 * mechanical-engineering origin). We build each shape once and then
 * return them present→past.
 */
export function buildLayouts() {
  if (cache) return cache

  // gear (student — mechanical)
  const gear = []
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? 96 : 126
    gear.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }

  // chassis (Maruti — traced from car.png reference outline)
  const carRel = [
    [-211.8, 43.1], [-200.3, 55.6], [-175.6, 58.7], [-160.2, 76.5], [-137.5, 84.5],
    [-114.5, 77.3], [-100.2, 57.7], [-74.3, 57.4], [-48.4, 57.1], [-22.5, 56.9],
    [3.4, 56.6], [29.4, 56.6], [55.2, 56.4], [81.0, 56.9], [103.9, 61.3],
    [120.1, 79.5], [143.8, 84.5], [165.4, 74.0], [176.4, 52.6], [198.2, 46.2],
    [211.0, 29.1], [213.0, 3.9], [209.1, -18.6], [203.5, -38.5], [183.5, -53.1],
    [162.7, -65.5], [157.3, -74.8], [132.5, -77.6], [112.8, -84.5], [88.9, -81.4],
    [63.4, -82.7], [37.4, -82.7], [11.7, -82.0], [-13.2, -79.4], [-36.4, -72.7],
    [-57.9, -61.9], [-78.9, -49.6], [-99.6, -37.0], [-123.5, -31.8], [-148.4, -29.3],
    [-172.6, -24.9], [-195.9, -18.5], [-209.3, -3.1], [-213.0, 20.3],
  ]
  const chassis = resample(carRel.map((p) => [cx + p[0], cy + p[1]]), N)

  // voice waveform (3b1b — the dub)
  const wave = []
  for (let i = 0; i < N; i++) {
    const x = 60 + (i / (N - 1)) * (STAGE_W - 120)
    const amp = 18 + 78 * Math.abs(Math.sin(i * 0.83) * Math.sin(i * 0.31))
    wave.push([x, cy + (i % 2 === 0 ? -amp : amp)])
  }

  // sine (The Physics Frame — the present, visual math you can push on)
  const sine = []
  for (let i = 0; i < N; i++) {
    const x = 60 + (i / (N - 1)) * (STAGE_W - 120)
    sine.push([x, cy - 86 * Math.sin((i / (N - 1)) * Math.PI * 4)])
  }

  // reverse-chronological: present (sine) → 3b1b (wave) → Maruti
  // (chassis) → origin (gear). DubDesk no longer has its own shape;
  // it lives inside the 3b1b stop.
  cache = [sine, wave, chassis, gear]
  return cache
}

let piCache = null

/** π outline, for the "manim" easter egg. */
export function piLayout() {
  if (piCache) return piCache
  const rel = [
    [-132, -82], [132, -82], [132, -56], [86, -56],
    [86, 64], [98, 80], [84, 94], [64, 84], [58, 60], [58, -56],
    [-58, -56], [-58, 88], [-86, 88], [-86, -56], [-132, -56],
  ]
  piCache = resample(rel.map((p) => [cx + p[0], cy + p[1]]), N)
  return piCache
}

/**
 * Per-shape idle animation, applied while the playhead is parked
 * (and blended through morphs). `time` is in milliseconds.
 */
export function idlePerturb(shapeIdx, pts, time) {
  const out = new Array(pts.length)
  // indices follow the reverse-chronological order returned by
  // buildLayouts(): 0 = sine, 1 = waveform, 2 = chassis, 3 = gear.
  switch (shapeIdx) {
    case 0: {
      // sine (the present): a travelling wave rides the curve
      for (let i = 0; i < pts.length; i++) {
        const phase = (pts[i][0] / STAGE_W) * Math.PI * 4
        out[i] = [pts[i][0], pts[i][1] + 9 * Math.sin(time * 0.0024 - phase)]
      }
      return out
    }
    case 1: {
      // waveform (3b1b): it speaks — amplitude breathes per point
      for (let i = 0; i < pts.length; i++) {
        const dy = pts[i][1] - cy
        out[i] = [pts[i][0], cy + dy * (1 + 0.24 * Math.sin(time * 0.004 + i * 0.55))]
      }
      return out
    }
    case 2: {
      // chassis (Maruti): gentle bob plus a hint of road vibration
      const bob = 2.6 * Math.sin(time * 0.0018)
      for (let i = 0; i < pts.length; i++) {
        out[i] = [pts[i][0], pts[i][1] + bob + 0.7 * Math.sin(time * 0.016 + i * 1.7)]
      }
      return out
    }
    case 3: {
      // gear (the origin): slow continuous rotation about its hub
      const a = time * 0.00022
      const cos = Math.cos(a)
      const sin = Math.sin(a)
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i][0] - cx
        const dy = pts[i][1] - cy
        out[i] = [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
      }
      return out
    }
    default:
      return pts
  }
}
