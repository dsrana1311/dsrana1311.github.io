---
name: verify
description: Build/launch/drive recipe for verifying changes to this Vite + React portfolio site in a real browser.
---

# Verifying this site

Vite + React SPA, no tests. Verification = drive it in a browser.

## Launch

```
npm run dev          # serves on http://localhost:5173
npm run build        # quick compile check only, not evidence
```

## Drive (headless Chrome)

No automation deps in this repo — install `puppeteer-core` in the session
scratchpad (NOT here; keep package.json clean) and point it at system Chrome:
`C:\Program Files\Google\Chrome\Application\chrome.exe`.

The whole site is scroll-driven: `PlayheadScene` maps window scroll over the
`.playhead-scroll` container to a playhead value `t` in [0,1] (5 chapters at
t = 0, .25, .5, .75, 1; text swaps at segment midpoints). To jump to a chapter:

```js
await page.evaluate((tt) => {
  const el = document.querySelector('.playhead-scroll')
  const topDoc = el.getBoundingClientRect().top + window.scrollY
  const total = Math.max(1, el.offsetHeight - window.innerHeight)
  window.scrollTo(0, topDoc + tt * total)
}, 0.5)
```

## Gotchas

- **Screenshots**: the stage is `position: sticky`, and puppeteer's `clip`
  uses *document* coordinates while `captureBeyondViewport` (default) re-lays
  the page out, collapsing sticky elements. Clipped shots come back empty.
  Use full-viewport shots: `page.screenshot({ captureBeyondViewport: false })`.
- Chapter text lives in `TransformText` (`.tt-char` spans animate, `.tt-sr`
  holds the plain string for assertions, `.tt-ghost` = glyphs fading out).
- Reduced motion is handled in JS: emulate with
  `page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])`
  and expect instant text swaps with zero `.tt-ghost` nodes.
- Audio/BGM won't autoplay headless; ignore related console noise.
