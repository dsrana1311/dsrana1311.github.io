# Deepak Rana — Portfolio

An interactive portfolio built as a **graph, not a menu**: a constellation of four nodes
(Visual Educator · Global Communicator · Tool Builder · Rigorous Engineer) floating over a
live vector field, with a hands-on **vector field playground** as the proof-of-skill
centerpiece.

Design language: chalkboard precision, Manim palette, `cubic-bezier(0.22, 1, 0.36, 1)`
everywhere. See `Deepak Rana - Design Language.html` for the full spec.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## ✅ Before you publish — replace the placeholder links

**All links live in one file: [`src/content.js`](src/content.js).**
Search for `TODO` — there are 7 placeholders:

| Key | What to paste |
| --- | --- |
| `youtubeChannel` | Your YouTube channel URL |
| `featuredVideoIds` | The IDs of your 3 best videos (the part after `v=` in a YouTube URL) |
| `hindi3b1b` | 3Blue1Brown Hindi channel / playlist URL |
| `dubdesk` | DubDesk URL (or remove the DubDesk links if it isn't public) |
| `email` | Your email address |
| `linkedin` | Your LinkedIn profile |
| `github` | Your GitHub profile |

Every word of copy on the site also lives in `src/content.js`, so tone/wording edits never
require touching a component.

## Deploy to GitHub Pages

1. Create a GitHub repo and push this folder to the `main` branch.
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. Done — `.github/workflows/deploy.yml` builds and deploys on every push to `main`.
   Your site appears at `https://<username>.github.io/<repo>/`.

The Vite `base` is set to `'./'`, so the same build also works on Netlify, Vercel, or a
custom domain with zero changes.

## Map of the code

```
src/
  content.js               ← ALL copy + links (edit this one)
  styles.css               ← design tokens + all styling
  lib/field.js             ← vector field engine (ambient + playground)
  components/
    AmbientField.jsx       ← flowing field behind the hero
    Constellation.jsx      ← the node graph (mobile: card journey)
    Overlay.jsx            ← glass panels, one body per node
    Playground.jsx         ← interactive vector field demo
    Trajectory.jsx         ← 2019→2026 curve timeline
    Contact.jsx            ← ε-contact section + footer
```
