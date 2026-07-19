import { useEffect, useRef, useState } from 'react'
import { OPTICS_EGG } from '../content.js'
import LaserLab from './LaserLab.jsx'

// The optics bench, hidden behind the `laser` keyword (see PlayheadScene).
// It is a sandbox rather than a lesson, so it deliberately gets no tab in
// the dossier and no link anywhere: you only reach it by typing.
export default function OpticsEgg({ open, onClose }) {
  const [mounted, setMounted] = useState(open)
  const closeRef = useRef(null)

  // keep the lab mounted through the close animation, matching the
  // dossier/overlay pattern elsewhere on the site
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const t = setTimeout(() => setMounted(false), 420)
    return () => clearTimeout(t)
  }, [open])

  // esc closes, scroll lock freezes the playhead behind it, focus moves in
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!mounted) return null

  return (
    <>
      <div
        className={`egg-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`egg-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={OPTICS_EGG.title}
      >
        <div className="egg-content">
          <div className="egg-head">
            <span className="egg-diamond" />
            <div className="mono-label egg-kicker">{OPTICS_EGG.kicker}</div>
            <span style={{ flex: 1 }} />
            <button ref={closeRef} className="dossier-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <h3 className="dossier-title">{OPTICS_EGG.title}</h3>
          <p className="dossier-intro">{OPTICS_EGG.blurb}</p>

          <div className="lab-stage">
            <LaserLab />
          </div>

          <div className="cta-row">
            <span className="dossier-esc-hint">{OPTICS_EGG.escHint}</span>
          </div>
        </div>
      </aside>
    </>
  )
}
