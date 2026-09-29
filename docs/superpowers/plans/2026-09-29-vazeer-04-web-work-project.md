# Vazeer Art — Plan 04: Video Lightbox, Work & Reels, Project Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/work` (filters, showreel with a working play button, alternating project list, skills tiles) and `/work/[slug]` (cover with REC/timecode HUD and play button, meta row, frame grabs, up next), plus the YouTube/Vimeo lightbox they share.

**Architecture:** `lib/video.ts` parses provider URLs into embed URLs. `components/motion/VideoTrigger.tsx` is the one client island that owns the pulsing play button and the lightbox (portal, Escape, scroll lock). Work-page filtering is client-side over the full project list so `/work` stays static; the filter lives in `?filter=` via `useSearchParams` inside `<Suspense>`. Everything else is server components with verbatim CSS Modules.

**Tech Stack:** Next.js 16 App Router, React 19, CSS Modules, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-09-29-vazeer-portfolio-design.md` (§3.2 screens 02–03, §5.1, §5.3 Lightbox, §5.6, §6.3)

**Depends on:** Plan 03 (layout, SanityImage, view models).

## Global Constraints

- Same CSS rules as Plan 03: one verbatim class per prototype element; `asButton` on every navigating `<Link>` that was a `<button>`; hover classes as the prototype's `style-hover`; verify each section's range with `node tools/verify-styles.mjs --lines A-B`.
- `/work` never reads `searchParams` on the server. Filtering happens in a client component under `<Suspense>`.
- Video embeds use `youtube-nocookie.com` for YouTube and `player.vimeo.com` for Vimeo, always `autoplay=1`.
- The play button renders only when a video URL parses. The HUD renders only when `siteSettings.showRec` is true.
- Commit after every task; end commit bodies with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **`/work?filter=bogus`** → treated as `all`, no crash, "All" chip active. Task 2 tests `parseWorkFilter` through `WorkFilters`.
2. **Lightbox open, user presses Escape or clicks the backdrop** → closes, iframe unmounts (video stops), body scroll restored, focus returns to the play button. Task 1 tests all four.
3. **Project page for a credit-only or unknown slug** → 404, not a blank page. Task 3 tests that `pageProjects` excludes credit-only and the page calls `notFound()`.
4. **Filter leaves only one project visible** → it renders with `order: 0` (image first), no dangling alternation. Task 2 tests `alternateOrder(1)` in the list.
5. **Project with zero frame grabs** → the Grabs section is omitted entirely rather than rendering an empty grid. Task 3 tests it.

---

### Task 1: Video URL parsing, play button and lightbox

**Files:**
- Create: `web/lib/video.ts`
- Create: `web/components/motion/VideoTrigger.tsx`, `web/components/motion/VideoTrigger.module.css`
- Test: `web/lib/video.test.ts`, `web/components/motion/VideoTrigger.test.tsx`

**Interfaces:**
- Produces: `parseVideoUrl(url) → {provider, id, embedUrl} | null`, `<VideoTrigger embed title />` (renders the prototype's pulsing play button; opens the lightbox).

- [ ] **Step 1: Write the failing tests**

```ts
// web/lib/video.test.ts
import {describe, expect, it} from 'vitest'
import {parseVideoUrl} from './video'

describe('parseVideoUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=10', 'youtube', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://vimeo.com/123456789', 'vimeo', '123456789'],
    ['https://player.vimeo.com/video/123456789?h=abc', 'vimeo', '123456789'],
  ])('parses %s', (url, provider, id) => {
    expect(parseVideoUrl(url)).toMatchObject({provider, id})
  })

  it('builds privacy-enhanced autoplay embed urls', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1')
    expect(parseVideoUrl('https://vimeo.com/123456789')?.embedUrl).toBe('https://player.vimeo.com/video/123456789?autoplay=1')
  })

  it.each(['', null, undefined, 'https://www.dailymotion.com/video/x7', 'https://youtube.com/', 'not a url'])('rejects %s', (url) => {
    expect(parseVideoUrl(url as string)).toBeNull()
  })
})
```

```tsx
// web/components/motion/VideoTrigger.test.tsx
import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {VideoTrigger} from './VideoTrigger'

const embed = {provider: 'youtube' as const, id: 'dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1'}

describe('VideoTrigger', () => {
  it('opens a lightbox with the embed, locks scroll, and closes on Escape restoring focus', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    const play = screen.getByRole('button', {name: 'Play Showreel'})
    fireEvent.click(play)
    const dialog = screen.getByRole('dialog', {name: 'Showreel'})
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(embed.embedUrl)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Close ✕'}))
    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(play)
  })

  it('closes on backdrop click but not on clicks inside the player', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    fireEvent.click(screen.getByTestId('lightbox-player'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('lightbox-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run lib/video components/motion/VideoTrigger`
Expected: FAIL — modules not found.

- [ ] **Step 3: Video parser**

```ts
// web/lib/video.ts
export type VideoEmbed = {provider: 'youtube' | 'vimeo'; id: string; embedUrl: string}

const YT_ID = '([\\w-]{6,})'
const PATTERNS: {provider: VideoEmbed['provider']; re: RegExp}[] = [
  {provider: 'youtube', re: new RegExp(`^https?://(?:www\\.)?youtube\\.com/watch\\?(?:.*&)?v=${YT_ID}`, 'i')},
  {provider: 'youtube', re: new RegExp(`^https?://youtu\\.be/${YT_ID}`, 'i')},
  {provider: 'youtube', re: new RegExp(`^https?://(?:www\\.)?youtube\\.com/shorts/${YT_ID}`, 'i')},
  {provider: 'youtube', re: new RegExp(`^https?://(?:www\\.)?youtube(?:-nocookie)?\\.com/embed/${YT_ID}`, 'i')},
  {provider: 'vimeo', re: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d{6,})/i},
  {provider: 'vimeo', re: /^https?:\/\/player\.vimeo\.com\/video\/(\d{6,})/i},
]

/** Same acceptance rules as studio/lib/validation.ts — keep in sync. */
export function parseVideoUrl(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null
  for (const {provider, re} of PATTERNS) {
    const m = re.exec(url.trim())
    if (!m) continue
    const id = m[1]
    const embedUrl =
      provider === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
        : `https://player.vimeo.com/video/${id}?autoplay=1`
    return {provider, id, embedUrl}
  }
  return null
}
```

- [ ] **Step 4: VideoTrigger styles (play button verbatim from the showreel markup; lightbox per spec §5.3)**

```css
/* web/components/motion/VideoTrigger.module.css */
/* Prototype showreel play button (markup.html showreel <section>) */
.playWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.play{width:clamp(84px,9vw,132px);aspect-ratio:1;border-radius:50%;background:rgba(239,231,218,.92);animation:pulse 2.4s ease-in-out infinite;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;border:0;padding:0}
.triangle{width:0;height:0;border-left:26px solid #14110e;border-top:16px solid transparent;border-bottom:16px solid transparent;margin-left:8px}

/* Lightbox (new element, spec §5.3) */
.backdrop{position:fixed;inset:0;z-index:150;background:rgba(15,13,11,.96);display:flex;align-items:center;justify-content:center;padding:24px;animation:popin .5s cubic-bezier(.2,.8,.2,1) both}
.player{position:relative;width:min(92vw,calc(88vh * 16 / 9));aspect-ratio:16/9;background:#000;box-shadow:0 30px 80px rgba(0,0,0,.6);outline:1px solid rgba(239,231,218,.25);outline-offset:10px}
.iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.close{all:unset;cursor:pointer;position:absolute;top:24px;right:28px;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#b9b0a2}
.close:hover{color:#e8a24a}
```

- [ ] **Step 5: VideoTrigger component**

```tsx
// web/components/motion/VideoTrigger.tsx
'use client'

import {useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import type {VideoEmbed} from '@/lib/video'
import styles from './VideoTrigger.module.css'

type Props = {embed: VideoEmbed; title: string}

export function VideoTrigger({embed, title}: Props) {
  const [open, setOpen] = useState(false)
  const playRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      playRef.current?.focus()
    }
  }, [open])

  return (
    <>
      <div className={styles.playWrap}>
        <button ref={playRef} type="button" className={styles.play} data-motion="loop" aria-label={`Play ${title}`} onClick={() => setOpen(true)}>
          <span className={styles.triangle} aria-hidden="true" />
        </button>
      </div>
      {open &&
        createPortal(
          <div className={styles.backdrop} data-testid="lightbox-backdrop" onClick={() => setOpen(false)}>
            <div role="dialog" aria-modal="true" aria-label={title} className={styles.player} data-testid="lightbox-player" onClick={(e) => e.stopPropagation()}>
              <iframe
                className={styles.iframe}
                src={embed.embedUrl}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button ref={closeRef} type="button" className={styles.close} onClick={() => setOpen(false)}>Close ✕</button>
          </div>,
          document.body,
        )}
    </>
  )
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `cd web && npx vitest run lib/video components/motion/VideoTrigger && npm run typecheck`
Expected: PASS / 0.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/lib/video.ts web/lib/video.test.ts web/components/motion/VideoTrigger.tsx web/components/motion/VideoTrigger.module.css web/components/motion/VideoTrigger.test.tsx
git commit -m "feat(web): YouTube/Vimeo parsing, pulsing play button and lightbox

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Work & Reels page

**Files:**
- Create: `web/components/sections/WorkHeader/WorkHeader.tsx`, `WorkHeader.module.css`, `WorkFilters.tsx`
- Create: `web/components/sections/Showreel/Showreel.tsx`, `Showreel.module.css`
- Create: `web/components/sections/ProjectList/ProjectList.tsx`, `ProjectList.module.css`, `ProjectListFromSearch.tsx`
- Create: `web/components/sections/Skills/Skills.tsx`, `Skills.module.css`
- Create: `web/app/work/page.tsx`
- Test: `web/components/sections/WorkHeader/WorkFilters.test.tsx`, `web/components/sections/ProjectList/ProjectList.test.tsx`

**Interfaces:**
- Consumes: `WorkVM`, `ProjectVM`, `pageProjects`, `filterProjects`, `alternateOrder`, `parseWorkFilter`, `showreelOrderNote`, `parseVideoUrl`, `VideoTrigger`, `MediaSlot`, `SanityImage`.
- Produces: `<WorkHeader work />`, `<WorkFilters labels />` (client), `<Showreel showreel orderNote />`, `<ProjectList projects filter numberPrefix cta />`, `<ProjectListFromSearch …/>` (client), `<Skills skills />`; route `/work`.

- [ ] **Step 1: Write the failing tests**

```tsx
// web/components/sections/WorkHeader/WorkFilters.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {WorkFilters} from './WorkFilters'

let query = ''
vi.mock('next/navigation', () => ({useSearchParams: () => new URLSearchParams(query)}))

const labels = {all: 'All', cinematography: 'Cinematography', editing: 'Editing'}

describe('WorkFilters', () => {
  it('renders three chips linking to ?filter= and marks the current one active', () => {
    query = 'filter=editing'
    render(<WorkFilters labels={labels} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work?filter=all', '/work?filter=cinematography', '/work?filter=editing'])
    expect(links.map((l) => l.getAttribute('data-active'))).toEqual(['false', 'false', 'true'])
  })
  it('treats an unknown filter as all', () => {
    query = 'filter=bogus'
    render(<WorkFilters labels={labels} />)
    expect(screen.getByRole('link', {name: 'All'}).getAttribute('data-active')).toBe('true')
  })
})
```

```tsx
// web/components/sections/ProjectList/ProjectList.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {ProjectList} from './ProjectList'

const p = (slug: string, category: 'dop' | 'editor', n: string): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022',
  role: category === 'dop' ? 'Director of Photography' : 'Editor', roleShort: category === 'dop' ? 'DOP' : 'Editor', category,
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: false, n, seo: {title: null, description: null, image: null},
})
const projects = [p('a', 'dop', '01'), p('b', 'editor', '02'), p('c', 'dop', '03')]

describe('ProjectList', () => {
  it('alternates the cover position among visible items only', () => {
    render(<ProjectList projects={projects} filter="all" numberPrefix="no." cta="Watch →" />)
    const covers = screen.getAllByRole('link', {name: /^Open/})
    expect(covers.map((c) => c.getAttribute('data-order'))).toEqual(['0', '2', '0'])
  })
  it('filters by category and keeps the original numbering', () => {
    render(<ProjectList projects={projects} filter="cinematography" numberPrefix="no." cta="Watch →" />)
    expect(screen.queryByText('B')).toBeNull()
    expect(screen.getByText('no. 01')).toBeInTheDocument()
    expect(screen.getByText('no. 03')).toBeInTheDocument()
    const covers = screen.getAllByRole('link', {name: /^Open/})
    expect(covers.map((c) => c.getAttribute('data-order'))).toEqual(['0', '2'])
  })
  it('renders a single visible item with order 0', () => {
    render(<ProjectList projects={projects} filter="editing" numberPrefix="no." cta="Watch →" />)
    expect(screen.getAllByRole('link', {name: /^Open/}).map((c) => c.getAttribute('data-order'))).toEqual(['0'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run WorkFilters ProjectList`
Expected: FAIL — modules not found.

- [ ] **Step 3: WorkHeader + WorkFilters (markup.html first `<section>` under `data-screen-label="02 Work & Reels"`)**

```css
/* web/components/sections/WorkHeader/WorkHeader.module.css */
.section{max-width:1480px;margin:0 auto;padding:clamp(56px,8vw,110px) clamp(16px,4vw,48px) 40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:40px;align-items:center}
.titleWrap{position:relative}
.title{margin:0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(96px,15vw,240px);line-height:.8}
.script{position:absolute;left:clamp(90px,14vw,230px);top:62%;font-family:var(--font-delafield),cursive;font-size:clamp(80px,10vw,160px);line-height:1;color:#e8a24a;transform:rotate(-6deg)}
.side{display:flex;flex-direction:column;gap:18px;max-width:520px}
.intro{margin:0;font-family:var(--font-bodoni),serif;font-style:italic;font-size:24px;line-height:1.35}
.filters{display:flex;gap:10px 22px;flex-wrap:wrap;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#b9b0a2}
.chip{all:unset;cursor:pointer;padding-bottom:4px;color:#b9b0a2;border-bottom:2px solid transparent}
.chip[data-active="true"]{color:#efe7da;border-bottom:2px solid #e8a24a}
```

```tsx
// web/components/sections/WorkHeader/WorkFilters.tsx
'use client'

import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import {WORK_FILTERS, parseWorkFilter, type WorkFilter} from '@/lib/viewmodel/projects'
import styles from './WorkHeader.module.css'

export function WorkFilters({labels}: {labels: Record<WorkFilter, string>}) {
  const active = parseWorkFilter(useSearchParams().get('filter'))
  return (
    <div className={styles.filters}>
      {WORK_FILTERS.map((f) => (
        <Link key={f} href={`/work?filter=${f}`} scroll={false} className={styles.chip} data-active={f === active ? 'true' : 'false'}>
          {labels[f]}
        </Link>
      ))}
    </div>
  )
}
```

```tsx
// web/components/sections/WorkHeader/WorkHeader.tsx
import {Suspense} from 'react'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import {WorkFilters} from './WorkFilters'
import styles from './WorkHeader.module.css'

export function WorkHeader({work}: {work: WorkVM}) {
  return (
    <section className={styles.section}>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{work.title}</h1>
        <span className={styles.script}>{work.script}</span>
      </div>
      <div className={styles.side}>
        <p className={styles.intro}>{work.intro}</p>
        <Suspense fallback={<div className={styles.filters} />}>
          <WorkFilters labels={work.filters} />
        </Suspense>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Showreel (markup.html second `<section>` of the Work screen)**

```css
/* web/components/sections/Showreel/Showreel.module.css */
.section{max-width:1480px;margin:0 auto;padding:0 clamp(16px,4vw,48px) clamp(64px,8vw,110px)}
.poster{position:relative;aspect-ratio:16/9;background:#1c1916}
.bg{position:absolute;inset:0;overflow:hidden}
.kenburns{position:absolute;inset:0;animation:kenburns 22s ease-in-out infinite alternate}
.meta{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;padding-top:16px}
.label{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:40px;line-height:1}
.note{font-family:var(--font-bodoni),serif;font-style:italic;font-size:18px;color:#b9b0a2}
```

```tsx
// web/components/sections/Showreel/Showreel.tsx
import {SanityImage} from '@/components/media/SanityImage'
import {VideoTrigger} from '@/components/motion/VideoTrigger'
import {parseVideoUrl} from '@/lib/video'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import styles from './Showreel.module.css'

export function Showreel({showreel, orderNote}: {showreel: WorkVM['showreel']; orderNote: string}) {
  const embed = parseVideoUrl(showreel.videoUrl)
  return (
    <section className={styles.section}>
      <div className={styles.poster}>
        <div className={styles.bg}>
          <div className={styles.kenburns} data-motion="loop">
            {showreel.poster && <SanityImage image={showreel.poster} sizes="(max-width: 1500px) 100vw, 1400px" priority />}
          </div>
        </div>
        {embed && <VideoTrigger embed={embed} title={showreel.label} />}
      </div>
      <div className={styles.meta}>
        <span className={styles.label}>{showreel.label}</span>
        <span className={styles.note}>{orderNote}</span>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: ProjectList (cream `<section>` with `list="{{ projects }}"` inside the Work screen)**

```css
/* web/components/sections/ProjectList/ProjectList.module.css */
.section{background:#efe7da;color:#14110e}
.inner{max-width:1480px;margin:0 auto;padding:clamp(64px,8vw,120px) clamp(16px,4vw,48px);display:flex;flex-direction:column;gap:clamp(64px,8vw,120px)}
.article{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:28px clamp(32px,5vw,80px);align-items:center}
.cover{all:unset;cursor:pointer;position:relative;display:block;aspect-ratio:16/9;background:#d9d0c1;box-shadow:0 20px 50px rgba(0,0,0,.15)}
/* Prototype: order:{{ p.order }} — 0 or 2, alternating among visible items */
.cover[data-order="2"]{order:2}
.text{display:flex;flex-direction:column;gap:14px}
.number{font-family:var(--font-delafield),cursive;font-size:64px;line-height:.6;color:#a4501a}
.title{margin:10px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(56px,6.5vw,104px);line-height:.88}
.sub{font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px;color:#5e564c}
.role{font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}
.cta{all:unset;cursor:pointer;align-self:flex-start;margin-top:6px;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #a4501a;padding-bottom:6px}
```

```tsx
// web/components/sections/ProjectList/ProjectList.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import {alternateOrder, filterProjects, type ProjectVM, type WorkFilter} from '@/lib/viewmodel/projects'
import styles from './ProjectList.module.css'

type Props = {projects: ProjectVM[]; filter: WorkFilter; numberPrefix: string; cta: string}

export function ProjectList({projects, filter, numberPrefix, cta}: Props) {
  const visible = filterProjects(projects, filter)
  const orders = alternateOrder(visible.length)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {visible.map((p, i) => (
          <article key={p.id} data-reveal="1" className={styles.article}>
            <Link href={`/work/${p.slug}`} className={`${styles.cover} asButton`} data-order={String(orders[i])} aria-label={`Open ${p.title}`}>
              {p.cover && <SanityImage image={p.cover} sizes="(max-width: 800px) 100vw, 50vw" />}
            </Link>
            <div className={styles.text}>
              <span className={styles.number}>{numberPrefix} {p.n}</span>
              <h3 className={styles.title}>{p.title}</h3>
              <span className={styles.sub}>({p.formatLower}, {p.year})</span>
              <span className={styles.role}>{p.role}</span>
              <Link href={`/work/${p.slug}`} className={`${styles.cta} hoverRust asButton`}>{cta}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
```

```tsx
// web/components/sections/ProjectList/ProjectListFromSearch.tsx
'use client'

import {useSearchParams} from 'next/navigation'
import {parseWorkFilter, type ProjectVM} from '@/lib/viewmodel/projects'
import {ProjectList} from './ProjectList'

type Props = {projects: ProjectVM[]; numberPrefix: string; cta: string}

/** Reads ?filter= on the client so /work stays a static page (spec §5.1). */
export function ProjectListFromSearch(props: Props) {
  const filter = parseWorkFilter(useSearchParams().get('filter'))
  return <ProjectList {...props} filter={filter} />
}
```

- [ ] **Step 6: Skills (last `<section>` of the Work screen)**

```css
/* web/components/sections/Skills/Skills.module.css */
.section{max-width:1480px;margin:0 auto;padding:clamp(72px,9vw,130px) clamp(16px,4vw,48px)}
.head{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:48px}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(60px,6vw,92px);line-height:.6;color:#e8a24a}
.heading{margin:14px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(52px,6.5vw,104px);line-height:.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:20px}
.tile{display:flex;flex-direction:column;align-items:center;gap:10px}
.frame{position:relative;width:100%;aspect-ratio:1;background:#1c1916;border:6px solid #efe7da}
.label{font-family:var(--font-bodoni),serif;font-style:italic;font-size:24px}
```

```tsx
// web/components/sections/Skills/Skills.tsx
import {MediaSlot} from '@/components/media/MediaSlot'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import styles from './Skills.module.css'

export function Skills({skills}: {skills: WorkVM['skills']}) {
  if (skills.items.length === 0) return null
  return (
    <section className={styles.section}>
      <div data-reveal="1" className={styles.head}>
        <span className={styles.script}>{skills.script}</span>
        <h2 className={styles.heading}>{skills.heading}</h2>
      </div>
      <div className={styles.grid}>
        {skills.items.map((s, i) => (
          <div key={`${s.label}-${i}`} data-reveal="1" className={styles.tile}>
            <div className={styles.frame} style={{transform: `rotate(${s.tilt}deg)`}}>
              <MediaSlot media={s.media} sizes="(max-width: 600px) 100vw, 25vw" />
            </div>
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 7: The page**

```tsx
// web/app/work/page.tsx
import {Suspense} from 'react'
import {ProjectList} from '@/components/sections/ProjectList/ProjectList'
import {ProjectListFromSearch} from '@/components/sections/ProjectList/ProjectListFromSearch'
import {Showreel} from '@/components/sections/Showreel/Showreel'
import {Skills} from '@/components/sections/Skills/Skills'
import {WorkHeader} from '@/components/sections/WorkHeader/WorkHeader'
import {getProjects, getWork} from '@/lib/data'
import {pageProjects, showreelOrderNote} from '@/lib/viewmodel/projects'

export default async function WorkPage() {
  const [work, projects] = await Promise.all([getWork(), getProjects()])
  const pages = pageProjects(projects)
  const orderNote = showreelOrderNote(pages, work.showreel.orderNotePrefix, work.showreel.orderNoteOverride)
  return (
    <main className="pagein">
      <WorkHeader work={work} />
      <Showreel showreel={work.showreel} orderNote={orderNote} />
      <Suspense fallback={<ProjectList projects={pages} filter="all" numberPrefix={work.numberPrefix} cta={work.projectCta} />}>
        <ProjectListFromSearch projects={pages} numberPrefix={work.numberPrefix} cta={work.projectCta} />
      </Suspense>
      <Skills skills={work.skills} />
    </main>
  )
}
```

- [ ] **Step 8: Run tests, typecheck, verifier for the Work screen, build**

```bash
cd web && npx vitest run && npm run typecheck
A=$(grep -n 'data-screen-label="02 Work' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'data-screen-label="03 Project"' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-1))
npm run build
```

Expected: PASS / 0 / `✓ … covered` / build shows `/work` as a static route (`○`). In `npm run dev`, `/work?filter=editing` shows only editor projects with "no. 04" and "no. 05" and the Editing chip underlined in amber; the play button opens the lightbox once a YouTube URL is entered on the Work document in the Studio.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/components/sections/WorkHeader web/components/sections/Showreel web/components/sections/ProjectList web/components/sections/Skills web/app/work/page.tsx
git commit -m "feat(web): Work & Reels page with client-side filters, showreel lightbox and skills

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Project page

**Files:**
- Create: `web/components/sections/ProjectHero/ProjectHero.tsx`, `ProjectHero.module.css`
- Create: `web/components/sections/FrameGrabs/FrameGrabs.tsx`, `FrameGrabs.module.css`
- Create: `web/components/sections/UpNext/UpNext.tsx`, `UpNext.module.css`
- Create: `web/app/work/[slug]/page.tsx`
- Test: `web/components/sections/ProjectHero/ProjectHero.test.tsx`, `web/components/sections/FrameGrabs/FrameGrabs.test.tsx`, `web/app/work/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `ProjectVM`, `WorkVM['projectPage']`, `nextProject`, `getProjectSlugs`, `parseVideoUrl`, `VideoTrigger`.
- Produces: `<ProjectHero project labels showRec />`, `<FrameGrabs grabs labels title />`, `<UpNext next script />`; route `/work/[slug]` with `generateStaticParams`.

- [ ] **Step 1: Write the failing tests**

```tsx
// web/components/sections/ProjectHero/ProjectHero.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {ProjectHero} from './ProjectHero'

const labels = {backLabel: '← Work & reels', reelPrefix: 'reel no.', roleLabel: 'role', formatLabel: 'format', yearLabel: 'year', aspectLabel: '2.39 : 1', grabsScript: 'frame', grabsHeading: 'Grabs', upNextScript: 'up next'}
const project: ProjectVM = {
  id: 'p', slug: 'pagal', title: 'Pagal', format: 'Music Video', formatLower: 'music video', year: '2022', role: 'Director of Photography', roleShort: 'DOP', category: 'dop',
  cover: null, frameGrabs: [], videoUrl: 'https://youtu.be/dQw4w9WgXcQ', showOnHome: true, creditOnly: false, n: '01', seo: {title: null, description: null, image: null},
}

describe('ProjectHero', () => {
  it('shows the numbered title, HUD with a live timecode, meta row, and a play button', () => {
    render(<ProjectHero project={project} labels={labels} showRec />)
    expect(screen.getByText('reel no. 01')).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Pagal')
    expect(screen.getByText('(music video, 2022)')).toBeInTheDocument()
    expect(document.querySelector('[data-tc]')?.textContent).toBe('00:00:00:00')
    expect(screen.getByText('2.39 : 1')).toBeInTheDocument()
    expect(screen.getByText('Director of Photography')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Play Pagal'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: '← Work & reels'})).toHaveAttribute('href', '/work')
  })
  it('hides the REC group when showRec is false and the play button without a video', () => {
    render(<ProjectHero project={{...project, videoUrl: null}} labels={labels} showRec={false} />)
    expect(document.querySelector('[data-tc]')).toBeNull()
    expect(screen.queryByRole('button', {name: /Play/})).toBeNull()
  })
})
```

```tsx
// web/components/sections/FrameGrabs/FrameGrabs.test.tsx
import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {FrameGrabs} from './FrameGrabs'

describe('FrameGrabs', () => {
  it('renders nothing when there are no grabs', () => {
    const {container} = render(<FrameGrabs grabs={[]} script="frame" heading="Grabs" title="Pagal" />)
    expect(container.innerHTML).toBe('')
  })
})
```

```tsx
// web/app/work/[slug]/page.test.tsx
import {describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })
vi.mock('next/navigation', () => ({notFound}))
vi.mock('@/lib/data', () => ({
  getWork: async () => ({projectPage: {backLabel: 'b', reelPrefix: 'r', roleLabel: 'role', formatLabel: 'format', yearLabel: 'year', aspectLabel: 'a', grabsScript: 'g', grabsHeading: 'G', upNextScript: 'u'}}),
  getSiteSettings: async () => ({showRec: true}),
  getProjects: async () => [
    {id: '1', slug: 'credit', title: 'C', format: '', formatLower: '', year: '', role: '', roleShort: 'DOP', category: 'dop', cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: true, n: '', seo: {title: null, description: null, image: null}},
  ],
  getProjectSlugs: async () => [],
}))

describe('project page', () => {
  it('404s for credit-only and unknown slugs', async () => {
    const {default: Page} = await import('./page')
    await expect(Page({params: Promise.resolve({slug: 'credit'})})).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(Page({params: Promise.resolve({slug: 'nope'})})).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run ProjectHero FrameGrabs 'work/\[slug\]'`
Expected: FAIL — modules not found.

- [ ] **Step 3: ProjectHero (markup.html `data-screen-label="03 Project"` first two `<section>`s)**

```css
/* web/components/sections/ProjectHero/ProjectHero.module.css */
.head{max-width:1480px;margin:0 auto;padding:clamp(36px,5vw,64px) clamp(16px,4vw,48px) 32px}
.back{all:unset;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#b9b0a2}
.titleRow{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-top:36px}
.titleWrap{display:flex;flex-direction:column}
.reel{font-family:var(--font-delafield),cursive;font-size:72px;line-height:.6;color:#e8a24a}
.title{margin:16px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(76px,12vw,190px);line-height:.84}
.sub{font-family:var(--font-bodoni),serif;font-style:italic;font-size:26px;color:#b9b0a2}
.section{max-width:1480px;margin:0 auto;padding:0 clamp(16px,4vw,48px)}
.cover{position:relative;aspect-ratio:2.39/1;background:#000}
.bg{position:absolute;inset:0;overflow:hidden}
.kenburns{position:absolute;inset:0;animation:kenburns 18s ease-in-out infinite alternate}
.hud{position:absolute;top:16px;left:16px;right:16px;display:flex;justify-content:space-between;pointer-events:none;font-size:12px;font-weight:600;letter-spacing:.2em;font-variant-numeric:tabular-nums}
.hudLeft{display:flex;align-items:center;gap:8px}
.rec{width:8px;height:8px;border-radius:50%;background:#e5382b;animation:recblink 1s steps(1) infinite}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));border-bottom:1px solid rgba(239,231,218,.14)}
.cell{padding:22px 0;display:flex;flex-direction:column;gap:4px}
.cellLabel{font-family:var(--font-bodoni),serif;font-style:italic;font-size:16px;color:#b9b0a2}
.cellValue{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:24px}
```

```tsx
// web/components/sections/ProjectHero/ProjectHero.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import {VideoTrigger} from '@/components/motion/VideoTrigger'
import {parseVideoUrl} from '@/lib/video'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './ProjectHero.module.css'

type Props = {project: ProjectVM; labels: WorkVM['projectPage']; showRec: boolean}

export function ProjectHero({project, labels, showRec}: Props) {
  const embed = parseVideoUrl(project.videoUrl)
  return (
    <>
      <section className={styles.head}>
        <Link href="/work" className={`${styles.back} hoverAmber asButton`}>{labels.backLabel}</Link>
        <div className={styles.titleRow}>
          <div className={styles.titleWrap}>
            <span className={styles.reel}>{labels.reelPrefix} {project.n}</span>
            <h1 className={styles.title}>{project.title}</h1>
          </div>
          <span className={styles.sub}>({project.formatLower}, {project.year})</span>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.cover}>
          <div className={styles.bg}>
            <div className={styles.kenburns} data-motion="loop">
              {project.cover && <SanityImage image={project.cover} sizes="(max-width: 1500px) 100vw, 1400px" priority />}
            </div>
          </div>
          <div className={styles.hud} aria-hidden="true">
            {showRec ? (
              <span className={styles.hudLeft}>
                <span className={styles.rec} data-motion="loop" />
                <span data-tc="1">00:00:00:00</span>
              </span>
            ) : <span />}
            <span>{labels.aspectLabel}</span>
          </div>
          {embed && <VideoTrigger embed={embed} title={project.title} />}
        </div>
        <div className={styles.meta}>
          <div className={styles.cell}><span className={styles.cellLabel}>{labels.roleLabel}</span><span className={styles.cellValue}>{project.role}</span></div>
          <div className={styles.cell}><span className={styles.cellLabel}>{labels.formatLabel}</span><span className={styles.cellValue}>{project.format}</span></div>
          <div className={styles.cell}><span className={styles.cellLabel}>{labels.yearLabel}</span><span className={styles.cellValue}>{project.year}</span></div>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 4: FrameGrabs and UpNext (remaining `<section>`s of the Project screen)**

```css
/* web/components/sections/FrameGrabs/FrameGrabs.module.css */
.section{background:#efe7da;color:#14110e;margin-top:clamp(56px,7vw,100px)}
.inner{max-width:1480px;margin:0 auto;padding:clamp(56px,7vw,100px) clamp(16px,4vw,48px)}
.head{display:flex;flex-direction:column;align-items:center;margin-bottom:40px}
.script{font-family:var(--font-delafield),cursive;font-size:72px;line-height:.6;color:#a4501a}
.heading{margin:12px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(48px,6vw,88px);line-height:.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:16px}
.grab{position:relative;aspect-ratio:16/9;background:#d9d0c1}
```

```tsx
// web/components/sections/FrameGrabs/FrameGrabs.tsx
import {SanityImage} from '@/components/media/SanityImage'
import type {ImageVM} from '@/lib/viewmodel/types'
import styles from './FrameGrabs.module.css'

type Props = {grabs: ImageVM[]; script: string; heading: string; title: string}

export function FrameGrabs({grabs, script, heading, title}: Props) {
  if (grabs.length === 0) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.script}>{script}</span>
          <h2 className={styles.heading}>{heading}</h2>
        </div>
        <div className={styles.grid}>
          {grabs.map((g, i) => (
            <div key={g.assetId + i} data-reveal="1" className={styles.grab}>
              <SanityImage image={{...g, alt: g.alt || `Frame grab ${String(i + 1).padStart(2, '0')} from ${title}`}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

```css
/* web/components/sections/UpNext/UpNext.module.css */
.section{max-width:1480px;margin:0 auto;padding:clamp(56px,7vw,100px) clamp(16px,4vw,48px) 0}
.link{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;width:100%;text-align:center}
.script{font-family:var(--font-delafield),cursive;font-size:64px;line-height:.6;color:#e8a24a}
.title{margin-top:16px;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(60px,10vw,160px);line-height:.85}
```

```tsx
// web/components/sections/UpNext/UpNext.tsx
import Link from 'next/link'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './UpNext.module.css'

export function UpNext({next, script}: {next: ProjectVM; script: string}) {
  return (
    <section className={styles.section}>
      <Link href={`/work/${next.slug}`} className={`${styles.link} hoverAmber asButton`}>
        <span className={styles.script}>{script}</span>
        <span className={styles.title}>{next.title} →</span>
      </Link>
    </section>
  )
}
```

- [ ] **Step 5: The page**

```tsx
// web/app/work/[slug]/page.tsx
import {notFound} from 'next/navigation'
import {FrameGrabs} from '@/components/sections/FrameGrabs/FrameGrabs'
import {ProjectHero} from '@/components/sections/ProjectHero/ProjectHero'
import {UpNext} from '@/components/sections/UpNext/UpNext'
import {getProjectSlugs, getProjects, getSiteSettings, getWork} from '@/lib/data'
import {nextProject, pageProjects} from '@/lib/viewmodel/projects'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  return getProjectSlugs()
}

export default async function ProjectPage({params}: Props) {
  const {slug} = await params
  const [work, projects, settings] = await Promise.all([getWork(), getProjects(), getSiteSettings()])
  const pages = pageProjects(projects)
  const project = pages.find((p) => p.slug === slug)
  if (!project) notFound()
  const next = nextProject(pages, slug)
  const labels = work.projectPage

  return (
    <main className="pagein">
      <ProjectHero project={project} labels={labels} showRec={settings.showRec} />
      <FrameGrabs grabs={project.frameGrabs} script={labels.grabsScript} heading={labels.grabsHeading} title={project.title} />
      {next && next.slug !== project.slug && <UpNext next={next} script={labels.upNextScript} />}
    </main>
  )
}
```

- [ ] **Step 6: Run tests, typecheck, verifier for the Project screen, build**

```bash
cd web && npx vitest run && npm run typecheck
A=$(grep -n 'data-screen-label="03 Project"' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'data-screen-label="04 Frames"' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-1))
npm run build
```

Expected: PASS / 0 / `✓ … covered` / build lists `/work/[slug]` with the five seeded slugs prerendered (`● /work/pagal` etc.). In `npm run dev`, `/work/pagal` shows "reel no. 01", the blinking REC dot with a running timecode, four frame grabs, and "up next Dehleez →"; `/work/love-marriage` wraps to Pagal; `/work/nope` returns the 404 page.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/components/sections/ProjectHero web/components/sections/FrameGrabs web/components/sections/UpNext "web/app/work/[slug]"
git commit -m "feat(web): project page with REC/timecode HUD, play button, frame grabs and up next

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Plan 05 adds Frames, About and Contact (with the inquiry API).
