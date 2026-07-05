import { CONTACT, LINKS } from '../content.js'

export default function Contact() {
  return (
    <>
      <section className="contact" id="contact">
        <div className="contact-box">
          <div className="section-kicker">§ {CONTACT.kicker}</div>
          <h2 className="contact-heading">{CONTACT.heading}</h2>
          <div className="contact-line">
            {CONTACT.line}{' '}
            <span className="contact-fine">{CONTACT.fine}</span>
          </div>
          <div className="contact-actions">
            <a className="btn-primary" style={{ background: 'var(--blue)' }} href={`mailto:${LINKS.email}`}>
              Email me
            </a>
            <a className="btn-ghost" href={LINKS.youtubeChannel} target="_blank" rel="noreferrer">
              Watch the channel
            </a>
          </div>
          <div className="contact-links">
            <a className="mono-link" href={LINKS.hindi3b1b} target="_blank" rel="noreferrer">
              → 3B1B HINDI
            </a>
            <a className="mono-link" href={LINKS.dubdesk} target="_blank" rel="noreferrer">
              → DUBDESK
            </a>
            <a className="mono-link" href={LINKS.linkedin} target="_blank" rel="noreferrer">
              → LINKEDIN
            </a>
            <a className="mono-link" href={LINKS.github} target="_blank" rel="noreferrer">
              → GITHUB
            </a>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <span>DEEPAK RANA — THE PLAYHEAD · v2.0</span>
        <span>
          Q.E.D. <span style={{ color: 'var(--blue)' }}>∎</span>
        </span>
      </footer>
    </>
  )
}
