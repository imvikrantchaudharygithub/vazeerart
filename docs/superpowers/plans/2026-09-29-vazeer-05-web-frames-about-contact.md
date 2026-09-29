# Vazeer Art — Plan 05: Frames, About, Contact and the Inquiry API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/frames` (masonry of Instagram frames), `/about` (portrait collage, statement, credits from projects, finale) and `/contact` (brief form that stores an Inquiry document in Sanity).

**Architecture:** Server components with verbatim CSS Modules, as in Plans 03–04. The only client island is `BriefForm`, which posts JSON to `POST /api/inquiry`; the route validates with a zod schema shared with the form, drops honeypot submissions silently, and writes with the server-only client. Contact-form type chips are validated against the CMS list.

**Tech Stack:** Next.js 16, React 19, zod 4, next-sanity, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-09-29-vazeer-portfolio-design.md` (§3.2 screens 04–06, §5.7, §6.2, §6.3 inquiry)

**Depends on:** Plan 04.

## Global Constraints

- Same CSS rules as Plans 03–04; verify each screen's range with `node tools/verify-styles.mjs --lines A-B`.
- The Frames and Contact `<main>` elements carry layout styles in the prototype; their module `.main` class includes the `animation:pagein …` declaration verbatim so the verifier finds one superset rule.
- Inquiry validation limits (spec §5.7): name 1–120, contact 3–200, dates ≤ 200, brief ≤ 4000, `type` ∈ `contactPage.form.types`. Honeypot field is named `website`.
- Never log or echo submitted personal data in server logs.
- Commit after every task; end commit bodies with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Bot fills the hidden `website` field** → `200 {ok:true}` and nothing is written. Task 3 tests it.
2. **Submission with an unknown `type`** (chips edited in the CMS after the page was cached) → `400` with a field error, form shows it inline. Task 3 tests the API; Task 3 also tests the form rendering errors.
3. **Network failure during submit** → the form shows a retry message and keeps the user's text. Task 3 tests the fetch-rejection branch.
4. **Frame with ratio `16/9`** (allowed in schema, absent from the prototype) → renders with that ratio and the "Instagram post" label. Task 1 tests it.
5. **Credit-only project in About credits** → listed, not a link. Task 2 tests it.

---

### Task 1: Frames page

**Files:**
- Create: `web/components/sections/FramesGrid/FramesGrid.tsx`, `FramesGrid.module.css`
- Create: `web/app/frames/page.tsx`
- Test: `web/components/sections/FramesGrid/FramesGrid.test.tsx`

**Interfaces:**
- Consumes: `FramesPageVM`, `FrameVM`, `getFramesPage`, `getFrames`.
- Produces: `<FramesGrid page frames />`; route `/frames`.

- [ ] **Step 1: Write the failing test**

```tsx
// web/components/sections/FramesGrid/FramesGrid.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {FrameVM} from '@/lib/viewmodel/pagesContent'
import {FramesGrid} from './FramesGrid'

const image = {assetId: 'image-a-900x1125-jpg', url: 'https://cdn.sanity.io/images/p/d/a-900x1125.jpg', width: 900, height: 1125, extension: 'jpg', lqip: null, alt: 'Frame', hotspot: null, crop: null}
const page = {script: 'straight from the grid', heading: 'Frames', linkLabel: '(follow along ↗)', linkUrl: 'https://instagram.com/x', reelLabel: 'Reel cover', postLabel: 'Instagram post', seo: {title: null, description: null, image: null}}
const frames: FrameVM[] = [
  {id: '1', image, ratio: '9/16', instagramUrl: null, label: 'Reel cover'},
  {id: '2', image, ratio: '16/9', instagramUrl: 'https://instagram.com/p/1', label: 'Instagram post'},
]

describe('FramesGrid', () => {
  it('renders each frame with its aspect ratio, wrapping linked frames in an anchor', () => {
    render(<FramesGrid page={page} frames={frames} />)
    const items = screen.getAllByTestId('frame')
    expect(items.map((el) => el.getAttribute('data-ratio'))).toEqual(['9/16', '16/9'])
    expect(items[0].closest('a')).toBeNull()
    expect(items[1].closest('a')).toHaveAttribute('href', 'https://instagram.com/p/1')
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Frames')
    expect(screen.getByRole('link', {name: '(follow along ↗)'})).toHaveAttribute('href', 'https://instagram.com/x')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run FramesGrid`
Expected: FAIL — module not found.

- [ ] **Step 3: Styles (markup.html `data-screen-label="04 Frames"` block)**

```css
/* web/components/sections/FramesGrid/FramesGrid.module.css */
.main{animation:pagein .8s cubic-bezier(.2,.8,.2,1) both;max-width:1480px;margin:0 auto;padding:clamp(56px,8vw,110px) clamp(16px,4vw,48px) 0}
.head{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:56px}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(64px,7vw,110px);line-height:.6;color:#e8a24a}
.heading{margin:18px 0 12px;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(96px,15vw,240px);line-height:.8}
.link{font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px;border-bottom:1px solid #e8a24a}
.columns{column-width:280px;column-gap:14px}
.frame{break-inside:avoid;margin-bottom:14px;position:relative;background:#1c1916}
/* Prototype: aspect-ratio:{{ f.ratio }} */
.frame[data-ratio="4/5"]{aspect-ratio:4/5}
.frame[data-ratio="9/16"]{aspect-ratio:9/16}
.frame[data-ratio="1/1"]{aspect-ratio:1/1}
.frame[data-ratio="16/9"]{aspect-ratio:16/9}
.frameLink{display:block;break-inside:avoid}
```

- [ ] **Step 4: Component and page**

```tsx
// web/components/sections/FramesGrid/FramesGrid.tsx
import {SanityImage} from '@/components/media/SanityImage'
import type {FramesPageVM, FrameVM} from '@/lib/viewmodel/pagesContent'
import styles from './FramesGrid.module.css'

export function FramesGrid({page, frames}: {page: FramesPageVM; frames: FrameVM[]}) {
  return (
    <main className={styles.main}>
      <div data-reveal="1" className={styles.head}>
        <span className={styles.script}>{page.script}</span>
        <h1 className={styles.heading}>{page.heading}</h1>
        <a href={page.linkUrl} target="_blank" rel="noreferrer" className={styles.link}>{page.linkLabel}</a>
      </div>
      <div className={styles.columns}>
        {frames.map((f) => {
          const tile = (
            <div data-reveal="1" data-testid="frame" data-ratio={f.ratio} className={styles.frame}>
              <SanityImage image={{...f.image, alt: f.image.alt || f.label}} sizes="(max-width: 600px) 100vw, 280px" />
            </div>
          )
          return f.instagramUrl ? (
            <a key={f.id} href={f.instagramUrl} target="_blank" rel="noreferrer" className={styles.frameLink} aria-label={f.label}>{tile}</a>
          ) : (
            <div key={f.id}>{tile}</div>
          )
        })}
      </div>
    </main>
  )
}
```

```tsx
// web/app/frames/page.tsx
import {FramesGrid} from '@/components/sections/FramesGrid/FramesGrid'
import {getFrames, getFramesPage} from '@/lib/data'

export default async function FramesPage() {
  const [page, frames] = await Promise.all([getFramesPage(), getFrames()])
  return <FramesGrid page={page} frames={frames} />
}
```

Note: the ratio is applied through a `data-ratio` attribute and four attribute-selector rules rather than an inline style, so it is deterministic in jsdom and stays in CSS.

- [ ] **Step 5: Run tests, typecheck, verifier, build**

```bash
cd web && npx vitest run && npm run typecheck
A=$(grep -n 'data-screen-label="04 Frames"' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'data-screen-label="05 About"' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-1))
npm run build
```

Expected: PASS / 0 / `✓ … covered` / `/frames` static. In dev, twelve frames flow into 280 px columns with mixed ratios.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/components/sections/FramesGrid web/app/frames
git commit -m "feat(web): frames page with CSS-columns masonry

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: About page

**Files:**
- Create: `web/components/sections/AboutHero/AboutHero.tsx`, `AboutHero.module.css`
- Create: `web/components/sections/Statement/Statement.tsx`, `Statement.module.css`
- Create: `web/components/sections/Credits/Credits.tsx`, `Credits.module.css`
- Create: `web/components/sections/Finale/Finale.tsx`, `Finale.module.css`
- Create: `web/app/about/page.tsx`
- Test: `web/components/sections/Credits/Credits.test.tsx`

**Interfaces:**
- Consumes: `AboutVM`, `ProjectVM[]` (all, including credit-only), `getAbout`, `getProjects`.
- Produces: `<AboutHero hero />`, `<Statement statement />`, `<Credits credits projects />`, `<Finale finale />`; route `/about`.

- [ ] **Step 1: Write the failing test**

```tsx
// web/components/sections/Credits/Credits.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {Credits} from './Credits'

const p = (slug: string, creditOnly: boolean): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022', role: 'Editor', roleShort: 'Editor', category: 'editor',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly, n: creditOnly ? '' : '01', seo: {title: null, description: null, image: null},
})
const credits = {script: 'the', heading: 'Credits', imdbLabel: 'Full list on IMDb ↗', imdbUrl: 'https://imdb.com/x'}

describe('Credits', () => {
  it('lists every project; page projects link, credit-only rows do not', () => {
    render(<Credits credits={credits} projects={[p('a', false), p('b', true)]} />)
    expect(screen.getByRole('link', {name: /^A/})).toHaveAttribute('href', '/work/a')
    const rows = screen.getAllByTestId('credit-row')
    expect(rows).toHaveLength(2)
    expect(rows[1].tagName).toBe('DIV')
    expect(rows[1]).toHaveTextContent('music video · Editor')
    expect(screen.getByRole('link', {name: 'Full list on IMDb ↗'})).toHaveAttribute('href', 'https://imdb.com/x')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run Credits`
Expected: FAIL — module not found.

- [ ] **Step 3: AboutHero (first `<section>` of `data-screen-label="05 About"`)**

```css
/* web/components/sections/AboutHero/AboutHero.module.css */
.section{max-width:1480px;margin:0 auto;padding:clamp(56px,8vw,110px) clamp(16px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:56px clamp(40px,7vw,120px);align-items:center}
.collage{position:relative;width:100%;max-width:660px;aspect-ratio:1/1.1}
.portrait{position:absolute;right:0;top:0;width:72%;aspect-ratio:4/5;background:#1c1916}
.polaroid{position:absolute;left:0;bottom:0;width:46%;aspect-ratio:3/4;border:7px solid #efe7da;transform:rotate(-5deg);box-shadow:0 20px 50px rgba(0,0,0,.5);background:#1c1916}
.text{display:flex;flex-direction:column;gap:20px}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(64px,7vw,104px);line-height:.6;color:#e8a24a}
.heading{margin:0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(64px,8vw,128px);line-height:.88}
.body{margin:0;font-size:19px;max-width:520px;text-wrap:pretty}
.cta{all:unset;cursor:pointer;align-self:flex-start;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #e8a24a;padding-bottom:6px}
```

```tsx
// web/components/sections/AboutHero/AboutHero.tsx
import Link from 'next/link'
import {MediaSlot} from '@/components/media/MediaSlot'
import {SanityImage} from '@/components/media/SanityImage'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import styles from './AboutHero.module.css'

export function AboutHero({hero}: {hero: AboutVM['hero']}) {
  return (
    <section className={styles.section}>
      <div data-reveal="1" className={styles.collage}>
        <div className={styles.portrait}>{hero.portrait && <SanityImage image={hero.portrait} sizes="(max-width: 660px) 72vw, 475px" priority />}</div>
        <div className={styles.polaroid}><MediaSlot media={hero.polaroid} sizes="(max-width: 660px) 46vw, 300px" /></div>
      </div>
      <div data-reveal="1" className={styles.text}>
        <span className={styles.script}>{hero.script}</span>
        <h1 className={styles.heading}>{hero.heading}</h1>
        <p className={styles.body}>{hero.body}</p>
        <Link href="/contact" className={`${styles.cta} hoverAmber asButton`}>{hero.ctaLabel}</Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Statement (cream `<section>`)**

```css
/* web/components/sections/Statement/Statement.module.css */
.section{background:#efe7da;color:#14110e}
.inner{max-width:1480px;margin:0 auto;padding:clamp(72px,9vw,130px) clamp(16px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:40px clamp(40px,7vw,120px)}
.heading{margin:0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(40px,4.4vw,68px);line-height:.95;text-wrap:pretty}
.accent{color:#a4501a}
.paragraphs{display:flex;flex-direction:column;gap:20px;font-size:18px;color:#3d372f}
.p{margin:0;text-wrap:pretty}
.aside{font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px;color:#14110e}
```

```tsx
// web/components/sections/Statement/Statement.tsx
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import styles from './Statement.module.css'

export function Statement({statement}: {statement: AboutVM['statement']}) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>
          {statement.headingPlain} <span className={styles.accent}>{statement.headingAccent}</span>
        </h2>
        <div className={styles.paragraphs}>
          {statement.paragraphs.map((text, i) => <p key={i} className={styles.p}>{text}</p>)}
          <span className={styles.aside}>{statement.aside}</span>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Credits (section with `list="{{ projects }}"` rows)**

```css
/* web/components/sections/Credits/Credits.module.css */
.section{max-width:1480px;margin:0 auto;padding:clamp(72px,9vw,130px) clamp(16px,4vw,48px)}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:28px}
.headText{display:flex;flex-direction:column}
.script{font-family:var(--font-delafield),cursive;font-size:72px;line-height:.6;color:#e8a24a}
.heading{margin:12px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(52px,6vw,96px);line-height:.9}
.imdb{font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #e8a24a;padding-bottom:6px}
.list{border-top:1px solid rgba(239,231,218,.18)}
.row{all:unset;cursor:pointer;display:grid;grid-template-columns:80px minmax(0,1fr) auto;gap:8px 24px;align-items:baseline;width:100%;padding:20px 0;border-bottom:1px solid rgba(239,231,218,.18)}
.rowStatic{cursor:default}
.year{font-family:var(--font-bodoni),serif;font-style:italic;font-size:20px;color:#b9b0a2}
.title{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(28px,3.2vw,44px);line-height:1}
.meta{font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#b9b0a2}
```

```tsx
// web/components/sections/Credits/Credits.tsx
import Link from 'next/link'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './Credits.module.css'

export function Credits({credits, projects}: {credits: AboutVM['credits']; projects: ProjectVM[]}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.script}>{credits.script}</span>
          <h2 className={styles.heading}>{credits.heading}</h2>
        </div>
        <a href={credits.imdbUrl} target="_blank" rel="noreferrer" className={styles.imdb}>{credits.imdbLabel}</a>
      </div>
      <div className={styles.list}>
        {projects.map((p) => {
          const cells = (
            <>
              <span className={styles.year}>{p.year}</span>
              <span className={styles.title}>{p.title}</span>
              <span className={styles.meta}>{p.formatLower} · {p.roleShort}</span>
            </>
          )
          return p.creditOnly ? (
            <div key={p.id} data-reveal="1" data-testid="credit-row" className={`${styles.row} ${styles.rowStatic}`}>{cells}</div>
          ) : (
            <Link key={p.id} href={`/work/${p.slug}`} data-reveal="1" data-testid="credit-row" className={`${styles.row} hoverAmber asButton`}>{cells}</Link>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Finale (last `<section>` of the About screen)**

```css
/* web/components/sections/Finale/Finale.module.css */
.section{position:relative;min-height:clamp(480px,70vh,780px);background:#1c1916;display:flex;align-items:center;justify-content:center;text-align:center}
.bg{position:absolute;inset:0;overflow:hidden}
.kenburns{position:absolute;inset:0;animation:kenburns 22s ease-in-out infinite alternate}
.text{position:relative;z-index:2;pointer-events:none;display:flex;flex-direction:column;align-items:center;padding:24px;text-shadow:0 4px 30px rgba(0,0,0,.6)}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(80px,10vw,160px);line-height:.7;color:#e8a24a}
.sub{margin-top:8px;font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px}
```

```tsx
// web/components/sections/Finale/Finale.tsx
import {SanityImage} from '@/components/media/SanityImage'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import styles from './Finale.module.css'

export function Finale({finale}: {finale: AboutVM['finale']}) {
  return (
    <section className={styles.section}>
      <div className={styles.bg}>
        <div className={styles.kenburns} data-motion="loop">
          {finale.bgImage && <SanityImage image={finale.bgImage} sizes="100vw" />}
        </div>
      </div>
      <div className={styles.text}>
        <span className={styles.script}>{finale.script}</span>
        <span className={styles.sub}>{finale.sub}</span>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: The page**

```tsx
// web/app/about/page.tsx
import {AboutHero} from '@/components/sections/AboutHero/AboutHero'
import {Credits} from '@/components/sections/Credits/Credits'
import {Finale} from '@/components/sections/Finale/Finale'
import {Statement} from '@/components/sections/Statement/Statement'
import {getAbout, getProjects} from '@/lib/data'

export default async function AboutPage() {
  const [about, projects] = await Promise.all([getAbout(), getProjects()])
  return (
    <main className="pagein">
      <AboutHero hero={about.hero} />
      <Statement statement={about.statement} />
      <Credits credits={about.credits} projects={projects} />
      <Finale finale={about.finale} />
    </main>
  )
}
```

- [ ] **Step 8: Run tests, typecheck, verifier, build**

```bash
cd web && npx vitest run && npm run typecheck
A=$(grep -n 'data-screen-label="05 About"' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'data-screen-label="06 Contact"' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-1))
npm run build
```

Expected: PASS / 0 / `✓ … covered` / `/about` static.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/components/sections/AboutHero web/components/sections/Statement web/components/sections/Credits web/components/sections/Finale web/app/about
git commit -m "feat(web): about page — collage, statement, credits, finale

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Contact page, brief form and inquiry API

**Files:**
- Create: `web/lib/inquiry/schema.ts`
- Modify: `web/lib/sanity/queries.ts` (add `CONTACT_TYPES_QUERY`), regenerate `web/lib/sanity/types.ts`
- Create: `web/app/api/inquiry/route.ts`
- Create: `web/components/sections/ContactIntro/ContactIntro.tsx`, `ContactIntro.module.css`
- Create: `web/components/sections/BriefForm/BriefForm.tsx`, `BriefForm.module.css`
- Create: `web/app/contact/page.tsx`
- Test: `web/lib/inquiry/schema.test.ts`, `web/app/api/inquiry/route.test.ts`, `web/components/sections/BriefForm/BriefForm.test.tsx`

**Interfaces:**
- Consumes: `ContactVM`, `SiteSettingsVM.management/dm`, `writeClient`, `client`.
- Produces: `validateInquiry(data, allowedTypes)`, `InquiryInput`, `POST /api/inquiry` → `{ok:true}` | `400 {ok:false, errors}`; `<ContactIntro contact settings />`, `<BriefForm form success />`; route `/contact`.

- [ ] **Step 1: Write the failing tests**

```ts
// web/lib/inquiry/schema.test.ts
import {describe, expect, it} from 'vitest'
import {validateInquiry} from './schema'

const types = ['Music video', 'Commercial']
const good = {type: 'Music video', name: 'Asha', contact: 'asha@example.com', dates: 'Nov, Delhi', brief: 'A moody night shoot', website: ''}

describe('validateInquiry', () => {
  it('accepts a complete submission and trims strings', () => {
    const r = validateInquiry({...good, name: '  Asha '}, types)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.name).toBe('Asha')
  })
  it('rejects missing name and short contact with field errors', () => {
    const r = validateInquiry({...good, name: '', contact: 'ab'}, types)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['contact', 'name'])
  })
  it('rejects a type that is not in the CMS list', () => {
    const r = validateInquiry({...good, type: 'Wedding'}, types)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.type).toMatch(/choose/i)
  })
  it('rejects a brief over 4000 characters and non-object input', () => {
    expect(validateInquiry({...good, brief: 'x'.repeat(4001)}, types).ok).toBe(false)
    expect(validateInquiry(null, types).ok).toBe(false)
  })
})
```

```ts
// web/app/api/inquiry/route.test.ts
import {beforeEach, describe, expect, it, vi} from 'vitest'

const create = vi.fn(async () => ({_id: 'inq'}))
vi.mock('@/lib/sanity/writeClient', () => ({writeClient: {create}}))
vi.mock('@/lib/sanity/client', () => ({client: {fetch: async () => ['Music video', 'Commercial']}}))

const post = async (body: unknown) => {
  const {POST} = await import('./route')
  return POST(new Request('http://localhost/api/inquiry', {method: 'POST', body: JSON.stringify(body), headers: {'content-type': 'application/json'}}))
}
const good = {type: 'Music video', name: 'Asha', contact: 'asha@example.com', dates: '', brief: 'hi', website: ''}

describe('POST /api/inquiry', () => {
  beforeEach(() => create.mockClear())

  it('stores a valid inquiry', async () => {
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({_type: 'inquiry', name: 'Asha', type: 'Music video', read: false}))
  })
  it('silently accepts honeypot submissions without writing', async () => {
    const res = await post({...good, website: 'http://spam'})
    expect(res.status).toBe(200)
    expect(create).not.toHaveBeenCalled()
  })
  it('returns 400 with field errors for invalid input', async () => {
    const res = await post({...good, name: ''})
    expect(res.status).toBe(400)
    expect((await res.json()).errors.name).toBeDefined()
    expect(create).not.toHaveBeenCalled()
  })
  it('returns 400 for a non-JSON body', async () => {
    const {POST} = await import('./route')
    const res = await POST(new Request('http://localhost/api/inquiry', {method: 'POST', body: 'nope'}))
    expect(res.status).toBe(400)
  })
})
```

```tsx
// web/components/sections/BriefForm/BriefForm.test.tsx
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {BriefForm} from './BriefForm'

const form = {heading: 'The brief', typeQuestion: 'what are we making?', types: ['Music video', 'Commercial'], nameLabel: 'your name', contactLabel: 'email or phone', datesLabel: 'dates & location', briefLabel: 'the idea, references, budget', submitLabel: 'Send it →'}
const success = {script: 'that’s a wrap', body: 'Thanks — soon.', resetLabel: 'Send another'}

afterEach(() => vi.unstubAllGlobals())

function fill() {
  fireEvent.change(screen.getByLabelText('your name'), {target: {value: 'Asha'}})
  fireEvent.change(screen.getByLabelText('email or phone'), {target: {value: 'asha@example.com'}})
}

describe('BriefForm', () => {
  it('selects the first type by default, posts JSON, and shows the wrap state; reset returns to the form', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ok: true}), {status: 200}))
    vi.stubGlobal('fetch', fetchMock)
    render(<BriefForm form={form} success={success} />)
    expect(screen.getByRole('button', {name: 'Music video'}).getAttribute('data-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', {name: 'Commercial'}))
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    await waitFor(() => expect(screen.getByText('that’s a wrap')).toBeInTheDocument())
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toMatchObject({type: 'Commercial', name: 'Asha', contact: 'asha@example.com', website: ''})
    fireEvent.click(screen.getByRole('button', {name: 'Send another'}))
    expect(screen.getByRole('button', {name: 'Send it →'})).toBeInTheDocument()
  })

  it('shows server field errors inline', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ok: false, errors: {contact: 'Add an email or phone'}}), {status: 400})))
    render(<BriefForm form={form} success={success} />)
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    await waitFor(() => expect(screen.getByText('Add an email or phone')).toBeInTheDocument())
  })

  it('keeps the text and shows a retry message when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    render(<BriefForm form={form} success={success} />)
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument())
    expect((screen.getByLabelText('your name') as HTMLInputElement).value).toBe('Asha')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run inquiry BriefForm`
Expected: FAIL — modules not found.

- [ ] **Step 3: Validation schema**

```ts
// web/lib/inquiry/schema.ts
import {z} from 'zod'

export const inquiryInput = z.object({
  type: z.string().trim().min(1, 'Choose what we are making').max(40),
  name: z.string().trim().min(1, 'Please add your name').max(120, 'Name is too long'),
  contact: z.string().trim().min(3, 'Add an email or phone').max(200, 'Contact is too long'),
  dates: z.string().trim().max(200, 'Keep dates under 200 characters').optional().default(''),
  brief: z.string().trim().max(4000, 'Keep the brief under 4000 characters').optional().default(''),
  /** Honeypot: humans never see it, bots fill it. */
  website: z.string().max(200).optional().default(''),
})

export type InquiryInput = z.infer<typeof inquiryInput>
export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>

export function validateInquiry(data: unknown, allowedTypes: string[]): {ok: true; value: InquiryInput} | {ok: false; errors: InquiryErrors} {
  const parsed = inquiryInput.safeParse(data)
  if (!parsed.success) {
    const errors: InquiryErrors = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof InquiryInput | undefined
      if (key && !errors[key]) errors[key] = issue.message
    }
    if (Object.keys(errors).length === 0) errors.name = 'Please check the form'
    return {ok: false, errors}
  }
  if (!allowedTypes.includes(parsed.data.type)) {
    return {ok: false, errors: {type: 'Choose one of the options'}}
  }
  return {ok: true, value: parsed.data}
}
```

- [ ] **Step 4: Types query and API route**

Append to `web/lib/sanity/queries.ts`:

```ts
export const CONTACT_TYPES_QUERY = defineQuery(`*[_id == "contactPage"][0].form.types`)
```

Then regenerate types: `cd studio && npm run typegen` (expect 10 queries).

```ts
// web/app/api/inquiry/route.ts
import {NextResponse} from 'next/server'
import {validateInquiry} from '@/lib/inquiry/schema'
import {client} from '@/lib/sanity/client'
import {CONTACT_TYPES_QUERY} from '@/lib/sanity/queries'
import {writeClient} from '@/lib/sanity/writeClient'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ok: false, errors: {name: 'Invalid request'}}, {status: 400})
  }

  const types = ((await client.fetch(CONTACT_TYPES_QUERY)) ?? []).filter((t): t is string => typeof t === 'string')
  const result = validateInquiry(body, types)
  if (!result.ok) return NextResponse.json({ok: false, errors: result.errors}, {status: 400})

  // Honeypot filled → pretend success, store nothing.
  if (result.value.website) return NextResponse.json({ok: true})

  const {type, name, contact, dates, brief} = result.value
  await writeClient.create({_type: 'inquiry', type, name, contact, dates, brief, receivedAt: new Date().toISOString(), read: false})
  return NextResponse.json({ok: true})
}
```

- [ ] **Step 5: Contact intro and form styles (markup.html `data-screen-label="06 Contact"` block)**

```css
/* web/components/sections/ContactIntro/ContactIntro.module.css */
.main{animation:pagein .8s cubic-bezier(.2,.8,.2,1) both;max-width:1480px;margin:0 auto;padding:clamp(56px,8vw,110px) clamp(16px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:56px clamp(40px,7vw,120px);align-items:start}
.left{display:flex;flex-direction:column;gap:24px}
.titleWrap{position:relative}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(80px,9vw,140px);line-height:.6;color:#e8a24a}
.heading{margin:20px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(96px,13vw,210px);line-height:.8}
.intro{margin:0;font-family:var(--font-bodoni),serif;font-style:italic;font-size:24px;line-height:1.4;max-width:460px}
.photo{position:relative;width:min(100%,300px);aspect-ratio:4/5;border:7px solid #efe7da;transform:rotate(-3deg);box-shadow:0 20px 50px rgba(0,0,0,.5);background:#1c1916;margin:12px 0 12px 8px}
.links{display:flex;flex-direction:column;border-top:1px solid rgba(239,231,218,.18)}
.linkRow{display:flex;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid rgba(239,231,218,.18)}
.linkLabel{font-family:var(--font-bodoni),serif;font-style:italic;color:#b9b0a2}
.linkHandle{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:22px}
```

```css
/* web/components/sections/BriefForm/BriefForm.module.css */
.form{background:#efe7da;color:#14110e;padding:clamp(28px,4vw,56px);display:flex;flex-direction:column;gap:26px;box-shadow:0 30px 80px rgba(0,0,0,.4)}
.heading{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:36px;line-height:1}
.group{display:flex;flex-direction:column;gap:12px}
.fieldLabel{font-family:var(--font-bodoni),serif;font-style:italic;font-size:17px;color:#5e564c}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{all:unset;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:10px 14px;border:1px solid #14110e;background:transparent;color:#14110e}
.chip[data-active="true"]{background:#14110e;color:#efe7da}
.label{display:flex;flex-direction:column;gap:6px}
.input{all:unset;font-size:19px;padding:8px 0;border-bottom:1px solid #14110e}
.textarea{all:unset;font-size:19px;padding:8px 0;border-bottom:1px solid #14110e;white-space:pre-wrap}
.submit{all:unset;cursor:pointer;text-align:center;background:#14110e;color:#efe7da;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;padding:18px}
.submit[disabled]{opacity:.6;cursor:progress}
.error{font-size:13px;color:#a4501a}
.honeypot{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.sent{background:#efe7da;color:#14110e;padding:clamp(28px,4vw,56px);display:flex;flex-direction:column;gap:14px}
.sentScript{font-family:var(--font-delafield),cursive;font-size:80px;line-height:.7;color:#a4501a}
.sentBody{margin:0;font-size:18px}
.reset{all:unset;cursor:pointer;align-self:flex-start;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #a4501a;padding-bottom:4px}
```

- [ ] **Step 6: ContactIntro, BriefForm, page**

```tsx
// web/components/sections/ContactIntro/ContactIntro.tsx
import type {ReactNode} from 'react'
import {SanityImage} from '@/components/media/SanityImage'
import type {ContactVM} from '@/lib/viewmodel/pagesContent'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import styles from './ContactIntro.module.css'

type Props = {contact: ContactVM; settings: Pick<SiteSettingsVM, 'management' | 'dm'>; children: ReactNode}

/** The Contact <main>: left column here, the form as children on the right. */
export function ContactIntro({contact, settings, children}: Props) {
  const rows = [settings.management, settings.dm]
  return (
    <main className={styles.main}>
      <div className={styles.left}>
        <div className={styles.titleWrap}>
          <span className={styles.script}>{contact.script}</span>
          <h1 className={styles.heading}>{contact.heading}</h1>
        </div>
        <p className={styles.intro}>{contact.intro}</p>
        <div className={styles.photo}>{contact.photo && <SanityImage image={contact.photo} sizes="300px" />}</div>
        <div className={styles.links}>
          {rows.map((r) => (
            <a key={r.label} href={r.url} target="_blank" rel="noreferrer" className={styles.linkRow}>
              <span className={styles.linkLabel}>{r.label}</span>
              <span className={styles.linkHandle}>{r.handle}</span>
            </a>
          ))}
        </div>
      </div>
      {children}
    </main>
  )
}
```

```tsx
// web/components/sections/BriefForm/BriefForm.tsx
'use client'

import {useId, useState, type FormEvent} from 'react'
import type {InquiryErrors} from '@/lib/inquiry/schema'
import type {ContactVM} from '@/lib/viewmodel/pagesContent'
import styles from './BriefForm.module.css'

type Props = {form: ContactVM['form']; success: ContactVM['success']}
type Status = 'idle' | 'sending' | 'sent' | 'failed'

export function BriefForm({form, success}: Props) {
  const ids = {name: useId(), contact: useId(), dates: useId(), brief: useId()}
  const [type, setType] = useState(form.types[0] ?? '')
  const [values, setValues] = useState({name: '', contact: '', dates: '', brief: '', website: ''})
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [status, setStatus] = useState<Status>('idle')

  const set = (key: keyof typeof values) => (e: {target: {value: string}}) => setValues((v) => ({...v, [key]: e.target.value}))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrors({})
    try {
      const res = await fetch('/api/inquiry', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({type, ...values})})
      const json = (await res.json()) as {ok: boolean; errors?: InquiryErrors}
      if (!res.ok || !json.ok) {
        setErrors(json.errors ?? {name: 'Please check the form'})
        setStatus('idle')
        return
      }
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.sent}>
        <span className={styles.sentScript}>{success.script}</span>
        <p className={styles.sentBody}>{success.body}</p>
        <button type="button" className={styles.reset} onClick={() => { setValues({name: '', contact: '', dates: '', brief: '', website: ''}); setStatus('idle') }}>
          {success.resetLabel}
        </button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <span className={styles.heading}>{form.heading}</span>
      <div className={styles.group}>
        <span className={styles.fieldLabel}>{form.typeQuestion}</span>
        <div className={styles.chips}>
          {form.types.map((t) => (
            <button key={t} type="button" className={styles.chip} data-active={t === type ? 'true' : 'false'} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        {errors.type && <span className={styles.error} role="alert">{errors.type}</span>}
      </div>
      <label className={styles.label} htmlFor={ids.name}>
        <span className={styles.fieldLabel}>{form.nameLabel}</span>
        <input id={ids.name} className={styles.input} required value={values.name} onChange={set('name')} autoComplete="name" />
        {errors.name && <span className={styles.error} role="alert">{errors.name}</span>}
      </label>
      <label className={styles.label} htmlFor={ids.contact}>
        <span className={styles.fieldLabel}>{form.contactLabel}</span>
        <input id={ids.contact} className={styles.input} required value={values.contact} onChange={set('contact')} autoComplete="email" />
        {errors.contact && <span className={styles.error} role="alert">{errors.contact}</span>}
      </label>
      <label className={styles.label} htmlFor={ids.dates}>
        <span className={styles.fieldLabel}>{form.datesLabel}</span>
        <input id={ids.dates} className={styles.input} value={values.dates} onChange={set('dates')} />
        {errors.dates && <span className={styles.error} role="alert">{errors.dates}</span>}
      </label>
      <label className={styles.label} htmlFor={ids.brief}>
        <span className={styles.fieldLabel}>{form.briefLabel}</span>
        <textarea id={ids.brief} className={styles.textarea} rows={4} value={values.brief} onChange={set('brief')} />
        {errors.brief && <span className={styles.error} role="alert">{errors.brief}</span>}
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        website <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </label>
      {status === 'failed' && <span className={styles.error} role="alert">Could not send — please try again.</span>}
      <button type="submit" className={`${styles.submit} hoverBgRust`} disabled={status === 'sending'}>{form.submitLabel}</button>
    </form>
  )
}
```

```tsx
// web/app/contact/page.tsx
import {BriefForm} from '@/components/sections/BriefForm/BriefForm'
import {ContactIntro} from '@/components/sections/ContactIntro/ContactIntro'
import {getContact, getSiteSettings} from '@/lib/data'

export default async function ContactPage() {
  const [contact, settings] = await Promise.all([getContact(), getSiteSettings()])
  return (
    <ContactIntro contact={contact} settings={settings}>
      <BriefForm form={contact.form} success={contact.success} />
    </ContactIntro>
  )
}
```

- [ ] **Step 7: Run tests, typecheck, verifier for the Contact screen and the whole file, build**

```bash
cd web && npx vitest run && npm run typecheck
A=$(grep -n 'data-screen-label="06 Contact"' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'list="{{ preFooter }}"' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-3))
npm run verify:styles
npm run build
```

Expected: PASS / 0 / both verifier runs `✓ … covered` (the second is the **entire prototype**: every one of its elements is now covered) / `/contact` static, `/api/inquiry` dynamic. In dev, submit the form: the Studio's Inquiries list shows the new entry with the unread dot.

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/lib/inquiry web/lib/sanity/queries.ts web/lib/sanity/types.ts web/app/api/inquiry web/components/sections/ContactIntro web/components/sections/BriefForm web/app/contact
git commit -m "feat(web): contact page with brief form storing inquiries in Sanity

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Plan 06 adds SEO, the webhook fallback, visual regression against the prototype, Lighthouse and deployment.
