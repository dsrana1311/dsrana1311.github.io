import { CONTACT, LINKS } from '../content.js'
import { YouTubeIcon, LinkedInIcon, GitHubIcon, MailIcon } from './SocialIcons.jsx'

export default function Contact() {
  return (
    <>
      <section className="contact" id="contact">
        <div className="contact-box">
          <div className="section-kicker">{CONTACT.kicker}</div>
          <h2 className="contact-heading">{CONTACT.heading}</h2>
          {CONTACT.pitch && <p className="contact-pitch">{CONTACT.pitch}</p>}
          <div className="contact-line">
            {CONTACT.lim}
            <sub className="contact-lim-sub">{CONTACT.limSub}</sub>{' '}
            {CONTACT.line}{' '}
            <span className="contact-fine">{CONTACT.fine}</span>
          </div>
          <div className="contact-actions">
            <a className="btn-primary btn-with-icon" style={{ background: 'var(--blue)' }} href={`mailto:${LINKS.email}`}>
              <MailIcon className="btn-icon" />
              Email me
            </a>
          </div>
          <div className="contact-links">
            <a className="icon-link icon-link-solo" href={LINKS.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
              <LinkedInIcon className="icon-link-glyph" />
            </a>
            <a className="icon-link icon-link-solo" href={LINKS.github} target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
              <GitHubIcon className="icon-link-glyph" />
            </a>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <span>© 2026 DEEPAK RANA</span>
        <span>
          Q.E.D. <span style={{ color: 'var(--blue)' }}>∎</span>
        </span>
      </footer>
    </>
  )
}
