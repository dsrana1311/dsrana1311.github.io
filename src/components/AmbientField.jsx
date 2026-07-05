import { useEffect, useRef } from 'react'
import { createFieldEngine } from '../lib/field.js'

/** Slow-flowing vector field behind the hero — ambient math, per the design language. */
export default function AmbientField() {
  const ref = useRef(null)

  useEffect(() => {
    const engine = createFieldEngine(ref.current, { ambient: true })
    return () => engine.destroy()
  }, [])

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />
}
