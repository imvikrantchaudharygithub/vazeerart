# Vazeer Art — Plan 06: SEO, Revalidation Fallback, Visual Regression, Performance, Deployment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site releasable: per-route metadata and sitemap, a styled 404, a webhook fallback for revalidation, automated screenshot comparison against the prototype at three widths, a Lighthouse gate, and the Vercel + Studio production wiring with a hand-over note for the editor.

**Architecture:** `lib/seo.ts` turns `SeoVM` + `SiteSettingsVM` into Next `Metadata`; routes export `generateMetadata`. `app/api/revalidate/route.ts` verifies the Sanity webhook signature and calls `revalidatePath('/', 'layout')`. Playwright specs run twice with the same snapshot names: once against `design-reference/original.html` to write baselines, once against the site to compare, with animations frozen and media hidden so the comparison measures layout and typography.

**Tech Stack:** Next.js 16 Metadata API, next-sanity/webhook, Playwright 1.5x, Lighthouse CLI, Vercel, Sanity CLI.

**Spec:** `docs/superpowers/specs/2026-09-29-vazeer-portfolio-design.md` (§4.2 fallback, §5.8, §9, §10, §11, §12)

**Depends on:** Plan 05 (all routes exist).

## Global Constraints

- Metadata falls back from the page's `seo` to `siteSettings.seo`; OG image is `seo.image` at 1200×630 via the Sanity CDN.
- Metadata queries use `stega: false` (spec: no stega in `<head>`).
- Visual comparison: animations and transitions disabled, `[data-tc]` frozen at `00:00:00:00`, `[data-reveal]` forced visible, `img`/`video`/`image-slot` hidden, leader skipped via `sessionStorage`. Threshold `maxDiffPixelRatio: 0.01`.
- Lighthouse mobile performance on `/` ≥ 90.
- Production accounts in Vazeer's name; tokens only in Vercel env vars and `web/.env.local`.
- Commit after every task; end commit bodies with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Webhook call with a bad or missing signature** → 401, nothing revalidated. Task 2 tests it.
2. **Project with no `seo.image`** → OG image falls back to the cover, then to site default; never a broken URL. Task 1 tests the fallback chain.
3. **Visiting `/work/<slug>` after the editor unpublishes that project** → 404 page in the design, not a 500. Task 1 adds the styled `not-found.tsx`; Plan 04's page already calls `notFound()`.
4. **Sitemap when a project is credit-only** → excluded. Task 1 tests it.
5. **Studio preview URL still pointing at localhost after deploy** → Presentation shows a blank iframe. Task 5 sets `SANITY_STUDIO_PREVIEW_URL` before redeploying the Studio and verifies the preview loads.

---

### Task 1: Metadata, sitemap, robots, JSON-LD and the 404 page

**Files:**
- Create: `web/lib/seo.ts`
- Modify: `web/app/layout.tsx` (default metadata), `web/app/page.tsx`, `web/app/work/page.tsx`, `web/app/work/[slug]/page.tsx`, `web/app/frames/page.tsx`, `web/app/about/page.tsx`, `web/app/contact/page.tsx` (add `generateMetadata`)
- Create: `web/app/sitemap.ts`, `web/app/robots.ts`, `web/app/not-found.tsx`, `web/app/not-found.module.css`
- Create: `web/components/seo/PersonJsonLd.tsx`
- Test: `web/lib/seo.test.ts`, `web/app/sitemap.test.ts`

**Interfaces:**
- Produces: `buildMetadata({seo, fallback, path, siteUrl, title?})`, `ogImageUrl(image)`; `<PersonJsonLd settings />`.

- [ ] **Step 1: Write the failing tests**

```ts
// web/lib/seo.test.ts
import {describe, expect, it} from 'vitest'
import {buildMetadata, ogImageUrl} from './seo'

const img = {assetId: 'image-abc-1400x900-jpg', url: 'https://cdn.sanity.io/images/iq6do512/production/abc-1400x900.jpg', width: 1400, height: 900, extension: 'jpg', lqip: null, alt: 'Cover', hotspot: null, crop: null}
const fallback = {title: 'Vazeer Art — DOP', description: 'Default description', image: img}

describe('ogImageUrl', () => {
  it('requests a 1200×630 crop from the Sanity CDN', () => {
    const u = new URL(ogImageUrl(img))
    expect(u.searchParams.get('w')).toBe('1200')
    expect(u.searchParams.get('h')).toBe('630')
    expect(u.searchParams.get('fit')).toBe('crop')
  })
})

describe('buildMetadata', () => {
  it('prefers the page seo and falls back field by field', () => {
    const m = buildMetadata({seo: {title: 'Pagal', description: null, image: null}, fallback, path: '/work/pagal', siteUrl: 'https://vazeerart.com'})
    expect(m.title).toBe('Pagal')
    expect(m.description).toBe('Default description')
    expect(m.alternates?.canonical).toBe('https://vazeerart.com/work/pagal')
    expect((m.openGraph?.images as {url: string}[])[0].url).toContain('abc-1400x900.jpg')
  })
  it('uses an explicit title when the page has none', () => {
    const m = buildMetadata({seo: {title: null, description: null, image: null}, fallback, path: '/frames', siteUrl: 'https://vazeerart.com', title: 'Frames'})
    expect(m.title).toBe('Frames')
  })
  it('omits openGraph images when nothing is available', () => {
    const m = buildMetadata({seo: {title: null, description: null, image: null}, fallback: {...fallback, image: null}, path: '/', siteUrl: 'https://x.com'})
    expect(m.openGraph?.images).toBeUndefined()
  })
})
```

```ts
// web/app/sitemap.test.ts
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/data', () => ({
  getProjects: async () => [
    {slug: 'pagal', creditOnly: false},
    {slug: 'hidden', creditOnly: true},
  ],
}))
vi.mock('@/lib/env', () => ({env: {siteUrl: 'https://vazeerart.com', projectId: 'x', dataset: 'y', apiVersion: 'z', studioUrl: 's'}}))

describe('sitemap', () => {
  it('lists the five routes and page projects only', async () => {
    const {default: sitemap} = await import('./sitemap')
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toEqual(['https://vazeerart.com/', 'https://vazeerart.com/work', 'https://vazeerart.com/frames', 'https://vazeerart.com/about', 'https://vazeerart.com/contact', 'https://vazeerart.com/work/pagal'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run lib/seo app/sitemap`
Expected: FAIL — modules not found.

- [ ] **Step 3: seo.ts**

```ts
// web/lib/seo.ts
import type {Metadata} from 'next'
import {imageSrc} from '@/lib/sanity/image'
import type {ImageVM, SeoVM} from '@/lib/viewmodel/types'

export function ogImageUrl(image: ImageVM): string {
  const url = new URL(imageSrc(image))
  url.searchParams.set('w', '1200')
  url.searchParams.set('h', '630')
  url.searchParams.set('fit', 'crop')
  url.searchParams.set('auto', 'format')
  return url.toString()
}

type Input = {seo: SeoVM; fallback: SeoVM; path: string; siteUrl: string; title?: string; imageFallback?: ImageVM | null}

export function buildMetadata({seo, fallback, path, siteUrl, title, imageFallback}: Input): Metadata {
  const resolvedTitle = seo.title ?? title ?? fallback.title ?? 'Vazeer Art'
  const description = seo.description ?? fallback.description ?? undefined
  const image = seo.image ?? imageFallback ?? fallback.image
  const canonical = new URL(path, siteUrl).toString()
  return {
    title: resolvedTitle,
    description,
    alternates: {canonical},
    openGraph: {
      type: 'website',
      url: canonical,
      title: resolvedTitle,
      description,
      siteName: fallback.title ?? 'Vazeer Art',
      ...(image ? {images: [{url: ogImageUrl(image), width: 1200, height: 630, alt: image.alt}]} : {}),
    },
    twitter: {card: image ? 'summary_large_image' : 'summary', title: resolvedTitle, description},
  }
}
```

- [ ] **Step 4: Wire metadata into the layout and every route**

In `web/app/layout.tsx` add:

```tsx
import type {Metadata} from 'next'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {metadataBase: new URL(env.siteUrl), ...buildMetadata({seo: settings.seo, fallback: settings.seo, path: '/', siteUrl: env.siteUrl})}
}
```

Each page adds a `generateMetadata` (the data loaders are cached per request by `sanityFetch`, so calling them twice is cheap):

```tsx
// web/app/page.tsx (add)
export async function generateMetadata() {
  const [home, settings] = await Promise.all([getHome(), getSiteSettings()])
  return buildMetadata({seo: home.seo, fallback: settings.seo, path: '/', siteUrl: env.siteUrl, imageFallback: home.hero.mainImage})
}
```

```tsx
// web/app/work/page.tsx (add)
export async function generateMetadata() {
  const [work, settings] = await Promise.all([getWork(), getSiteSettings()])
  return buildMetadata({seo: work.seo, fallback: settings.seo, path: '/work', siteUrl: env.siteUrl, title: `${work.title} ${work.script}`, imageFallback: work.showreel.poster})
}
```

```tsx
// web/app/work/[slug]/page.tsx (add)
export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()])
  const project = pageProjects(projects).find((p) => p.slug === slug)
  if (!project) return {title: 'Not found'}
  return buildMetadata({seo: project.seo, fallback: settings.seo, path: `/work/${slug}`, siteUrl: env.siteUrl, title: `${project.title} — ${project.format}, ${project.year}`, imageFallback: project.cover})
}
```

```tsx
// web/app/frames/page.tsx (add)
export async function generateMetadata() {
  const [page, settings] = await Promise.all([getFramesPage(), getSiteSettings()])
  return buildMetadata({seo: page.seo, fallback: settings.seo, path: '/frames', siteUrl: env.siteUrl, title: page.heading})
}
```

```tsx
// web/app/about/page.tsx (add)
export async function generateMetadata() {
  const [about, settings] = await Promise.all([getAbout(), getSiteSettings()])
  return buildMetadata({seo: about.seo, fallback: settings.seo, path: '/about', siteUrl: env.siteUrl, title: about.hero.heading, imageFallback: about.hero.portrait})
}
```

```tsx
// web/app/contact/page.tsx (add)
export async function generateMetadata() {
  const [contact, settings] = await Promise.all([getContact(), getSiteSettings()])
  return buildMetadata({seo: contact.seo, fallback: settings.seo, path: '/contact', siteUrl: env.siteUrl, title: `${contact.script} ${contact.heading}`, imageFallback: contact.photo})
}
```

Add the matching imports (`env`, `buildMetadata`, and any loader not already imported) at the top of each file.

- [ ] **Step 5: Sitemap, robots, JSON-LD, 404**

```ts
// web/app/sitemap.ts
import type {MetadataRoute} from 'next'
import {getProjects} from '@/lib/data'
import {env} from '@/lib/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, '')
  const projects = await getProjects()
  const now = new Date()
  return [
    ...['/', '/work', '/frames', '/about', '/contact'].map((p) => ({url: `${base}${p}`, lastModified: now})),
    ...projects.filter((p) => !p.creditOnly).map((p) => ({url: `${base}/work/${p.slug}`, lastModified: now})),
  ]
}
```

```ts
// web/app/robots.ts
import type {MetadataRoute} from 'next'
import {env} from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {rules: [{userAgent: '*', allow: '/', disallow: ['/api/']}], sitemap: `${env.siteUrl.replace(/\/$/, '')}/sitemap.xml`}
}
```

```tsx
// web/components/seo/PersonJsonLd.tsx
import type {SiteSettingsVM} from '@/lib/viewmodel/site'

export function PersonJsonLd({settings, name, jobTitle}: {settings: SiteSettingsVM; name: string; jobTitle: string}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle,
    address: {'@type': 'PostalAddress', addressLocality: 'New Delhi', addressCountry: 'IN'},
    sameAs: settings.socials.map((s) => s.url),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />
}
```

Render it in `web/app/about/page.tsx` inside `<main>`: `<PersonJsonLd settings={settings} name={about.hero.heading} jobTitle={about.statement.headingAccent} />` (fetch `settings` with `getSiteSettings()` in that page).

```css
/* web/app/not-found.module.css */
.main{animation:pagein .8s cubic-bezier(.2,.8,.2,1) both;max-width:1480px;margin:0 auto;padding:clamp(56px,8vw,110px) clamp(16px,4vw,48px);display:flex;flex-direction:column;align-items:center;text-align:center;gap:24px}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(64px,7vw,110px);line-height:.6;color:#e8a24a}
.heading{margin:0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(96px,15vw,240px);line-height:.8}
.sub{margin:0;font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px;color:#b9b0a2}
.cta{all:unset;cursor:pointer;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #e8a24a;padding-bottom:6px}
```

```tsx
// web/app/not-found.tsx
import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <main className={styles.main}>
      <span className={styles.script}>cut!</span>
      <h1 className={styles.heading}>404</h1>
      <p className={styles.sub}>(that frame is not in the edit)</p>
      <Link href="/" className={`${styles.cta} hoverAmber asButton`}>Back to the start →</Link>
    </main>
  )
}
```

- [ ] **Step 6: Run tests, typecheck, build; inspect output**

```bash
cd web && npx vitest run && npm run typecheck && npm run build
grep -o '<title>[^<]*</title>' .next/server/app/work/pagal.html
curl -s http://localhost:3000/sitemap.xml | head -20   # with `npm run start` in another shell
```

Expected: PASS / 0 / build OK; the title is `Pagal — Music Video, 2022`; the sitemap lists 10 URLs for the seeded data; `/nope` renders the styled 404.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/lib/seo.ts web/lib/seo.test.ts web/app web/components/seo
git commit -m "feat(web): metadata, sitemap, robots, Person JSON-LD and styled 404

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Webhook revalidation fallback

**Files:**
- Create: `web/app/api/revalidate/route.ts`
- Test: `web/app/api/revalidate/route.test.ts`

**Interfaces:**
- Produces: `POST /api/revalidate` accepting a Sanity GROQ-powered webhook signed with `SANITY_REVALIDATE_SECRET`.

- [ ] **Step 1: Write the failing test**

```ts
// web/app/api/revalidate/route.test.ts
import {beforeEach, describe, expect, it, vi} from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({revalidatePath}))
let valid = true
vi.mock('next-sanity/webhook', () => ({parseBody: async () => ({isValidSignature: valid, body: {_type: 'project'}})}))

describe('POST /api/revalidate', () => {
  beforeEach(() => { revalidatePath.mockClear(); process.env.SANITY_REVALIDATE_SECRET = 's' })

  it('revalidates the whole layout on a valid signature', async () => {
    valid = true
    const {POST} = await import('./route')
    const res = await POST(new Request('http://localhost/api/revalidate', {method: 'POST', body: '{}'}))
    expect(res.status).toBe(200)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
  it('rejects an invalid signature', async () => {
    valid = false
    const {POST} = await import('./route')
    const res = await POST(new Request('http://localhost/api/revalidate', {method: 'POST', body: '{}'}))
    expect(res.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run api/revalidate`
Expected: FAIL — module not found.

- [ ] **Step 3: Route**

```ts
// web/app/api/revalidate/route.ts
import {revalidatePath} from 'next/cache'
import {parseBody} from 'next-sanity/webhook'
import {NextResponse, type NextRequest} from 'next/server'

type Payload = {_type?: string}

/** Fallback for the Live Content API (spec §4.2): any publish refreshes every route. */
export async function POST(request: NextRequest) {
  try {
    const {isValidSignature, body} = await parseBody<Payload>(request, process.env.SANITY_REVALIDATE_SECRET, true)
    if (!isValidSignature) return new NextResponse('Invalid signature', {status: 401})
    revalidatePath('/', 'layout')
    return NextResponse.json({revalidated: true, type: body?._type ?? null, now: Date.now()})
  } catch (err) {
    return new NextResponse((err as Error).message, {status: 500})
  }
}
```

- [ ] **Step 4: Run tests, typecheck**

Run: `cd web && npx vitest run && npm run typecheck`
Expected: PASS / 0.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/app/api/revalidate
git commit -m "feat(web): signed webhook route that revalidates every route

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Visual regression against the prototype

**Files:**
- Create: `web/playwright.config.ts`, `web/tests/e2e/visual.spec.ts`, `web/tests/e2e/freeze.ts`
- Modify: `web/package.json` (scripts `e2e:baseline`, `e2e`)

**Interfaces:**
- Produces: snapshots under `web/tests/e2e/visual.spec.ts-snapshots/` written from the prototype and compared against the site.

- [ ] **Step 1: Install browsers and add scripts**

```bash
cd web && npx playwright install chromium
```

Add to `package.json` scripts:

```json
"e2e:baseline": "VISUAL_SOURCE=original playwright test tests/e2e/visual.spec.ts --update-snapshots",
"e2e": "VISUAL_SOURCE=site playwright test"
```

- [ ] **Step 2: Config and freeze helper**

```ts
// web/playwright.config.ts
import {defineConfig} from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {toHaveScreenshot: {maxDiffPixelRatio: 0.01, animations: 'disabled'}},
  use: {colorScheme: 'dark', deviceScaleFactor: 1},
  webServer:
    process.env.VISUAL_SOURCE === 'site'
      ? {command: 'npm run build && npm run start', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 180_000}
      : undefined,
})
```

```ts
// web/tests/e2e/freeze.ts
import type {Page} from '@playwright/test'

/** Same freeze on both sides so the diff measures layout + type, not motion or photos. */
export const FREEZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  [data-reveal] { opacity: 1 !important; translate: none !important; }
  img, video, image-slot { visibility: hidden !important; }
`

export async function skipLeaderAndFreeze(page: Page, route: {page: string; slug?: string}) {
  await page.addInitScript((r) => {
    sessionStorage.setItem('vazeer-leader', '1')
    localStorage.setItem('vazeer-v2-route', JSON.stringify({page: r.page, slug: r.slug ?? null}))
  }, route)
}

export async function settle(page: Page) {
  await page.addStyleTag({content: FREEZE_CSS})
  await page.evaluate(() => {
    document.querySelectorAll('[data-tc]').forEach((el) => { el.textContent = '00:00:00:00' })
    document.documentElement.dataset.leader = ''
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}
```

- [ ] **Step 3: The spec**

```ts
// web/tests/e2e/visual.spec.ts
import {resolve} from 'node:path'
import {expect, test} from '@playwright/test'
import {settle, skipLeaderAndFreeze} from './freeze'

const SOURCE = process.env.VISUAL_SOURCE === 'original' ? 'original' : 'site'
const ORIGINAL = 'file://' + resolve(__dirname, '../../../design-reference/original.html')
const SITE = 'http://localhost:3000'

const SCREENS: {name: string; proto: {page: string; slug?: string}; path: string}[] = [
  {name: 'home', proto: {page: 'home'}, path: '/'},
  {name: 'work', proto: {page: 'work'}, path: '/work'},
  {name: 'project-pagal', proto: {page: 'project', slug: 'pagal'}, path: '/work/pagal'},
  {name: 'frames', proto: {page: 'frames'}, path: '/frames'},
  {name: 'about', proto: {page: 'about'}, path: '/about'},
  {name: 'contact', proto: {page: 'contact'}, path: '/contact'},
]
const WIDTHS = [{w: 1440, h: 900}, {w: 1024, h: 768}, {w: 390, h: 844}]

for (const screen of SCREENS) {
  for (const {w, h} of WIDTHS) {
    test(`${screen.name} @ ${w}`, async ({page}) => {
      await page.setViewportSize({width: w, height: h})
      await skipLeaderAndFreeze(page, screen.proto)
      if (SOURCE === 'original') {
        await page.goto(ORIGINAL)
        await page.waitForSelector('header', {timeout: 30_000})
      } else {
        await page.goto(SITE + screen.path)
        await page.waitForSelector('header')
      }
      await settle(page)
      await expect(page).toHaveScreenshot(`${screen.name}-${w}.png`, {fullPage: true})
    })
  }
}
```

- [ ] **Step 4: Write baselines from the prototype, then compare the site**

```bash
cd web && npm run e2e:baseline
npm run e2e
```

Expected: the baseline run writes 18 PNGs; the compare run passes. Where a test fails, open `playwright-report/` (`npx playwright show-report`), locate the differing region, fix the CSS or markup in the owning component so the site matches the prototype, re-run `npm run e2e`. Never edit the baselines to make a test pass.

Known acceptable differences to account for before declaring a real bug: the site's links are `<a>` where the prototype had `<button>` (no visual change when `all:unset` is applied); the prototype's hidden `image-slot` boxes leave the same `background` colour as the site's hidden `img` containers.

If loading `original.html` over `file://` is flaky (blank page after 30 s), serve it instead: `npx --yes serve ../design-reference -l 8081` and set `ORIGINAL` to `http://localhost:8081/original.html` (spec §12).

- [ ] **Step 4b: Motion parity pass (manual, recorded)**

With `npm run dev` running and `design-reference/original.html` open in a second tab at 1440 px, walk spec §3.3 row by row and tick each one in a comment on the commit or in `docs/superpowers/plans/motion-parity-2026-09-29.md`:

1. Leader: 3 → 2 → 1 at 0.7 s steps, fade at 2.1 s, gone at 2.7 s, ring spinning; not repeated on reload in the same tab.
2. Hero: word `rise` clip reveal, frame `popin`, script `popin` late, polaroids `dropin` then float; hero starts as the leader fades.
3. Parallax: move the mouse across the hero; layers drift with the same depth ordering; scroll down 600 px and the layers shift as in the prototype.
4. Ken Burns on hero, currently, showreel, project cover, about finale (16/20/22/18/22 s).
5. Marquee speed and seamless wrap.
6. Reveal: below-fold blocks rise 56 px with the three-step stagger; above-fold blocks never flash.
7. Page enter on every navigation.
8. Project HUD: REC blink at 1 s steps, timecode counting 25 fps.
9. Grain flicker; play button pulse; hover colours (amber on dark, rust on cream); explore cards lift 8 px.

Record a 20-second GIF of the home page load and hero interaction with a screen recorder and attach it to the PR or keep it under `docs/superpowers/plans/`. Any mismatch is a bug: fix it in the owning component before continuing.

- [ ] **Step 5: Commit (baselines included)**

```bash
cd ..
git add web/playwright.config.ts web/tests/e2e web/package.json
git commit -m "test(web): screenshot parity with the prototype at 1440/1024/390

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Lighthouse gate

**Files:**
- Create: `web/tools/lighthouse.mjs`
- Modify: `web/package.json` (script `perf`)

- [ ] **Step 1: Script**

```js
// web/tools/lighthouse.mjs — run against `npm run start` on :3000
import {execSync} from 'node:child_process'
import {readFileSync} from 'node:fs'

const url = process.argv[2] || 'http://localhost:3000/'
execSync(`npx --yes lighthouse ${url} --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=./lighthouse.json --chrome-flags="--headless=new" --quiet`, {stdio: 'inherit'})
const report = JSON.parse(readFileSync('./lighthouse.json', 'utf8'))
const score = Math.round(report.categories.performance.score * 100)
const lcp = report.audits['largest-contentful-paint'].displayValue
const cls = report.audits['cumulative-layout-shift'].displayValue
console.log(`Performance ${score} · LCP ${lcp} · CLS ${cls}`)
if (score < 90) { console.error('✗ below 90'); process.exit(1) }
```

Add `"perf": "node tools/lighthouse.mjs"` to scripts and `lighthouse.json` to `web/.gitignore`.

- [ ] **Step 2: Run it**

```bash
cd web && npm run build && (npm run start & sleep 5 && npm run perf; kill %1)
```

Expected: `Performance ≥ 90`. If below: confirm the hero image has `priority`, that no page ships GSAP-sized bundles (`npm run build` prints First Load JS; the home route should be well under 150 kB), and that fonts are subset to `latin`. Fix and re-run.

- [ ] **Step 3: CI workflow (spec §10: schema validate + typegen drift in CI)**

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  studio:
    runs-on: ubuntu-latest
    defaults: {run: {working-directory: studio}}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: 22, cache: npm, cache-dependency-path: studio/package-lock.json}
      - run: npm ci
      - run: npm test
      - run: npm run typecheck
      - run: npm run schema:validate
      - run: npm run schema:extract && git diff --exit-code -- schema.json
  web:
    runs-on: ubuntu-latest
    defaults: {run: {working-directory: web}}
    env:
      NEXT_PUBLIC_SANITY_PROJECT_ID: iq6do512
      NEXT_PUBLIC_SANITY_DATASET: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: 22, cache: npm, cache-dependency-path: web/package-lock.json}
      - run: npm ci
      - run: npm test
      - run: npm run typecheck
      - run: npm run verify:styles
```

The web build itself runs on Vercel, where the tokens live; CI stays network-free.

- [ ] **Step 4: Commit**

```bash
cd ..
git add web/tools/lighthouse.mjs web/package.json web/.gitignore .github/workflows/ci.yml
git commit -m "chore: Lighthouse mobile gate and CI for schema, types, styles

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Production deployment (human-assisted)

**Files:**
- Modify: `README.md` (deployment + editor hand-over)
- Modify: `studio/.env.example` (document the production preview URL)

- [ ] **Step 1: Push the repository**

Ask the human to create an empty GitHub repository (in Vazeer's or their own account) and run:

```bash
git remote add origin git@github.com:<owner>/vazeer-web.git
git push -u origin main
```

- [ ] **Step 2: Create the Vercel project (human, in the browser)**

At vercel.com → Add New Project → import the repo → **Root Directory: `web`** → Framework: Next.js → add environment variables for Production and Preview:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `iq6do512` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2026-09-29` |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | `https://vazeerart.sanity.studio` |
| `NEXT_PUBLIC_SITE_URL` | the production URL (e.g. `https://vazeerart.com`, or the `*.vercel.app` URL until the domain is attached) |
| `SANITY_API_READ_TOKEN` | the Viewer token |
| `SANITY_API_WRITE_TOKEN` | the Editor token |
| `SANITY_REVALIDATE_SECRET` | output of `openssl rand -hex 24` |

Deploy. Expected: build succeeds, the `*.vercel.app` URL renders the home page with seeded content.

- [ ] **Step 3: CORS for the production origin**

```bash
npx sanity cors add https://<production-domain> --credentials --project iq6do512
npx sanity cors add https://<project>.vercel.app --credentials --project iq6do512
```

- [ ] **Step 4: Point the Studio's preview at production and redeploy**

```bash
cd studio
echo "SANITY_STUDIO_PREVIEW_URL=https://<production-domain>" > .env.production
npm run deploy
```

Open `https://vazeerart.sanity.studio` → Presentation. Expected: the live site loads inside the pane; clicking the intro heading opens the Home document at `intro.heading`; editing it updates the preview as a draft; Publish makes the change visible on the production URL within a minute (reload).

- [ ] **Step 5: Optional webhook (only if the Live API misbehaves)**

At `https://www.sanity.io/manage/project/iq6do512/api#webhooks` → Create: URL `https://<production-domain>/api/revalidate`, dataset `production`, trigger on create/update/delete, filter `_type in ["siteSettings","homePage","workPage","framesPage","aboutPage","contactPage","project","frame"]`, HTTP method POST, secret = `SANITY_REVALIDATE_SECRET`. Test with "Send test" → Vercel function log shows `revalidated: true`.

- [ ] **Step 6: Hand-over note for the editor**

Append to `README.md`:

```markdown
## Editing the site (for Vazeer)

1. Open https://vazeerart.sanity.studio and sign in.
2. Left sidebar: **Site settings, Home, Work & Reels, Frames page, About, Contact** hold every text and picture on those screens. **Projects** and **Frames** are lists — use “+” to add, drag the handle to reorder.
3. Click **Presentation** (top bar) to see the live site and click any text or photo to jump to its field.
4. Every change is a draft until you press **Publish**. Published changes appear on the site within about a minute.
5. Videos: paste a YouTube or Vimeo link into a project’s **YouTube or Vimeo URL** (and the showreel’s) — the play button appears automatically.
6. Contact requests arrive under **Inquiries**; the dot marks unread ones. Tick **Read** when handled.
7. Toggles under Site settings → Toggles turn the intro countdown, marquee band, film grain and REC overlay on or off.
```

- [ ] **Step 7: Final verification and commit**

Run against production: `cd web && node tools/lighthouse.mjs https://<production-domain>/` (expect ≥ 90), open every route on a phone, submit a test inquiry and confirm it appears in the Studio, then delete it there.

```bash
git add README.md studio/.env.example
git commit -m "docs: production deployment and editor hand-over

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```

Release complete. Remaining items from spec §13 (email notifications, Instagram import, analytics) are deliberately out of scope.
