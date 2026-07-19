import { memo, useLayoutEffect, useRef, useState } from 'react'

// ============================================================
//  TransformText — manim's TransformMatchingShapes for the DOM.
//
//  When the `text` prop changes, every glyph that exists in both
//  the old and the new string flies from its old position to its
//  new one; leftovers fade out in place, newcomers fade in.
//  Positions are FLIP-measured, animations run on the Web
//  Animations API, and an interrupted transform re-measures the
//  glyphs mid-flight so scrubbing back and forth stays smooth.
// ============================================================

// split into grapheme clusters so Devanagari matras/conjuncts
// (e.g. "हिन्दी") survive being wrapped in individual spans
const segmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null
const graphemes = (s) =>
  segmenter ? Array.from(segmenter.segment(s), (g) => g.segment) : [...s]

const EASE = 'cubic-bezier(0.45, 0, 0.55, 1)' // ≈ manim's smooth()
const MOVE_MS = 620
const OUT_MS = 380
const IN_MS = 450
const IN_DELAY = 140

function TransformText({ text, className = '', as: Tag = 'div', color }) {
  const rootRef = useRef(null)
  const ghostsRef = useRef(null)
  const animsRef = useRef([])
  const pendingRef = useRef(null)
  const [display, setDisplay] = useState(text)

  // step 1 — the prop changed but the DOM still shows the old text:
  // record where every glyph currently sits (mid-flight transforms
  // included), then commit the new text
  useLayoutEffect(() => {
    if (text === display) return
    const root = rootRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (root && !reduced) {
      const origin = root.getBoundingClientRect()
      const chars = []
      for (const el of root.querySelectorAll('.tt-char')) {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        chars.push({
          ch: el.textContent,
          x: r.left - origin.left,
          y: r.top - origin.top,
          color: cs.color,
          opacity: parseFloat(cs.opacity),
        })
      }
      pendingRef.current = chars
    }
    for (const a of animsRef.current) a.cancel()
    animsRef.current = []
    if (ghostsRef.current) ghostsRef.current.textContent = ''
    setDisplay(text)
  }, [text, display])

  // step 2 — the new text is committed (not yet painted): match glyphs
  // and start the transform before the browser shows anything
  useLayoutEffect(() => {
    const old = pendingRef.current
    if (!old) return
    pendingRef.current = null
    const root = rootRef.current
    const layer = ghostsRef.current
    if (!root || !layer) return

    const origin = root.getBoundingClientRect()

    // pool the old glyphs by character; matching consumes them in
    // reading order so paths never cross for the same letter
    const pool = new Map()
    for (const c of old) {
      if (!pool.has(c.ch)) pool.set(c.ch, [])
      pool.get(c.ch).push(c)
    }

    const anims = []
    root.querySelectorAll('.tt-char').forEach((el, i) => {
      const match = pool.get(el.textContent)?.shift()
      if (match) {
        const r = el.getBoundingClientRect()
        const dx = match.x - (r.left - origin.left)
        const dy = match.y - (r.top - origin.top)
        anims.push(
          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)`, opacity: match.opacity },
              { transform: 'translate(0px, 0px)', opacity: 1 },
            ],
            { duration: MOVE_MS, easing: EASE, delay: Math.min(i * 3, 90), fill: 'backwards' }
          )
        )
      } else {
        anims.push(
          el.animate(
            [
              { opacity: 0, transform: 'translateY(0.35em) scale(0.8)' },
              { opacity: 1, transform: 'none' },
            ],
            {
              duration: IN_MS,
              easing: EASE,
              delay: IN_DELAY + Math.min(i * 5, 160),
              fill: 'backwards',
            }
          )
        )
      }
    })

    // glyphs with no home in the new text fade out where they stood
    for (const rest of pool.values()) {
      for (const c of rest) {
        const g = document.createElement('span')
        g.className = 'tt-ghost'
        g.textContent = c.ch
        g.style.left = `${c.x}px`
        g.style.top = `${c.y}px`
        g.style.color = c.color
        layer.appendChild(g)
        const a = g.animate(
          [
            { opacity: c.opacity, transform: 'none' },
            { opacity: 0, transform: 'translateY(-0.3em) scale(0.75)' },
          ],
          { duration: OUT_MS, easing: EASE, fill: 'forwards' }
        )
        a.onfinish = () => g.remove()
        anims.push(a)
      }
    }
    animsRef.current = anims
  }, [display])

  const tokens = display.split(/(\s+)/)
  return (
    <Tag className={`tt ${className}`} ref={rootRef} style={color ? { color } : undefined}>
      {/* screen readers get the plain string, not 300 spans */}
      <span className="tt-sr">{display}</span>
      <span className="tt-anim" aria-hidden="true">
        {tokens.map((tok, i) =>
          /^\s+$/.test(tok) ? (
            tok
          ) : (
            <span className="tt-word" key={i}>
              {graphemes(tok).map((g, j) => (
                <span className="tt-char" key={j}>
                  {g}
                </span>
              ))}
            </span>
          )
        )}
      </span>
      <span className="tt-ghosts" ref={ghostsRef} aria-hidden="true" />
    </Tag>
  )
}

export default memo(TransformText)
