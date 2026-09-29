# Vazeer Art Portfolio — Design Spec

**Date:** 2026-09-29
**Status:** Approved in conversation, awaiting written review
**Source design:** `design-reference/original.html` (Claude Design export, "Vazeer Art Portfolio")
**Client:** Vazeer Art (Shakir Ali), DOP / editor, New Delhi

---

## 1. Goal

Rebuild the Claude Design prototype as a production website whose look and
motion are identical to the prototype, where every visible string and every
image is editable from a separate admin, where new projects, frames, skills
and similar list items can be added without a deploy, and whose monthly
running cost is ₹0.

### Success criteria

- Side-by-side visual parity with `original.html` at 1440, 1024 and 390 px wide
  on every screen, verified by automated screenshot diff with animations frozen.
- Every animation in §3.3 reproduced with the same constants and mechanism.
- Every string and image in the prototype is a field in the admin. Every list in
  the prototype is an addable, orderable list in the admin.
- A publish in the admin is visible on the live site within a minute, with no
  rebuild.
- Lighthouse mobile performance ≥ 90 on the home page.
- Monthly bill: ₹0 (Sanity Free, Vercel Hobby).

### Non-goals

- Adding new *kinds* of sections or pages from the admin. The five routes and
  their section order are fixed in code. Only content within them is editable.
- E-commerce, blogs, comments, multi-language.
- Instagram API sync. Frames are uploaded manually.
- Emailing form submissions. Submissions are stored in the admin only (user decision).

---

## 2. Decisions already made

| Topic | Decision | Reason |
|---|---|---|
| Stack | Next.js 16 App Router + Sanity (Content Lake + Studio) + Vercel | Fastest static site, zero servers, best editor UX, roomiest free tiers |
| Admin | Sanity Studio v6 (6.16 at time of writing) in its own package, deployed to `*.sanity.studio` | Genuinely separate admin, free hosting |
| Toolchain | Node 22 LTS via nvm (`.nvmrc` = `22`); Studio v6 requires Node ≥ 22.12, next-sanity 13 requires ≥ 20.19 or ≥ 22.12 | Machine has nvm with v22.14.0 installed |
| Library versions | next 16.3.x · next-sanity 13.3.x · sanity 6.16.x · @sanity/image-url 2.1.x (named export `createImageUrlBuilder`) · @sanity/orderable-document-list 2.0.x | Verified against npm registry 2026-09-29; pin in lockfiles |
| Motion libraries | None. CSS keyframes + 3 small hooks | Prototype uses no GSAP/Lenis; adding them changes the feel |
| Video | YouTube / Vimeo URL per project and for showreel; in-page lightbox | ₹0 bandwidth, real player |
| Contact form | Stored as `inquiry` documents in Sanity, no email | User decision |
| Live preview | Sanity Presentation tool with click-to-edit overlays | Editor is non-technical |
| Sanity project | org `o7fleb6ka`, project `iq6do512`, dataset `production` (assumed, verify in Task 0) | Provided by user |
| Package manager | npm, two independent packages, no workspace tool | Matches user's habit, minimal tooling |
| Styling | CSS Modules generated from the prototype's inline styles by a one-off script | Removes transcription error, keeps exactness |
| Fonts | `next/font/google`: Anton 400, Bodoni Moda italic 400, Instrument Sans 400/600, Mrs Saint Delafield 400 | Self-hosted at build, no layout shift |

---

## 3. Source design analysis

### 3.1 What the file is

`original.html` is a 5.3 MB self-unpacking bundle. Its payload:

| Piece | Extracted to | Notes |
|---|---|---|
| Component logic (React 18 class) | `design-reference/design-source.jsx` | routing state, parallax, reveal, timecode, data |
| Markup with inline styles + `sc-if`/`sc-for` directives | `design-reference/markup.html` | 568 lines, pretty-printed |
| 13 keyframes + base rules | `design-reference/keyframes.css` | copy verbatim |
| 22 Unsplash JPEG placeholders | `design-reference/images/*.jpg` + `images.json` | seed data |
| 15 woff2 font files | not extracted | replaced by `next/font/google` |
| React 18 UMD + Claude Design runtime | not extracted | replaced by Next.js |

Runtime-only features that must be translated:

- `style-hover="…"` attribute → CSS `:hover` classes (§5.2).
- `<image-slot>` custom element → `next/image` via `<SanityImage>` (§8).
- `sc-if` / `sc-for` → JSX conditionals and `.map()`.
- `sc-camel-on-click` → `onClick` / `<Link>`.
- `window.__resources` image lookup → Sanity asset references.

### 3.2 Screens

Prototype routes by component state persisted in localStorage. Six screens:

| # | Screen | Sections (top to bottom) |
|---|---|---|
| 01 | Home | Hero (5 parallax layers) · Marquee · Intro · Selected reels rail · Explore grid (3) · Currently CTA |
| 02 | Work & Reels | Title + filters · Showreel poster + play · Project list (alternating) · Special skills (4 tilted tiles) |
| 03 | Project | Back link · Title block · 2.39:1 cover with REC + timecode HUD · role/format/year · Frame grabs grid · Up next |
| 04 | Frames | Title block · CSS-columns masonry of 12 frames with mixed ratios |
| 05 | About | Portrait collage + bio · Statement (cream) · Credits list · Full-bleed finale |
| 06 | Contact | Title + intro + photo + links · Form (type chips + 4 fields) · Sent state |

Global chrome on every screen: sticky blurred header, cream full-screen menu
overlay, pre-footer with 3 cross-links (excludes current page), footer, film
grain overlay, 3-2-1 leader intro once per session.

### 3.3 Motion inventory (must match exactly)

| Effect | Mechanism in prototype | Constants |
|---|---|---|
| Leader intro | `setTimeout` chain, `sessionStorage['vazeer-leader']` gate, `props.intro` toggle | 3 at 0 ms, 2 at 700, 1 at 1400, fade-out at 2100, unmount at 2700; overlay `transition: opacity .6s`; ring `spin .7s linear infinite` |
| Hero parallax | rAF loop; `mx,my = clientX/W-.5, clientY/H-.5`; `cx += (mx-cx)*0.08`; `sy = min(scrollY,1200)`; `translate3d(cx*d*28, cy*d*20 + sy*k, 0)` per `[data-depth=d][data-scroll=k]` | layers: glow d=.2 k=.1 · big word d=.4 k=.35 · 16:9 frame d=1 k=-.12 · stroke word d=.4 k=.35 · polaroid L d=2 k=-.45 · polaroid R d=1.6 k=-.25 |
| Hero entrances | CSS keyframes with delays | `rise 1.3s cubic-bezier(.2,.8,.2,1) both .15s` (both word layers) · `popin 1.2s … .45s` (frame) · script "art" `popin 1s … 1.2s` · polaroid L `dropin 1s … .8s, float 7s ease-in-out 2s infinite` · polaroid R `dropin 1s … 1s, float 8s ease-in-out 2.4s infinite` · glow `glow 6s ease-in-out infinite` |
| Ken Burns | `kenburns Ns ease-in-out infinite alternate` on inner wrapper | hero 16s · currently 20s · showreel 22s · project cover 18s · about finale 22s |
| Marquee | `marquee 28s linear infinite`, list rendered twice | 5 words × 2; separator is script "&" |
| Scroll reveal | IntersectionObserver `threshold .12`; skip if `top < innerHeight*.92` at scan; `opacity 0 → 1`, `translate 0 56px → 0 0`; `transition 1s cubic-bezier(.2,.8,.2,1)` with delay `(i%3)*0.08s`; rescan after every render | `[data-reveal]` elements |
| Page enter | `pagein .8s cubic-bezier(.2,.8,.2,1) both` on each `<main>` | replays on every screen change |
| Timecode HUD | `setInterval 40ms`; `f = floor(elapsed/40)`; `HH:MM:SS:FF` with FF = f%25 | all `[data-tc]` |
| REC dot | `recblink 1s steps(1) infinite` | #e5382b |
| Grain | fixed overlay, `opacity .07`, SVG `feTurbulence baseFrequency .85 numOctaves 3`, `grainshift .5s steps(4) infinite` | `props.grain` toggle |
| Play button | `pulse 2.4s ease-in-out infinite` | showreel |
| Hover | `style-hover` | `color:#e8a24a` (18×) · `color:#a4501a` (5×) · `transform:translateY(-8px)` (explore cards, `transition: transform .3s`) · `background:#a4501a` (2 CTAs) |
| Explore/menu/card hovers | as above | |
| Scroll to top on navigation | `window.scrollTo(0,0)` in `go()` | Next.js default behaviour |

Leader ↔ hero interaction: the prototype does **not** render Home while the
leader is showing (`isHome = page==='home' && !(leaderOn && !leaderOut)`), so
hero entrance animations start when the leader begins fading (t = 2100 ms).
This timing must be preserved (§5.4).

### 3.4 Visual tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0f0d0b` | page background |
| `--cream` | `#efe7da` | text on dark, cream sections background |
| `--amber` | `#e8a24a` | accent on dark |
| `--rust` | `#a4501a` | accent on cream |
| `--card` | `#1c1916` | image placeholders on dark |
| `--ink` | `#14110e` | text on cream |
| `--muted` | `#b9b0a2` | secondary text on dark |
| `--muted-2` | `#5e564c` | secondary text on cream |
| `--body-dark` | `#3d372f` | body text on cream |
| `--cream-2` | `#d9d0c1` | image placeholders on cream |
| `--rec` | `#e5382b` | REC dot |
| polaroid border | `#efe7da` 7 px on dark, `#fff` 8 px on cream | |
| container | `max-width:1480px; padding: 0 clamp(16px,4vw,48px)` | |
| header height | 72 px | |
| body font | Instrument Sans 17px / 1.6 | |
| labels | 12–13px 600 `letter-spacing:.2em` uppercase | |

The prototype has **no media queries**. All responsiveness is via `clamp()`,
`min()`, `max()`, `aspect-ratio`, `repeat(auto-fit, minmax(min(100%,Npx),1fr))`
and `column-width`. The port keeps this approach; it does not add breakpoints.

### 3.5 Content inventory

See §6 for the schema this maps to. Prototype data (used verbatim by the seed):

**Projects (order):**

| n | slug | title | format | year | role | category |
|---|---|---|---|---|---|---|
| 01 | pagal | Pagal | Music Video | 2022 | Director of Photography | DOP |
| 02 | dehleez | Dehleez | TV Mini Series | 2022 | Director of Photography | DOP |
| 03 | chakk-ke-glass | Chakk ke Glass | Short Film | 2021 | Director of Photography | DOP |
| 04 | booti-shake | Booti Shake | Music Video | 2020 | Editor | Editor |
| 05 | love-marriage | Love Marriage | Music Video | 2020 | Editor | Editor |

**Marquee words:** Films · Commercials · Music Videos · Colour · The Edit

**Explore cards:** Work & Reels / "watch" → `/work` · Frames / "browse" → `/frames` · Get in touch / "book" → `/contact`

**Skills:** gimbal (−3°) · colour grading (2°) · the edit (−2°) · music videos (3°)

**Pages (nav order home, about, work, frames, contact):**

| key | nav label | pre-footer script / label |
|---|---|---|
| home | Home | — |
| about | About | learn more / About me |
| work | Work & Reels | watch the / Reels |
| frames | Frames | browse the / Frames |
| contact | Contact | get in / Touch |

**Form type chips:** Music video · Commercial · Film / Series · Edit only

**Socials:** Instagram `https://www.instagram.com/vazeerart/` · Facebook `https://www.facebook.com/vazeerart/` · IMDb `https://www.imdb.com/name/nm11732285/` · TikTok `https://www.tiktok.com/@vazeerart`
**Management:** @prachar.it → `https://www.instagram.com/prachar.it/` · **DM:** @vazeerart

**Leader:** "Vazeer Art" ● "Showreel 2026", skip label "Skip →"

**Frames ratios (12, in order):** 4/5, 9/16, 4/5, 1/1, 4/5, 9/16, 4/5, 4/5, 1/1, 9/16, 4/5, 4/5

**Image slot → placeholder key** (keys refer to `design-reference/images/images.json`):

| Slot | Key | Slot | Key |
|---|---|---|---|
| menu-photo | C | showreel poster | L |
| hero-main (16:9) | A | about portrait | N |
| hero polaroid L ("BTS GIF") | J | about polaroid ("BTS GIF") | C |
| hero polaroid R ("Film still") | T | about finale bg | E |
| intro-a | K | contact photo | K |
| intro-b | H | explore work / frames / contact | B / T / L |
| currently bg | R | skills 1–4 | O / W / G / M |
| covers pagal / dehleez / chakk / booti / love | A / M / S / D / P | frames 1–12 | C E F J K N S P Q T V W |

Frame grabs per project = `grabPool[(i*3+n) % 16]` with
`grabPool = [C,E,F,G,H,I,J,K,N,O,Q,R,T,V,W,L]`:
pagal C E F G · dehleez G H I J · chakk J K N O · booti O Q R T · love T V W L.

All long-form copy (bio paragraphs, CTA labels, headings) is taken verbatim
from `design-reference/markup.html` by the seed script. Unsplash credit lines
are **not** carried into the site; they exist only in `images.json`.

---

## 4. Architecture

### 4.1 Repository layout

```
vazeer_web/
├── web/                       Next.js 16 public site
│   ├── app/
│   │   ├── layout.tsx         fonts, chrome, providers
│   │   ├── page.tsx           Home
│   │   ├── work/page.tsx      Work & Reels (reads ?filter=)
│   │   ├── work/[slug]/page.tsx
│   │   ├── frames/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── not-found.tsx      styled 404
│   │   ├── sitemap.ts, robots.ts
│   │   └── api/
│   │       ├── inquiry/route.ts        POST form → Sanity
│   │       ├── draft-mode/enable/route.ts   Presentation tool
│   │       └── revalidate/route.ts     webhook fallback
│   ├── components/
│   │   ├── chrome/     Header, MenuOverlay, PreFooter, Footer, Grain, Leader
│   │   ├── motion/     ParallaxLoop, RevealObserver, Timecode, Lightbox
│   │   ├── media/      SanityImage, MediaSlot (image | gif | mp4 loop), PlayButton
│   │   └── sections/   one folder per prototype section (Hero, Marquee, Intro, ReelsRail, Explore, Currently, WorkHeader, Showreel, ProjectList, Skills, ProjectHero, FrameGrabs, UpNext, FramesGrid, AboutHero, Statement, Credits, Finale, ContactIntro, BriefForm)
│   ├── lib/
│   │   ├── sanity/     client.ts, live.ts, queries.ts, image.ts, types.ts (generated)
│   │   ├── motion/     constants.ts, timecode.ts, parallax.ts
│   │   ├── video.ts    YouTube/Vimeo URL → embed
│   │   └── viewmodel/  filters, alternation, nextProject
│   ├── styles/         tokens.css, keyframes.css, hover.css, globals.css
│   └── tests/          unit, component, e2e (Playwright)
├── studio/                    Sanity Studio v4
│   ├── sanity.config.ts       structureTool + presentationTool
│   ├── schemas/               documents/, objects/, index.ts
│   ├── structure.ts           sidebar with pinned singletons
│   ├── presentation/          locations resolver, main document resolver
│   └── scripts/seed.ts        creates all documents + uploads placeholders
├── design-reference/          see §3.1
└── docs/superpowers/specs/
```

### 4.2 Data flow

```
Studio (vazeerart.sanity.studio)
   │ publish
   ▼
Sanity Content Lake  ──Live Content API──▶  <SanityLive/> in web  ──▶ revalidate tags ──▶ fresh static HTML
   │                                                                     (seconds, no rebuild)
   │ draft perspective (token)          Presentation tool iframe ──▶ /api/draft-mode/enable ──▶ drafts rendered
   ▼
Sanity Image CDN  ◀── next/image custom loader (w, q=65, auto=format, fit=max, hotspot crop)
```

Site fetches with `next-sanity`'s `defineLive({ client, serverToken, browserToken })`
→ `sanityFetch({ query, params })` in server components. `<SanityLive />` in
the root layout subscribes to content events and triggers revalidation of the
affected sync tags. In draft mode (Presentation tool), `sanityFetch` returns
drafts with stega encoding for click-to-edit overlays via `<VisualEditing />`.

The Live Content API is included on all Sanity plans including Free. Fallback
if it proves unstable: GROQ-powered webhook on publish → `POST /api/revalidate`
(signature checked with `parseBody` from `next-sanity/webhook`) →
`revalidatePath('/', 'layout')`, which refreshes every route. The route ships
from day one; the webhook is only created if needed.

---

## 5. Frontend implementation

### 5.1 Routing and layout

| Route | Data | Notes |
|---|---|---|
| `/` | homePage, siteSettings, projects(showOnHome) | hero animations held during leader (§5.4) |
| `/work` | workPage, projects(all with page) | `?filter=all\|cinematography\|editing`; default `all`. The page itself stays static: it never reads `searchParams` on the server. A client `<ProjectList>` (wrapped in `<Suspense>`) reads `useSearchParams()` and filters the full list it received as props. Chips are `<Link href="/work?filter=…" scroll={false}>` so the state is shareable and survives back-navigation |
| `/work/[slug]` | project, next project by order (wraps) | `generateStaticParams` from all slugs; `notFound()` for unknown |
| `/frames` | framesPage, frames ordered | |
| `/about` | aboutPage, projects (credits, includes credit-only) | |
| `/contact` | contactPage, siteSettings | form is a client component |

Root layout renders, in this order: `<Leader/>`, `<Header/>`, `<MenuOverlay/>`,
`{children}`, `<PreFooter/>`, `<Footer/>`, `<Grain/>`, `<ParallaxLoop/>`,
`<RevealObserver/>`, `<Timecode/>`, `<SanityLive/>`, and `<VisualEditing/>`
when draft mode is on. Chrome components are server components with small
client islands for interactivity.

Each page's `<main>` carries the `pagein` class. Because pages remount on
navigation, the animation replays exactly like the prototype. The pre-footer
uses `usePathname()` to exclude the current page and shows the first 3 of the
remaining 4 in the prototype's order (about, work, frames, contact).

Header nav shows pages 2–5 (about, work, frames, contact) with the active one
in `#e8a24a`; a project page marks `work` active. The menu overlay lists all 5.

### 5.2 Styling strategy

- A one-off Node script (`tools/extract-styles.mjs`, run once, committed for
  audit) parses `design-reference/markup.html`, assigns a class name per
  element, and emits (a) a CSS Module per section with the inline declarations
  verbatim and (b) a JSX skeleton with the class names and text/`{{ }}`
  bindings as placeholders. Engineers then wire props into the skeleton. No
  style values are retyped by hand.
- `styles/keyframes.css` = `design-reference/keyframes.css` verbatim.
- `styles/hover.css` defines four classes: `.hoverAmber:hover{color:#e8a24a}`,
  `.hoverRust:hover{color:#a4501a}`, `.hoverLift:hover{transform:translateY(-8px)}`,
  `.hoverBgRust:hover{background:#a4501a}`. Base rules from keyframes.css
  (`a:hover`, `::selection`, `html,body`) go in `globals.css`.
- `styles/tokens.css` exposes §3.4 as CSS custom properties. Generated modules
  keep literal hex values so the diff against the prototype stays trivial;
  tokens exist for new code (lightbox, 404, play button on project cover).
- Fonts: `next/font/google` in `layout.tsx` with `variable` CSS vars
  `--font-anton`, `--font-bodoni`, `--font-instrument`, `--font-delafield`;
  the extraction script rewrites `font-family:'Anton',sans-serif` to
  `font-family:var(--font-anton),sans-serif`, etc.
- Selection, scrollbar hiding on the reels rail (`scrollbar-width:none`) and
  `overflow-x:hidden` on the page wrapper are preserved.

### 5.3 Motion hooks

`lib/motion/constants.ts` holds every number from §3.3 as named constants with
a comment citing the prototype. Components must import from it.

- **`<ParallaxLoop/>`** (client, in layout): one `requestAnimationFrame` loop
  over `document.querySelectorAll('[data-depth]')`, identical math. Listens to
  `mousemove` on `window`. No-ops when `prefers-reduced-motion: reduce`.
  Touch devices: mouse offsets stay 0, scroll term still applies (as prototype).
- **`<RevealObserver/>`** (client, in layout): scans `[data-reveal]:not([data-rv])`
  on mount, on `pathname` change, and via a `MutationObserver` on `<main>`
  subtree changes (covers the Work filter). Identical thresholds, transitions
  and stagger.
- **`<Timecode/>`** (client, in layout): single 40 ms interval writing to all
  `[data-tc]`; unmounts when none exist. Pure formatter in `lib/motion/timecode.ts`.
- **`<Leader/>`** (client, in layout): renders only when `siteSettings.showIntro`
  and `sessionStorage['vazeer-leader'] !== '1'`. Same timeouts; sets
  `document.documentElement.dataset.leader = 'on' | 'out' | ''`.
- **`<Lightbox/>`**: fixed `inset:0`, `background:rgba(15,13,11,.96)`, 16:9
  iframe `max-width: min(92vw, calc(88vh*16/9))`, close button top-right using
  the prototype's label style, Escape closes, focus trapped, body scroll locked,
  `popin` on open. Embeds `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0`
  or `https://player.vimeo.com/video/{id}?autoplay=1`.

### 5.4 Leader ↔ hero timing

The hero is server-rendered for SEO and LCP. While `html[data-leader="on"]`,
`.hero [data-hero-anim]` elements have `animation-play-state: paused`. When the
leader flips to `out` (t = 2100 ms) the attribute changes and animations run
from their start, under the fading overlay. Repeat visitors (sessionStorage
set) never get the attribute, so animations run on load, as in the prototype.

### 5.5 Reduced motion

Under `@media (prefers-reduced-motion: reduce)`: leader skipped, parallax loop
disabled, `kenburns`, `float`, `glow`, `grainshift`, `marquee` and `pulse`
animations set to `none`, reveal shows elements immediately. This is the only
intentional deviation from the prototype and applies only to users who opt in
at OS level.

### 5.6 Video

- `lib/video.ts`: `parseVideoUrl(url) → { provider: 'youtube'|'vimeo', id } | null`.
  Accepts `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`,
  `youtube.com/embed/`, `vimeo.com/{id}`, `player.vimeo.com/video/{id}`.
- Work page showreel: existing poster + pulsing play button → opens lightbox
  with `workPage.showreel.videoUrl`. If no URL, the button is not rendered.
- Project page: the 2.39:1 cover gains the same pulsing play button centred,
  rendered only when `project.videoUrl` parses. HUD (REC + timecode + "2.39 : 1")
  stays. Click → lightbox.
- Home reels rail and Work project list navigate to the project page (as prototype).

### 5.7 Contact form

Client component posting JSON to `POST /api/inquiry`:

```json
{ "type": "Music video", "name": "…", "contact": "…", "dates": "…", "brief": "…", "website": "" }
```

`website` is a honeypot; non-empty → `200 {ok:true}` without writing. Server
validates with zod (name 1–120, contact 3–200, dates ≤ 200, brief ≤ 4000, type
must be one of `contactPage.types`), then `client.create({_type:'inquiry', …,
receivedAt: now, read: false})` using `SANITY_API_WRITE_TOKEN` (Editor role,
server-only). Errors → `400` with field errors; the form shows inline messages
in the prototype's label style. Success → the prototype's "that's a wrap" block.

### 5.8 SEO and metadata

- `generateMetadata` per route from the document's `seo` object, falling back
  to `siteSettings.seo`. OG image = `seo.image` or the page's first hero image
  via Sanity CDN at 1200×630.
- `sitemap.ts` lists the 5 routes + all project slugs; `robots.ts` allows all.
- `not-found.tsx` styled with the prototype's title block (Anton + script accent).
- JSON-LD `Person` on `/about` (name, jobTitle, sameAs socials) — small, cheap.

---

## 6. Content model (Sanity schemas)

Conventions: every image is `image` with `hotspot: true` plus required `alt`
string. Every list is an `array` with drag ordering. Strings that the prototype
renders as a script accent are separate fields named `*Script`. Headings with
an inline accent are split into `*Plain` + `*Accent`. All fields have a
`description` telling the editor where it appears.

### 6.1 Objects

- **`mediaSlot`** — `{ kind: 'image'|'video', image?: image, video?: file(mp4/webm), alt }`.
  Used for the three polaroid "BTS GIF" slots and skills tiles. Image kind with
  a GIF asset is served untransformed (§8).
- **`seo`** — `{ title, description, image }`.
- **`link`** — `{ label, url }`.
- **`pageEntry`** — `{ key: 'home'|'about'|'work'|'frames'|'contact' (readOnly), navLabel, menuLabel, preFooterScript, preFooterLabel }`.
- **`exploreCard`** — `{ label, sub, image, target: 'work'|'frames'|'contact'|'about' }`.
- **`skill`** — `{ label, media: mediaSlot, tilt: number (deg) }`.
- **`headingBlock`** — `{ script, heading }` (e.g. "now showing" / "Selected reels").

### 6.2 Singletons (fixed `_id`, not creatable or deletable in Studio)

**`siteSettings`**
`brandWord` ("Vazeer") · `brandScript` ("art.") · `copyright` · `socials: link[]` ·
`management: {label:'management', handle:'@prachar.it', url}` · `dm: {label:'dm me', handle:'@vazeerart', url}` ·
`marqueeWords: string[]` · `pages: pageEntry[5]` · `leaderLeft` ("Vazeer Art") · `leaderRight` ("Showreel 2026") · `leaderSkip` ("Skip →") ·
`menuScript` ("menu") · `menuClose` ("Close ✕") · `menuSocialsLabel` ("follow on socials /") · `menuPhoto: image` ·
`showIntro`, `showMarquee`, `showGrain`, `showRec: boolean` · `seo`.

**`homePage`**
`hero: { word ("Vazeer"), script ("art"), mainImage, polaroidLeft: mediaSlot, polaroidRight: mediaSlot }` ·
`intro: { script ("hey, i'm"), heading ("Vazeer Art"), subline ("(Shakir Ali, if we're being formal)"), body: text, ctaLabel ("More about me →"), imageA, imageB }` ·
`reels: headingBlock ("now showing"/"Selected reels") + ctaLabel ("All work & reels →")` ·
`explore: headingBlock ("explore"/"The work") + cards: exploreCard[]` ·
`currently: { script ("currently"), heading, body: text, ctaLabel ("Start a project →"), bgImage }` · `seo`.

**`workPage`**
`title` ("Work") · `script` ("& reels") · `intro` (italic line) · `filterAll`, `filterDop`, `filterEditor` labels ·
`showreel: { poster: image, videoUrl: url, label ("Showreel"), orderNotePrefix ("in order of appearance:"), orderNoteOverride?: string }` ·
`numberPrefix` ("no.") · `projectCta` ("Watch & view frames →") · `skills: headingBlock ("on set"/"Special skills") + items: skill[]` ·
`projectPage: { backLabel ("← Work & reels"), reelPrefix ("reel no."), roleLabel ("role"), formatLabel ("format"), yearLabel ("year"), aspectLabel ("2.39 : 1"), grabsScript ("frame"), grabsHeading ("Grabs"), upNextScript ("up next") }` · `seo`.

**`framesPage`**
`script` ("straight from the grid") · `heading` ("Frames") · `linkLabel` ("(follow along @vazeerart ↗)") · `linkUrl` · `reelLabel` ("Reel cover") · `postLabel` ("Instagram post") · `seo`.

**`aboutPage`**
`hero: { script, heading, body: text, ctaLabel, portrait: image, polaroid: mediaSlot }` ·
`statement: { headingPlain ("University of Delhi grad and gimbal lover turned"), headingAccent ("DOP & editor"), paragraphs: text[], aside ("(yes, the gimbal comes everywhere)") }` ·
`credits: headingBlock ("the"/"Credits") + imdbLabel ("Full list on IMDb ↗") + imdbUrl` ·
`finale: { script ("find the frame"), sub ("(no one else is looking for)"), bgImage }` · `seo`.

**`contactPage`**
`script` ("get in") · `heading` ("Touch") · `intro` (italic) · `photo: image` ·
`form: { heading ("The brief"), typeQuestion ("what are we making?"), types: string[], nameLabel, contactLabel, datesLabel, briefLabel, submitLabel ("Send it →") }` ·
`success: { script ("that's a wrap"), body, resetLabel ("Send another") }` · `seo`.

### 6.3 Collections

**`project`** (orderable via `@sanity/orderable-document-list`)
`title` · `slug` (from title) · `format` ("Music Video") · `year` (string, 4 digits) · `role` ("Director of Photography") ·
`category: 'dop'|'editor'` (drives filters and the `roleShort` label: DOP / Editor) ·
`cover: image` · `frameGrabs: image[]` (any count; prototype shows 4) · `videoUrl: url?` ·
`showOnHome: boolean` (default true) · `creditOnly: boolean` (default false; true → appears in About credits only, no page, no listing) · `seo`.
Derived at render, always over the ordered list of projects with `creditOnly=false` ("page projects"): `n` = 1-based index in that list, padded to 2 (shown as "no. 01" and "reel no. 01") · `formatLower` · next project = following page project, wrapping to the first · showreel order note = page-project titles joined by ", " unless `orderNoteOverride` · home rail = page projects with `showOnHome=true` · About credits = **all** projects including `creditOnly`, in order, where credit-only rows are not clickable.

**`frame`** (orderable)
`image` · `ratio: '4/5'|'9/16'|'1/1'|'16/9'` · `instagramUrl?: url` · derived label: 9/16 → "Reel cover", else "Instagram post".

**`inquiry`** (created by site; read-only fields in Studio except `read`)
`type` · `name` · `contact` · `dates` · `brief` · `receivedAt: datetime` · `read: boolean`.

### 6.4 Validation

- Required: every string the prototype renders, every image, `slug`, `category`, `ratio`.
- `videoUrl` must parse via the same rules as `lib/video.ts` (custom rule).
- `pages` array is locked to exactly 5 entries with fixed keys (array `validation` + `readOnly` key).
- `tilt` between −15 and 15.
- `year` matches `/^\d{4}$/`.

---

## 7. Studio

- **Structure:** Site settings · Home · Work · Frames page · About · Contact
  (singletons, each `S.document().documentId(...)`) · divider · Projects
  (orderable list) · Frames (orderable list) · Inquiries (newest first, unread
  badge via title preview).
- **Singleton enforcement:** `document.newDocumentOptions` filters singleton
  types out of "Create"; `document.actions` removes delete/duplicate/unpublish
  for singleton types; `inquiry` has no create action in the UI.
- **Presentation tool:** `presentationTool({ previewUrl: { origin, previewMode: { enable: '/api/draft-mode/enable' } }, resolve: { locations, mainDocuments } })`.
  Locations: `project` → `/work/{slug}` and `/work`, `/`, `/about`; `frame` → `/frames`;
  each page singleton → its route; `siteSettings` → all routes.
- **Preview config:** every document type has `preview.select` producing a
  helpful title/subtitle/media (project: title + "format, year", media cover;
  frame: ratio label, media image; inquiry: name + type, subtitle receivedAt).
- **Typegen:** `sanity schema extract` + `sanity typegen generate` output
  `web/lib/sanity/types.ts`; queries in `queries.ts` use `defineQuery`.
- **Seed:** `studio/scripts/seed.ts` (run with `npx sanity exec --with-user-token`)
  uploads the 22 placeholders from `design-reference/images`, creates all
  singletons and collections with §3.5 data and the copy from `markup.html`,
  idempotently (`createOrReplace` with deterministic `_id`s).
- **Deploy:** `npx sanity deploy` → hostname `vazeerart` → `https://vazeerart.sanity.studio`.

---

## 8. Images and media

- `<SanityImage>` wraps `next/image` with `loader` from `lib/sanity/image.ts`:
  `@sanity/image-url` builder → `.width(w).quality(65).auto('format').fit('max')`
  honoring hotspot/crop. `next.config.ts`: `images: { loader: 'custom', loaderFile: './lib/sanity/image-loader.ts' }`
  so Vercel's optimizer is never used.
- `sizes` per slot follows the prototype's rendered widths (hero main
  `min(94vw, 1180px)`, rail cards `clamp(280px,40vw,600px)`, frames `280px`
  columns, etc.). Hero main image is `priority`.
- `<MediaSlot>`: `kind='video'` renders `<video autoplay muted loop playsinline>`
  with the file URL; `kind='image'` with `asset->extension == 'gif'` renders a
  plain `<img>` with `asset->url` (no transforms, keeps animation); otherwise
  `<SanityImage>`. Sanity's CDN does preserve GIF animation under transforms
  (up to 256 megapixel-frames, per its 2024 changelog), but `auto=format` may
  re-encode; serving the original keeps behaviour predictable and costs nothing.
- Full-bleed Ken Burns images render `fill` with `object-fit: cover` inside the
  prototype's wrapper.

---

## 9. Deployment, environments, accounts

| Item | Value |
|---|---|
| Vercel project | root directory `web`, framework Next.js, Node 20 |
| Studio hosting | Sanity (`vazeerart.sanity.studio`) |
| Sanity CORS origins | `http://localhost:3000`, `https://<prod-domain>`, Vercel preview wildcard as needed (credentials allowed for Live API) |
| Sanity tokens | `SANITY_API_READ_TOKEN` (Viewer, drafts for Presentation) · `SANITY_API_WRITE_TOKEN` (Editor, inquiries only) |
| Env (web) | `NEXT_PUBLIC_SANITY_PROJECT_ID=iq6do512` · `NEXT_PUBLIC_SANITY_DATASET=production` · `NEXT_PUBLIC_SANITY_API_VERSION=2026-09-29` · `NEXT_PUBLIC_SITE_URL` · `SANITY_API_READ_TOKEN` · `SANITY_API_WRITE_TOKEN` · `SANITY_REVALIDATE_SECRET` |
| Env (studio) | `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_PREVIEW_URL` |
| Ownership | Recommended: Vercel project and domain under Vazeer's own account (Hobby is for personal use). Sanity project already exists in org `o7fleb6ka`. |
| Cost | ₹0 within Sanity Free (20 seats, 10k docs, 100 GB assets + bandwidth, 1M CDN req/mo) and Vercel Hobby (100 GB bandwidth) |

`web/.env.example` and `studio/.env.example` are committed; real `.env*` are gitignored.

---

## 10. Testing

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | `timecode.ts` (frame math, padding, wrap at 24h) · `parallax.ts` (lerp, clamp at 1200, transform string) · `video.ts` (all URL shapes, rejects others) · `viewmodel/filters.ts` (category → visible, alternation only among visible) · `viewmodel/nextProject.ts` (wraps, skips creditOnly) · inquiry zod schema · image loader URL |
| Component | Vitest + React Testing Library | `Leader` (fake timers: 3/2/1 at 0/700/1400, out at 2100, gone at 2700, sessionStorage gate, `showIntro=false`) · `Lightbox` (Escape, backdrop click, focus, scroll lock) · `BriefForm` (type chips, validation errors, success state, honeypot) · `PreFooter` (excludes current page, first 3) |
| Route handler | Vitest | `/api/inquiry` with mocked Sanity client: valid → create called; honeypot → no create; invalid → 400 |
| Visual regression | Playwright | For each route × {1440, 1024, 390}: load original.html (via `file://`, drive its state machine with `localStorage['vazeer-v2-route']` and `sessionStorage['vazeer-leader']='1'`) and the Next site seeded with the same data; inject CSS `*{animation:none!important;transition:none!important}` and freeze `[data-tc]` to `00:00:00:00`; `toHaveScreenshot` with `maxDiffPixelRatio ≤ 0.01`. Also: menu overlay open, Work filtered by cinematography, contact sent state |
| Motion parity | Manual checklist + recorded GIF | one pass per §3.3 row, signed off before release |
| Studio | `sanity schema validate` + typegen in CI | schema/query drift fails the build |
| Performance | Lighthouse CI on `/` mobile | perf ≥ 90, CLS < 0.05 |

Playwright's `file://` comparison note: the bundle unpacks fonts and images from
its own payload, so it renders offline; the only external fetch is a Google
Fonts preconnect. If `file://` proves flaky, serve `design-reference/` with a
static server in the test setup.

---

## 11. Performance budget

- JS shipped to the browser on `/`: React + Next runtime + ~10 KB of motion and
  chrome islands + `SanityLive` client. No animation libraries.
- Fonts: 4 families, latin subset only, `display: swap`, preloaded by `next/font`.
- Images: AVIF/WebP via Sanity CDN, correct `sizes`, hero `priority`, everything
  else lazy.
- Grain: inline SVG data URI as in prototype (no network request).
- Static HTML for every route; Live API refresh is out-of-band.

---

## 12. Risks and open items

| Risk | Mitigation |
|---|---|
| Dataset name is not `production` | Task 0 verifies with `npx sanity datasets list` after login |
| Live Content API limits on Free plan | Webhook + `/api/revalidate` fallback ships in the same release |
| Sanity CDN flattens animated GIFs | `MediaSlot` serves GIF originals untransformed; MP4 loop option exists |
| Vercel Hobby non-commercial clause | Deploy under Vazeer's personal account; site is his personal portfolio |
| `file://` visual baseline flakiness | Static server fallback in Playwright setup |
| Style extraction script mis-parses an edge case | Script output is committed and reviewed; visual regression catches misses |
| Editor breaks layout with very long text | `text-wrap: pretty` and `clamp()` as in prototype; validation `max` lengths on headings (≤ 40 chars) and scripts (≤ 30) |

---

## 13. Out of scope for v1 (possible later)

- Email notifications for inquiries.
- Instagram auto-import for Frames.
- Per-project galleries beyond frame grabs, or long-form case-study text.
- Analytics (Vercel Analytics free tier can be toggled later).
- Additional locales.

---

## Appendix A — Extraction commands (reproducible)

The reference files were produced from the export with:

```bash
# /Users/vikrantchaudhary/Desktop/vazeer portfolios/vazeer_web/design-reference
F="original.html"
sed -n '382p' "$F" > /tmp/line382.txt   # JSON-encoded template (markup + fonts + x-dc script)
sed -n '370p' "$F" > /tmp/line370.txt   # manifest: base64 images, fonts, scripts
sed -n '374p' "$F" > /tmp/line374.txt   # uuid → resource id map
node -e '
const fs=require("fs");
const tpl=JSON.parse(fs.readFileSync("/tmp/line382.txt","utf8"));
const jsx=tpl.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
let x=tpl.slice(tpl.indexOf("<x-dc>")+6, tpl.lastIndexOf("</x-dc>"))
  .replace(/<helmet>[\s\S]*?<\/helmet>/,"").replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/,"")
  .replace(/></g,">\n<");
fs.writeFileSync("design-source.jsx",jsx); fs.writeFileSync("markup.html",x);
const styles=[...tpl.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
fs.writeFileSync("keyframes.css",styles[1]);'
```

## Appendix B — Keyframes (verbatim from prototype)

See `design-reference/keyframes.css`. Names: `recblink`, `marquee`, `rise`,
`dropin`, `popin`, `float`, `kenburns`, `pagein`, `spin`, `glow`, `scrollcue`
(unused in markup, keep for parity), `pulse`, `grainshift`.

## Appendix C — Prototype props → settings toggles

| Prototype prop | Setting | Default |
|---|---|---|
| `intro` | `siteSettings.showIntro` | true |
| `marquee` | `siteSettings.showMarquee` | true |
| `showRec` | `siteSettings.showRec` | true |
| `grain` | `siteSettings.showGrain` | true |
