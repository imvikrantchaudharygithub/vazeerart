// studio/scripts/lib/designData.ts
export const PROJECTS = [
  {slug: 'pagal', title: 'Pagal', format: 'Music Video', year: '2022', role: 'Director of Photography', category: 'dop', cover: 'A'},
  {slug: 'dehleez', title: 'Dehleez', format: 'TV Mini Series', year: '2022', role: 'Director of Photography', category: 'dop', cover: 'M'},
  {slug: 'chakk-ke-glass', title: 'Chakk ke Glass', format: 'Short Film', year: '2021', role: 'Director of Photography', category: 'dop', cover: 'S'},
  {slug: 'booti-shake', title: 'Booti Shake', format: 'Music Video', year: '2020', role: 'Editor', category: 'editor', cover: 'D'},
  {slug: 'love-marriage', title: 'Love Marriage', format: 'Music Video', year: '2020', role: 'Editor', category: 'editor', cover: 'P'},
] as const

export const FRAME_KEYS = ['C', 'E', 'F', 'J', 'K', 'N', 'S', 'P', 'Q', 'T', 'V', 'W'] as const
export const FRAME_RATIOS_SEED = ['4/5', '9/16', '4/5', '1/1', '4/5', '9/16', '4/5', '4/5', '1/1', '9/16', '4/5', '4/5'] as const

export const MARQUEE_WORDS = ['Films', 'Commercials', 'Music Videos', 'Colour', 'The Edit']

export const EXPLORE_CARDS = [
  {label: 'Work & Reels', sub: 'watch', target: 'work', image: 'B', alt: 'Still from a music video'},
  {label: 'Frames', sub: 'browse', target: 'frames', image: 'T', alt: 'Best Instagram frame'},
  {label: 'Get in touch', sub: 'book', target: 'contact', image: 'L', alt: 'Vazeer with the gimbal'},
] as const

export const SKILLS = [
  {label: 'gimbal', tilt: -3, image: 'O'},
  {label: 'colour grading', tilt: 2, image: 'W'},
  {label: 'the edit', tilt: -2, image: 'G'},
  {label: 'music videos', tilt: 3, image: 'M'},
] as const

export const PAGES = [
  {key: 'home', navLabel: 'Home', menuLabel: 'Home'},
  {key: 'about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
  {key: 'work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
  {key: 'frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
  {key: 'contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
] as const

export const SOCIALS = [
  {label: 'Instagram', url: 'https://www.instagram.com/vazeerart/'},
  {label: 'Facebook', url: 'https://www.facebook.com/vazeerart/'},
  {label: 'IMDb', url: 'https://www.imdb.com/name/nm11732285/'},
  {label: 'TikTok', url: 'https://www.tiktok.com/@vazeerart'},
]

export const FORM_TYPES = ['Music video', 'Commercial', 'Film / Series', 'Edit only']

export const COPY = {
  copyright: '© Vazeer Art, 2026 · New Delhi',
  management: {label: 'management', handle: '@prachar.it ↗', url: 'https://www.instagram.com/prachar.it/'},
  dm: {label: 'dm me', handle: '@vazeerart ↗', url: 'https://www.instagram.com/vazeerart/'},
  leader: {left: 'Vazeer Art', right: 'Showreel 2026', skip: 'Skip →'},
  menu: {script: 'menu', close: 'Close ✕', socials: 'follow on socials /'},
  home: {
    hero: {word: 'Vazeer', script: 'art'},
    intro: {
      script: "hey, i'm",
      heading: 'Vazeer Art',
      subline: '(Shakir Ali, if we’re being formal)',
      body: 'I’m a Delhi-based director of photography and video editor who can’t sit still behind the camera. Give me a gimbal, a moody location and a track on loop, and I’ll bring back frames that feel like cinema — graded, cut and ready to drop.',
      ctaLabel: 'More about me →',
    },
    reels: {script: 'now showing', heading: 'Selected reels', ctaLabel: 'All work & reels →'},
    explore: {script: 'explore', heading: 'The work'},
    currently: {
      script: 'currently',
      heading: 'Booking films, commercials & music videos',
      body: 'Available to shoot, edit and grade — the whole look, in one set of hands. Bookings handled with my management team at @prachar.it.',
      ctaLabel: 'Start a project →',
    },
  },
  work: {
    title: 'Work',
    script: '& reels',
    intro: 'Music videos, series and shorts — shot, cut and graded by Vazeer.',
    filters: {all: 'All', dop: 'Cinematography', editor: 'Editing'},
    showreel: {label: 'Showreel', orderNotePrefix: 'in order of appearance:'},
    numberPrefix: 'no.',
    projectCta: 'Watch & view frames →',
    skills: {script: 'on set', heading: 'Special skills'},
    projectPage: {
      backLabel: '← Work & reels',
      reelPrefix: 'reel no.',
      roleLabel: 'role',
      formatLabel: 'format',
      yearLabel: 'year',
      aspectLabel: '2.39 : 1',
      grabsScript: 'frame',
      grabsHeading: 'Grabs',
      upNextScript: 'up next',
    },
  },
  frames: {
    script: 'straight from the grid',
    heading: 'Frames',
    linkLabel: '(follow along @vazeerart ↗)',
    linkUrl: 'https://www.instagram.com/vazeerart/',
    reelLabel: 'Reel cover',
    postLabel: 'Instagram post',
  },
  about: {
    hero: {
      script: "hey, i'm",
      heading: 'Vazeer Art',
      body: 'Cinematographer, editor and full-time frame hunter. I shoot the way I cut — always thinking about the next shot, the beat it lands on and the colour it lives in. Let’s make something people rewatch.',
      ctaLabel: 'Get in touch →',
    },
    statement: {
      headingPlain: 'University of Delhi grad and gimbal lover turned',
      headingAccent: 'DOP & editor',
      paragraphs: [
        'I started out editing — cutting other people’s footage and learning exactly which shots make a sequence sing. That pulled me behind the camera, and I’ve been chasing movement ever since.',
        'Today I work across music videos, short films, series and commercials as a director of photography, and I still edit and grade much of what I shoot. One set of eyes from first frame to final export.',
        'When I’m not on set, I’m posting frames to the grid, testing new rigs and rewatching the scenes that made me want to do this in the first place.',
      ],
      aside: '(yes, the gimbal comes everywhere)',
    },
    credits: {script: 'the', heading: 'Credits', imdbLabel: 'Full list on IMDb ↗', imdbUrl: 'https://www.imdb.com/name/nm11732285/'},
    finale: {script: 'find the frame', sub: '(no one else is looking for)'},
  },
  contact: {
    script: 'get in',
    heading: 'Touch',
    intro: 'Films, commercials, music videos — tell me what you’re making and when.',
    form: {
      heading: 'The brief',
      typeQuestion: 'what are we making?',
      nameLabel: 'your name',
      contactLabel: 'email or phone',
      datesLabel: 'dates & location',
      briefLabel: 'the idea, references, budget',
      submitLabel: 'Send it →',
    },
    success: {script: 'that’s a wrap', body: 'Thanks — we’ll get back to you within two working days.', resetLabel: 'Send another'},
  },
} as const

/** Fixed image slots → placeholder key (spec §3.5). */
export const SLOT_IMAGE = {
  menuPhoto: 'C',
  heroMain: 'A',
  heroPolaroidLeft: 'J',
  heroPolaroidRight: 'T',
  introA: 'K',
  introB: 'H',
  currentlyBg: 'R',
  showreelPoster: 'L',
  aboutPortrait: 'N',
  aboutPolaroid: 'C',
  aboutFinaleBg: 'E',
  contactPhoto: 'K',
} as const

export const SLOT_ALT: Record<keyof typeof SLOT_IMAGE, string> = {
  menuPhoto: 'Behind the scenes photo',
  heroMain: 'Wide 16:9 hero frame',
  heroPolaroidLeft: 'Behind the scenes loop',
  heroPolaroidRight: 'Film still',
  introA: 'Portrait on set',
  introB: 'Camera rig close-up',
  currentlyBg: 'Full-bleed wide frame',
  showreelPoster: 'Showreel poster frame',
  aboutPortrait: 'Portrait of Shakir',
  aboutPolaroid: 'Behind the scenes loop',
  aboutFinaleBg: 'Full-bleed wide frame',
  contactPhoto: 'Photo behind the camera',
}
