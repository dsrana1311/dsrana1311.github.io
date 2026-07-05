// ============================================================
//  ALL LINKS AND COPY LIVE HERE.
//  Search for "TODO" to find every placeholder link to replace.
// ============================================================

export const LINKS = {
  // TODO: replace with your real YouTube channel URL
  youtubeChannel: 'https://www.youtube.com/@ThePhysicsFrame',
  // Local looping videos served from public/videos/. To use YouTube instead,
  // replace an entry with a bare 11-char video ID (the part after v= in the URL).
  featuredVideoIds: [
    'videos/hidden-triangle.mp4',
    'videos/sequence-01.mp4',
    'videos/sequence-02.mp4',
  ],
  // TODO: replace with a link to the kinetic launcher spin-test video (or remove)
  spinTest: 'https://www.youtube.com/watch?v=SPIN_TEST_VIDEO',
  // TODO: replace with the 3Blue1Brown Hindi channel / playlist URL
  hindi3b1b: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNwUA5K8jpc5GSl335bX2vD',
  // TODO: replace with DubDesk URL if it is public (or remove the link in the dossier)
  dubdesk: 'https://dubdesk.example.com',
  // TODO: replace with your email
  email: 'dsrana1311@gmail.com',
  // TODO: replace with a hosted résumé PDF (or a Drive link)
  resume: '/resume.pdf',
  // TODO: replace or remove
  linkedin: 'https://www.linkedin.com/in/dsrana1311/',
  // TODO: replace or remove
  github: 'https://github.com/dsrana1311',
}

export const PREMISE = {
  domain: 'DEEPAK RANA',
  headline: ['This site is an animation.', "You're holding the playhead."],
  hint: 'SCROLL, DRAG, OR PRESS PLAY — SEVEN YEARS IN TWENTY SECONDS',
}

// ============================================================
//  THE FIVE KEYFRAMES.
//  Order matters: it is also the order of the morph shapes
//  (gear → chassis → waveform → window → sine).
// ============================================================
export const CHAPTERS = [
  {
    key: 'student',
    year: 2019,
    color: '#FC6255',
    rgb: [252, 98, 85],
    mark: 'STUDENT',
    scene: 'SCENE 01 — BUILD(INTUITION)',
    label: '2019–2023 · B.TECH MECHANICAL ENGINEERING',
    title: 'It started mechanical.',
    body: 'Four years of Mechanical Engineering. In 2022 I built a kinetic launch system inspired by SpinLaunch. The project taught me how to make things that move, and how to make them move well.',
    chips: ['CAD'],
    dossierLink: '→ open the spin test',
  },
  {
    key: 'engineer',
    year: 2023,
    color: '#FF9F45',
    rgb: [255, 159, 69],
    mark: 'MARUTI SUZUKI',
    scene: 'SCENE 02 — PACKAGE(UNDERBODY, ±0.5mm)',
    label: '2023–2025 · BODY DESIGN ENGINEER · MARUTI SUZUKI',
    title: 'Then I designed real bodies.',
    body: 'Associate Manager – Body Design at Maruti Suzuki, India’s largest automaker. Owned front-underbody packaging across 400+ parts, met Euro NCAP and BNCAP crash standards, and automated the busywork out of the job.',
    chips: ['MARUTI SUZUKI', '400+ PARTS', 'EURO NCAP/BNCAP'],
    dossierLink: '→ see the work',
  },
  {
    key: 'translator',
    year: 2025,
    color: '#FFC857',
    rgb: [255, 200, 87],
    mark: '3BLUE1BROWN',
    scene: 'SCENE 03 — TRANSLATE(MATH, हिन्दी)',
    label: '2025–PRESENT · HINDI TRANSLATOR · 3BLUE1BROWN',
    title: 'Then I left, to make math speak Hindi.',
    body: 'I stepped away from the plant to work in STEM education. Now I’m the Hindi translator and dubbing artist for 3Blue1Brown — localizing high-level math for millions who’d never heard it in their language.',
    chips: ['3BLUE1BROWN', 'HINDI', 'DUBBING'],
    dossierLink: '→ how a dub gets made',
  },
  {
    key: 'builder',
    year: 2025.5,
    color: '#83C167',
    rgb: [131, 193, 103],
    mark: 'DUBDESK',
    scene: 'SCENE 04 — SHIP(DUBDESK)',
    label: '2025 · THE BUILDER · DUBDESK',
    title: 'The workflow was slow, so I built DubDesk.',
    body: 'A personal dubbing-and-translation platform I built to make my localization faster and sharper. When the workflow is the bottleneck, the workflow becomes the project.',
    chips: ['DUBDESK', 'PLATFORM', 'SHIPPED'],
    dossierLink: '→ open DubDesk',
  },
  {
    key: 'explainer',
    year: 2026,
    color: '#58C4DD',
    rgb: [88, 196, 221],
    mark: 'YOUTUBE',
    scene: 'SCENE 05 — RENDER(PHYSICS)',
    label: '2026 · THE EXPLAINER · YOUTUBE',
    title: 'Now I explain physics, visually.',
    body: 'My own YouTube channel, explaining beautiful physics with Manim — totally visual, totally intuitive. 10+ videos in. The views aren’t here yet; I’m still making, because that’s the part I can control.',
    chips: ['MANIM', 'PHYSICS', '10+ VIDEOS'],
    dossierLink: '→ enter the lab',
  },
]

// ---------- dossier (deep-dive) content ----------

export const DOSSIERS = {
  student: {
    kicker: 'THE FULL SCENE — THE KINETIC LAUNCHER',
    intro:
      'A SpinLaunch-inspired kinetic launch system: spin a projectile up on a rotating arm, release along the tangent, and let geometry do the throwing. Designed in CAD, fabricated, and spin-tested for real.',
    facts: [
      ['2019–2023', 'B.Tech, Mechanical Engineering — the grammar of the physical world.'],
      ['2022', 'Kinetic launch system: concept, CAD, fabrication, live spin tests.'],
    ],
    ctaText: 'Watch the spin test',
    ctaLink: 'spinTest',
  },
  engineer: {
    kicker: 'THE FULL SCENE — BODY DESIGN AT SCALE',
    intro:
      'Associate Manager – Body Design, Maruti Suzuki India Limited, Gurugram (Aug 2023 – Aug 2025). Front-underbody packaging at India’s largest automobile company: real parts, real tolerances, real consequences — every clearance negotiated between crash, corrosion, cost and manufacturability.',
    facts: [
      ['INTEGRATION', 'Managed technical integration for 400+ vehicle components, coordinating requirements across Styling, CAE and Manufacturing to hold safety and design compliance.'],
      ['CRASH SAFETY', 'Developed front-underbody parts for the B-platform to meet Euro NCAP and BNCAP crash standards — feasibility studies balancing weight, cost, safety and manufacturability, defended at platform level.'],
      ['AUTOMATION', 'Built Excel-based automation adopted as the team’s standard workflow, cutting a recurring engineering task from ~1 hour to ~5 minutes — hundreds of engineering hours saved a year.'],
      ['PROGRESS TRACKER', 'Created a Parts & Drawing Progress Tracker covering thousands of components across design phases, improving visibility and cutting follow-up delays.'],
      ['MENTORSHIP', 'Mentored 2 Graduate Engineer Trainees on vehicle fundamentals, UG NX modeling and manufacturing efficiency.'],
    ],
  },
  translator: {
    kicker: 'THE FULL SCENE — WHAT LOCALIZATION ACTUALLY TAKES',
    intro:
      'Translating Grant Sanderson is a masterclass in precision: every sentence must keep the math exact and the wonder intact — then survive being performed out loud, in sync, in another language.',
    steps: [
      ['01', 'Translate', 'Carry the math across languages without dropping a single ε of precision.'],
      ['02', 'Adapt', 'Rebuild the jokes, metaphors and rhythm so Hindi viewers feel the original wonder.'],
      ['03', 'Perform', 'Voice every line myself — pacing matched to Grant’s, energy matched to the idea.'],
      ['04', 'Sync', 'Time each take against the animation so the reveal lands on the exact frame.'],
    ],
    ctaText: 'Watch 3Blue1Brown in Hindi',
    ctaLink: 'hindi3b1b',
  },
  builder: {
    kicker: 'THE FULL SCENE — WHAT DUBDESK DOES',
    intro:
      'Dubbing high-level math is slow when your tools fight you. DubDesk streamlines the whole pipeline end to end, for one reason: make the localization faster without making it worse.',
    facts: [
      ['SCRIPT ALIGNMENT', 'Original and translated scripts side by side, line-locked, so nothing drifts.'],
      ['TAKE MANAGEMENT', 'Record, compare and pick takes without leaving the flow.'],
      ['TIMING & SYNC', 'Every line timed against the source narration — the reveal lands where it should.'],
    ],
    ctaText: 'See DubDesk',
    ctaLink: 'dubdesk',
  },
  explainer: {
    kicker: 'THE FULL SCENE — LIVE PROOF',
    intro:
      'This isn’t a video of a simulation — it is the simulation, built into this page. Drag lenses, mirrors and prisms onto the board and bend a laser around the walls onto the target. Every surface obeys Snell’s law, so a prism really splits the beam into a spectrum. This is what I mean by making physics playable.',
    playground: true,
    videos: true,
    ctaText: 'Visit the channel',
    ctaLink: 'youtubeChannel',
  },
}

export const CONTACT = {
  kicker: 'POST-CREDITS SCENE',
  heading: 'Let’s converge.',
  line: 'For every ε > 0, I reply within ε days.',
  fine: '(Proof available on request.)',
}
