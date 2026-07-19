// ============================================================
//  ALL LINKS AND COPY LIVE HERE.
//  Search for "TODO" to find every placeholder link to replace.
//
//  Framing note: this copy is tuned for learning-design roles
//  (interactive STEM education) and is told in REVERSE.
//  It opens on the result, what I do right now, and then traces
//  the derivation backwards, each earlier scene explaining the one
//  above it: lessons ← translation & the tools I built for it
//  ← engineering rigor ← learning by doing. Chronology is kept
//  only as timestamps; the argument is the causal chain, run in
//  reverse, ending on the origin. Q.E.D.
// ============================================================

export const LINKS = {
  youtubeChannel: 'https://www.youtube.com/@ThePhysicsFrame',
  // Local looping videos served from public/videos/. To use YouTube instead,
  // replace an entry with a bare 11-char video ID (the part after v= in the URL).
  featuredVideoIds: [
    'videos/hidden-triangle.mp4',
    'videos/sequence-01.mp4',
    'videos/sequence-02.mp4',
  ],
  // Where each featured video (same order as above) opens on click.
  featuredVideoLinks: [
    'https://youtu.be/juISEYPsHvI',
    'https://youtu.be/OYz-zt6r3lU',
    'https://youtu.be/_WfxD5v_J7c',
  ],
  // TODO: replace with a link to the kinetic launcher spin-test video (or remove)
  spinTest: 'https://drive.google.com/drive/folders/1zvtUQrmkM344_JItEFNwH_DIr4isMvHl?usp=sharing',
  hindi3b1b: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNwUA5K8jpc5GSl335bX2vD',
  dubdesk: 'https://dsrana1311.github.io/dubdesk/',
  email: 'dsrana1311@gmail.com',
  // TODO: drop your tailored one-page résumé at public/resume.pdf
  resume: '/resume.pdf',
  linkedin: 'https://www.linkedin.com/in/dsrana1311/',
  github: 'https://github.com/dsrana1311',
}

export const PREMISE = {
  domain: 'DEEPAK RANA',
}

// ============================================================
//  THE FOUR KEYFRAMES, the derivation, read top-to-bottom in
//  reverse chronology (present → origin). Order matters: it is
//  also the order of the morph shapes
//  (sine → waveform → chassis → gear). DubDesk is no longer a
//  keyframe of its own; it lives inside the 3Blue1Brown stop,
//  because it is a tool built *for* that work.
// ============================================================
export const CHAPTERS = [
  {
    key: 'explainer',
    year: 2026,
    color: '#58C4DD',
    rgb: [88, 196, 221],
    mark: 'THE PHYSICS FRAME',
    scene: 'SCENE 01, THE RESULT: DESIGN(THE LESSON)',
    label: 'RIGHT NOW · LEARNING DESIGNER · THE PHYSICS FRAME',
    title: 'Right now, I teach using visuals not just words.',
    body: 'On The Physics Frame, I break down complex ideas into visual, step-by-step Manim animations. I encourage learners to think. Thinking is the pedagogy. Everything below is how I got here.',
    chips: ['MANIM', 'VISUAL-FIRST', 'INTERACTIVE'],
    dossierLink: '→ know more',
  },
  {
    key: 'translator',
    year: 2025,
    color: '#FFC857',
    rgb: [255, 200, 87],
    mark: '3BLUE1BROWN',
    scene: 'SCENE 02, BECAUSE: TRANSLATE(MATH, हिन्दी)',
    label: '2025 · HINDI TRANSLATOR & VOICE · 3BLUE1BROWN',
    title: 'Because first I rebuilt the world’s best math lessons in Hindi.',
    body: 'Designing my own lessons came out of rebuilding the best ones line by line. As the Hindi translator and voice of 3Blue1Brown, I re-engineer every metaphor and re-time every reveal so the math stays exact and the wonder survives in Hindi.',
    chips: ['3BLUE1BROWN', 'PEDAGOGY', 'DUBDESK'],
    dossierLink: '→ inside the dub (+ DubDesk)',
  },
  {
    key: 'engineer',
    year: 2023,
    color: '#FF9F45',
    rgb: [255, 159, 69],
    mark: 'MARUTI SUZUKI',
    scene: 'SCENE 03, BECAUSE: DECOMPOSE(COMPLEXITY)',
    label: '2023–2025 · BODY DESIGN ENGINEER · MARUTI SUZUKI',
    title: 'Which I could do because engineering taught me to decompose complexity.',
    body: 'At Maruti Suzuki, India’s largest automaker, I owned front-underbody packaging across 400+ parts to crash standards and when the workflow was slow, I automated it. That instinct, break the hard thing down and build the tool that’s missing, is exactly what the dub work and DubDesk needed.',
    chips: ['400+ PARTS', 'CROSS-FUNCTIONAL', 'AUTOMATION'],
    dossierLink: '→ see the work',
  },
  {
    key: 'student',
    year: 2019,
    color: '#FC6255',
    rgb: [252, 98, 85],
    mark: 'MECH ENG · ORIGIN',
    scene: 'SCENE 04, THE AXIOM: LEARN(BY DOING)',
    label: '2019–2023 · B.TECH MECHANICAL ENGINEERING',
    title: 'And all of it started with learning by doing.',
    body: 'Four years of Mechanical Engineering but the education that stuck was a SpinLaunch-style kinetic launcher I designed, fabricated and spin-tested myself. Nothing teaches v = ωr like a projectile you release with your own hand.',
    chips: ['STEM DEGREE', 'HANDS-ON', 'CAD'],
    dossierLink: '→ fire the launcher',
  },
]

// ---------- easter eggs ----------
//
//  Typed on the page, not linked from anywhere. `manim` morphs the
//  particles into π (see PlayheadScene). `laser` opens the optics
//  bench below: a sandbox, not a lesson — no goal, no lock-in, just
//  a toy that happens to obey Snell's law. It is hidden precisely
//  because play with no lesson attached is the point.

export const OPTICS_EGG = {
  word: 'laser',
  kicker: 'EASTER EGG, YOU TYPED “LASER”',
  title: 'The optics bench',
  blurb:
    'Not a lesson, just a toy. Drag lenses, mirrors and a prism onto the board and bend a real ray around. Nothing to score, nothing to unlock, the physics is simply correct and yours to poke at.',
  escHint: 'ESC TO PUT IT BACK',
}

// ---------- dossier (deep-dive) content ----------
//
//  A dossier can carry a nested `dossier` of its own, a full
//  deep-dive that opens on top of it and closes back into it. The
//  3Blue1Brown scene uses this to fold in DubDesk, the tool built
//  for that work. The present-day scene uses `labs` to drive a
//  tabbed switcher between live interactive lessons.

export const DOSSIERS = {
  // ---- SCENE 01 · the result (opens the reverse story) ----
  explainer: {
    kicker: 'THE RESULT, LESSONS YOU CAN PLAY, NOT JUST WATCH',
    intro:
      'Check these interactive lessons out.',
    // drives the tabbed lab switcher (see LabSwitcher in Dossier.jsx)
    labs: [
      {
        id: 'bayes',
        tab: 'BAYES’ THEOREM',
        title: 'The medical test paradox',
        blurb:
          'A 99% accurate test says you’re sick. The odds you actually are hover near 9%. Count the people instead of juggling the formula and Bayes’ theorem stops being counter-intuitive.',
        kind: 'link',
        href: 'https://dsrana1311.github.io/medical-test-paradox/',
        shot: '/lessons/medical-test-paradox.png',
        shotAlt:
          'Opening screen of The Medical Test Paradox: “The test says you’re sick. Should you believe it?” beside a grid of 1,000 dots.',
      },
      {
        id: 'matrices',
        tab: 'MATRICES',
        title: 'The machines that move space',
        blurb:
          'A matrix isn’t a grid of numbers to memorize, it’s a machine that moves space. Drag the two basis vectors, watch the whole plane, and a face drawn on it, stretch and shear with them. Once you see the grid move, the multiplication rule is obvious.',
        kind: 'link',
        href: 'https://dsrana1311.github.io/Matrices/',
        shot: '/lessons/matrices.png',
        shotAlt:
          'Opening screen of Matrices: a coordinate grid with a smiley face and two draggable basis-vector arrows, with the task “Make the face twice as wide.”',
      },
      {
        id: 'rayleigh',
        tab: 'RAYLEIGH CRITERION',
        title: 'The zoom trap',
        blurb:
          'Apollo 11 left four lines of steel writing on the Moon and no telescope on Earth can read them. Chase the magnification and you hit the wall physics set: resolution is aperture, not zoom.',
        kind: 'link',
        href: 'https://dsrana1311.github.io/the-zoom-trap/',
        shot: '/lessons/the-zoom-trap.png',
        shotAlt:
          'Title screen of The Zoom Trap, an interactive lesson on the resolving power of telescopes.',
      },
    ],
    videos: true,
    ctaText: 'Visit the channel',
    ctaLink: 'youtubeChannel',
  },

  // ---- SCENE 02 · 3Blue1Brown, with DubDesk folded in ----
  translator: {
    kicker: 'BECAUSE, WHAT LOCALIZATION TEACHES ABOUT TEACHING',
    intro:
      'Before I designed lessons, I rebuilt the best ones. Translating Grant Sanderson is a masterclass in learning design: keep the math exact and the wonder intact for a learner with a different language, schooling and metaphors. Empathy work, one line at a time, for an audience of millions.',
    steps: [
      ['01', 'Translate', 'Carry the math across languages without dropping a single line of precision.'],
      ['02', 'Adapt', 'Rebuild the jokes, metaphors and rhythm so Hindi learners feel the original wonder, not a word-for-word shadow of it.'],
      ['03', 'Perform', 'Voice every line myself, pacing matched to Grant’s, energy matched to the idea.'],
      ['04', 'Sync', 'Time each take against the animation so the reveal lands on the exact frame.'],
    ],
    ctaText: 'Watch 3Blue1Brown in Hindi',
    ctaLink: 'hindi3b1b',
    // the tool this work spawned, nested one level deeper
    nested: {
      linkText: 'The pipeline was slow, so I built DubDesk →',
      note: 'Born inside this work',
      dossier: {
        kicker: 'THE TOOL INSIDE THE WORK, DUBDESK',
        intro:
          'Dubbing high-level math is slow, and slow pipelines quietly kill quality. So I designed, built and shipped DubDesk solo, self-taught, because the tool the work needed didn’t exist yet.',
        facts: [
          ['SCRIPT ALIGNMENT', 'Original and translated scripts side by side, line-locked, so nothing drifts.'],
          ['TAKE MANAGEMENT', 'Record, compare and pick takes without leaving the flow.'],
          ['TIMING & SYNC', 'Every line timed against the source narration, the reveal lands where it should.'],
          ['EXPORT', 'One-click export of the final audio, ready to drop into the animation.'],
        ],
        ctaText: 'Open DubDesk',
        ctaLink: 'dubdesk',
      },
    },
  },

  // ---- SCENE 03 · Maruti ----
  engineer: {
    kicker: 'BECAUSE, COMPLEXITY, DECOMPOSED DAILY',
    intro:
      'Associate Manager – Body Design, Maruti Suzuki India Limited (Aug 2023 – Aug 2025)',
    facts: [
      ['CRASH SAFETY', 'Developed front-underbody parts for the B-platform to Euro NCAP and BNCAP crash standards, feasibility studies balancing weight, cost, safety and manufacturability, defended at platform level.'],
      ['TOOLING', 'Built Excel-based automation adopted as the team’s standard workflow, cutting a recurring ~1-hour task to ~5 minutes, hundreds of engineering hours saved a year.'],
      ['VISIBILITY', 'Created a Parts & Drawing Progress Tracker covering thousands of components across design phases, improving visibility and cutting follow-up delays.'],
      ['TEACHING', 'Mentored 2 Graduate Engineer Trainees on UG NX modeling, design process and manufacturing efficiency.'],
    ],
  },

  // ---- SCENE 04 · the origin (closes the reverse story) ----
  student: {
    kicker: 'THE AXIOM, THE KINETIC LAUNCHER',
    intro:
      'A SpinLaunch-inspired kinetic launch system: spin a projectile up on a rotating arm, release along the tangent, and let geometry do the throwing. The base case for everything above, learning by doing.',
    facts: [
      ['2019–2023', 'B.Tech, Mechanical Engineering'],
      ['2023', 'Kinetic launch system: concept, CAD, fabrication, live spin tests.'],
      ['THE AXIOM', 'Abstractions stick when learners can act on them.'],
    ],
    ctaText: 'Watch the spin test',
    ctaLink: 'spinTest',
  },
}

export const CONTACT = {
  heading: 'Let\'s build something great.',
  lim: 'lim',
  limSub: 'Δt → 24h',
  line: 'P(reply) = 1',
  fine: '(Proof available on request.)',
}
