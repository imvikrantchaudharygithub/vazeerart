# Vazeer Art — Plan 02: Web Foundation (scaffold, styles, Sanity data layer, motion)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `web/` Next.js 16 package with the exact design tokens, keyframes and fonts, a typed Sanity data layer producing view models, and the motion primitives (parallax, reveal, timecode, leader) that every later section relies on.

**Architecture:** `web/` is an independent npm package. `styles/` holds tokens, the prototype's keyframes verbatim, four hover classes and globals. `lib/sanity/` wraps `next-sanity` (client, live fetch, image URL builder). `lib/viewmodel/` maps GROQ results into flat, non-null view models that components consume. `lib/motion/` holds every animation constant and pure helper; `components/motion/` holds the client components that use them. A `tools/verify-styles.mjs` script proves each prototype inline style was copied into a CSS Module verbatim.

**Tech Stack:** Node 22, next 16.3, react 19.2, next-sanity 13.3, @sanity/image-url 2.1, TypeScript 5, CSS Modules, next/font/google, Vitest 3 + @testing-library/react + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-29-vazeer-portfolio-design.md` (§3.3, §3.4, §4, §5.2–5.5, §6, §8, §11)

**Depends on:** Plan 01 (schema.json, seeded dataset, tokens in `web/.env.local`).

## Global Constraints

- Node `>=22.12` via `nvm use` at repo root.
- Fonts: Anton 400 · Bodoni Moda italic 400 · Instrument Sans 400/600 · Mrs Saint Delafield 400, all via `next/font/google`, exposed as `--font-anton`, `--font-bodoni`, `--font-instrument`, `--font-delafield`.
- CSS values are copied **verbatim** from `design-reference/markup.html`; only `font-family:'X',fallback` becomes `font-family:var(--font-x),fallback`. One CSS Module class per prototype element; no class composition except the four hover classes, `asButton`, `pagein`, and state modifiers driven by data.
- No GSAP, no Lenis, no animation library. Motion constants live only in `lib/motion/constants.ts`.
- Every image renders through `<SanityImage>` (fill, object-fit cover, hotspot → object-position). GIFs render unoptimized from the original URL.
- Sanity project `iq6do512`, dataset `production`, API version `2026-09-29`.
- Tests: Vitest for logic, RTL for components. Run `npm test` before every commit.
- Commit after every task; end commit bodies with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Repeat visitor within the same tab session** → no leader, hero animates immediately. Task 6 tests the sessionStorage gate and that `data-leader` is never set.
2. **User with `prefers-reduced-motion: reduce`** → no leader, parallax loop never starts, reveal shows content instantly. Task 6 tests the `matchMedia` branch in the leader boot logic and `ParallaxLoop`.
3. **Image without hotspot or crop, or an asset with no metadata dimensions** → still renders, centered. Task 3 tests `objectPositionFor(null)` and `toImageVM` with missing metadata.
4. **Timecode after a long session (> 1 hour)** → hours roll and never show `24`. Task 5 tests the `%24` wrap.
5. **Reveal element already in view at scan** → stays visible, no flash to opacity 0. Task 5 tests `shouldSkipReveal` and Task 6 tests the observer skips it.

---

### Task 1: Web package scaffold

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/next-env.d.ts` (generated), `web/.env.example`, `web/.gitignore`, `web/vitest.config.ts`, `web/tests/setup.ts`
- Create: `web/app/layout.tsx` (placeholder), `web/app/page.tsx` (placeholder)
- Create: `web/lib/env.ts`
- Test: `web/lib/env.test.ts`

**Interfaces:**
- Produces: `env` object from `lib/env.ts` with `projectId`, `dataset`, `apiVersion`, `studioUrl`, `siteUrl`; npm scripts `dev`, `build`, `start`, `test`, `test:watch`, `typecheck`, `verify:styles`, `e2e`.

- [ ] **Step 1: Initialise and install**

```bash
cd "/Users/vikrantchaudhary/Desktop/vazeer portfolios/vazeer_web"
source ~/.nvm/nvm.sh && nvm use
mkdir -p web && cd web
npm init -y >/dev/null
npm install next@latest react@latest react-dom@latest next-sanity@latest @sanity/image-url@latest @sanity/client@latest styled-components@latest zod@latest
npm install -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest vitest@latest @vitejs/plugin-react@latest jsdom@latest @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest @playwright/test@latest
```

Expected: `next` 16.3.x, `next-sanity` 13.3.x, `react` 19.2.x. `styled-components` is only a peer dependency of next-sanity; it is never imported by the site.

- [ ] **Step 2: Replace package.json metadata and scripts**

```json
{
  "name": "vazeer-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:styles": "node tools/verify-styles.mjs",
    "e2e": "playwright test"
  }
}
```

(keep the generated `dependencies` and `devDependencies` blocks.)

- [ ] **Step 3: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]},
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "tests/e2e/**"]
}
```

- [ ] **Step 4: next.config.ts**

```ts
// web/next.config.ts
import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{protocol: 'https', hostname: 'cdn.sanity.io'}],
  },
}

export default nextConfig
```

- [ ] **Step 5: env module and its test**

```ts
// web/lib/env.test.ts
import {describe, expect, it} from 'vitest'
import {readEnv} from './env'

describe('readEnv', () => {
  it('reads public values with defaults', () => {
    const env = readEnv({NEXT_PUBLIC_SANITY_PROJECT_ID: 'iq6do512', NEXT_PUBLIC_SANITY_DATASET: 'production'})
    expect(env.projectId).toBe('iq6do512')
    expect(env.dataset).toBe('production')
    expect(env.apiVersion).toBe('2026-09-29')
    expect(env.studioUrl).toBe('http://localhost:3333')
    expect(env.siteUrl).toBe('http://localhost:3000')
  })
  it('throws when the project id is missing', () => {
    expect(() => readEnv({})).toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/)
  })
})
```

```ts
// web/lib/env.ts
type Source = Record<string, string | undefined>

export function readEnv(source: Source) {
  const projectId = source.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = source.NEXT_PUBLIC_SANITY_DATASET
  if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  if (!dataset) throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET')
  return {
    projectId,
    dataset,
    apiVersion: source.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-29',
    studioUrl: source.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
    siteUrl: source.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  }
}

// Next.js inlines NEXT_PUBLIC_* only when accessed as literal property paths.
export const env = readEnv({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  NEXT_PUBLIC_SANITY_STUDIO_URL: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})
```

- [ ] **Step 6: Vitest config, setup, env files, gitignore**

```ts
// web/vitest.config.ts
import path from 'node:path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'tests/e2e/**'],
    // lib/env.ts throws without these; tests never talk to Sanity.
    env: {NEXT_PUBLIC_SANITY_PROJECT_ID: 'iq6do512', NEXT_PUBLIC_SANITY_DATASET: 'production'},
  },
  resolve: {alias: {'@': path.resolve(__dirname)}},
})
```

```ts
// web/tests/setup.ts
import '@testing-library/jest-dom/vitest'
```

```bash
# web/.env.example
NEXT_PUBLIC_SANITY_PROJECT_ID=iq6do512
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-09-29
NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=
SANITY_REVALIDATE_SECRET=
```

```gitignore
# web/.gitignore
node_modules/
.next/
out/
.env
.env.*
!.env.example
coverage/
playwright-report/
test-results/
*.tsbuildinfo
next-env.d.ts
```

Then `cp .env.example .env.local` and ask the human to paste the two tokens from Plan 01 Task 9 into `.env.local`.

- [ ] **Step 7: Placeholder app files**

```tsx
// web/app/layout.tsx
import type {ReactNode} from 'react'

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// web/app/page.tsx
export default function Page() {
  return <main>Vazeer Art</main>
}
```

- [ ] **Step 8: Run tests, typecheck and build**

Run: `cd web && npm test && npm run typecheck && npm run build`
Expected: env tests PASS; typecheck 0; build prints `✓ Compiled successfully` and route `/`.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/package.json web/package-lock.json web/tsconfig.json web/next.config.ts web/.env.example web/.gitignore web/vitest.config.ts web/tests/setup.ts web/app web/lib/env.ts web/lib/env.test.ts
git commit -m "feat(web): scaffold Next.js 16 package with Vitest

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Design tokens, keyframes, hover classes, fonts, and the style verifier

**Files:**
- Create: `web/styles/tokens.css`, `web/styles/keyframes.css`, `web/styles/hover.css`, `web/styles/globals.css`
- Create: `web/lib/fonts.ts`
- Modify: `web/app/layout.tsx`
- Create: `web/tools/verify-styles.mjs`, `web/tools/lib/styleCoverage.mjs`
- Test: `web/styles/keyframes.test.ts`, `web/tools/lib/styleCoverage.test.ts`

**Interfaces:**
- Produces: global classes `.site`, `.pagein`, `.asButton`, `.hoverAmber`, `.hoverRust`, `.hoverLift`, `.hoverBgRust`; CSS vars `--font-*` and colour tokens; `fontVariables` string from `lib/fonts.ts`; CLI `npm run verify:styles -- --lines A-B`.

- [ ] **Step 1: Write the failing tests**

```ts
// web/styles/keyframes.test.ts
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {describe, expect, it} from 'vitest'

const NAMES = ['recblink', 'marquee', 'rise', 'dropin', 'popin', 'float', 'kenburns', 'pagein', 'spin', 'glow', 'scrollcue', 'pulse', 'grainshift']

describe('keyframes.css', () => {
  const lines = (file: string) => readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('@keyframes'))
  const ours = lines(resolve(__dirname, 'keyframes.css'))
  const reference = lines(resolve(__dirname, '../../design-reference/keyframes.css'))

  it('contains every prototype keyframe line, byte-identical', () => {
    expect(reference).toHaveLength(NAMES.length)
    for (const line of reference) {
      expect(ours, line.slice(0, 40)).toContain(line)
    }
    for (const name of NAMES) {
      expect(ours.some((l) => l.startsWith(`@keyframes ${name}{`)), name).toBe(true)
    }
  })
})
```

```js
// web/tools/lib/styleCoverage.test.ts
import {describe, expect, it} from 'vitest'
import {coverage, extractMarkupStyles, normalizeDeclarations, parseCssRules} from './styleCoverage.mjs'

describe('normalizeDeclarations', () => {
  it('drops bound declarations and rewrites font families', () => {
    const decls = normalizeDeclarations("color:{{ n.color }};font-family:'Anton',sans-serif; Font-Size: 12px ;")
    expect(decls).toEqual(['font-family:var(--font-anton),sans-serif', 'font-size:12px'])
  })
})

describe('extractMarkupStyles', () => {
  it('captures every style attribute with its line number', () => {
    const out = extractMarkupStyles('<div style="a:1">\n<span style="b:2"><i style="c:3"></i></span>')
    expect(out).toEqual([
      {line: 1, decls: ['a:1']},
      {line: 2, decls: ['b:2']},
      {line: 2, decls: ['c:3']},
    ])
  })
})

describe('coverage', () => {
  const rules = parseCssRules('.x{a:1;b:2}\n.y:hover{c:3}')
  it('covers an element when one rule is a superset of its declarations', () => {
    expect(coverage([{line: 1, decls: ['a:1']}], rules)).toEqual([])
    expect(coverage([{line: 4, decls: ['a:1', 'z:9']}], rules)).toEqual([{line: 4, missing: ['z:9']}])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run styles tools`
Expected: FAIL — files not found.

- [ ] **Step 3: Write tokens.css and keyframes.css**

```css
/* web/styles/tokens.css — spec §3.4 */
:root {
  --bg: #0f0d0b;
  --cream: #efe7da;
  --amber: #e8a24a;
  --rust: #a4501a;
  --card: #1c1916;
  --ink: #14110e;
  --muted: #b9b0a2;
  --muted-2: #5e564c;
  --body-dark: #3d372f;
  --cream-2: #d9d0c1;
  --rec: #e5382b;
  --ease-out: cubic-bezier(.2,.8,.2,1);
}
```

`web/styles/keyframes.css` — copy the `@keyframes` lines from `design-reference/keyframes.css` exactly (all 13, from `recblink` to `grainshift`):

```bash
cd web && grep '^@keyframes' ../design-reference/keyframes.css > styles/keyframes.css && wc -l styles/keyframes.css
```

Expected: `13 styles/keyframes.css`.

- [ ] **Step 4: Write hover.css and globals.css**

```css
/* web/styles/hover.css — the prototype's style-hover attributes (spec §5.2) */
/* Links that were <button> in the prototype must not pick up the global a:hover colour. Keep this rule first. */
.asButton:hover { color: inherit; }
.hoverAmber:hover { color: #e8a24a; }
.hoverRust:hover { color: #a4501a; }
.hoverLift:hover { transform: translateY(-8px); }
.hoverBgRust:hover { background: #a4501a; }
```

```css
/* web/styles/globals.css */
@import './tokens.css';
@import './keyframes.css';
@import './hover.css';

/* Base rules from design-reference/keyframes.css */
html,body{margin:0;background:#0f0d0b;color:#efe7da;-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}
a{color:inherit;text-decoration:none}
a:hover{color:#e8a24a}
::selection{background:#e8a24a;color:#0f0d0b}

/* Prototype page wrapper */
.site{min-height:100vh;background:#0f0d0b;color:#efe7da;font-family:var(--font-instrument),sans-serif;font-size:17px;line-height:1.6;overflow-x:hidden}

/* Every screen's <main> */
.pagein{animation:pagein .8s cubic-bezier(.2,.8,.2,1) both}

/* Leader ↔ hero timing (spec §5.4): hero entrance animations wait while the leader is on. */
html[data-leader="on"] [data-hero-anim]{animation-play-state:paused}
html:not([data-leader="on"]):not([data-leader="out"]) [data-leader-overlay]{display:none}

/* Spec §5.5 — the only intentional deviation from the prototype */
@media (prefers-reduced-motion: reduce) {
  [data-hero-anim], [data-reveal] { animation: none !important; opacity: 1 !important; translate: none !important; }
  [data-motion="loop"] { animation: none !important; }
}
```

- [ ] **Step 5: Fonts module and layout**

```ts
// web/lib/fonts.ts
import {Anton, Bodoni_Moda, Instrument_Sans, Mrs_Saint_Delafield} from 'next/font/google'

const anton = Anton({weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-anton'})
const bodoni = Bodoni_Moda({weight: '400', style: 'italic', subsets: ['latin'], display: 'swap', variable: '--font-bodoni'})
const instrument = Instrument_Sans({weight: ['400', '600'], subsets: ['latin'], display: 'swap', variable: '--font-instrument'})
const delafield = Mrs_Saint_Delafield({weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-delafield'})

export const fontVariables = [anton.variable, bodoni.variable, instrument.variable, delafield.variable].join(' ')
```

```tsx
// web/app/layout.tsx
import type {ReactNode} from 'react'
import {fontVariables} from '@/lib/fonts'
import '@/styles/globals.css'

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <div className="site">{children}</div>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Write the style coverage library and CLI**

```js
// web/tools/lib/styleCoverage.mjs
const FONT_MAP = [
  ["'anton',sans-serif", 'var(--font-anton),sans-serif'],
  ["'bodoni moda',serif", 'var(--font-bodoni),serif'],
  ["'instrument sans',sans-serif", 'var(--font-instrument),sans-serif'],
  ["'mrs saint delafield',cursive", 'var(--font-delafield),cursive'],
]

/** "a:1; B : 2 ;color:{{x}}" → ["a:1","b:2"] (bound declarations dropped, fonts rewritten). */
export function normalizeDeclarations(styleText) {
  return styleText
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d) => !d.includes('{{'))
    .map((d) => {
      const idx = d.indexOf(':')
      const prop = d.slice(0, idx).trim().toLowerCase()
      let value = d.slice(idx + 1).trim().replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ')
      if (prop === 'font-family') {
        const lower = value.toLowerCase()
        for (const [from, to] of FONT_MAP) if (lower === from) value = to
      }
      return `${prop}:${value}`
    })
}

/** Every style="…" in the markup, with 1-based line numbers. */
export function extractMarkupStyles(markup) {
  const out = []
  markup.split('\n').forEach((text, i) => {
    for (const m of text.matchAll(/style="([^"]*)"/g)) {
      out.push({line: i + 1, decls: normalizeDeclarations(m[1])})
    }
  })
  return out
}

/** Flatten all CSS rule bodies (ignoring selectors) into normalized declaration arrays. */
export function parseCssRules(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  for (const m of noComments.matchAll(/\{([^{}]*)\}/g)) {
    const decls = normalizeDeclarations(m[1])
    if (decls.length) rules.push(decls)
  }
  return rules
}

/** Elements whose static declarations are not all present in a single rule. */
export function coverage(elements, rules) {
  const sets = rules.map((r) => new Set(r))
  const uncovered = []
  for (const el of elements) {
    if (el.decls.length === 0) continue
    let best = null
    for (const set of sets) {
      const missing = el.decls.filter((d) => !set.has(d))
      if (missing.length === 0) { best = []; break }
      if (!best || missing.length < best.length) best = missing
    }
    if (best && best.length) uncovered.push({line: el.line, missing: best})
  }
  return uncovered
}
```

```js
// web/tools/verify-styles.mjs
// Usage: node tools/verify-styles.mjs [--lines 1-140]
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {coverage, extractMarkupStyles, parseCssRules} from './lib/styleCoverage.mjs'

const root = resolve(process.cwd())
const markup = readFileSync(resolve(root, '../design-reference/markup.html'), 'utf8')

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (p.endsWith('.css')) acc.push(p)
  }
  return acc
}

const rules = walk(root).flatMap((f) => parseCssRules(readFileSync(f, 'utf8')))
let elements = extractMarkupStyles(markup)

const arg = process.argv.indexOf('--lines')
if (arg !== -1) {
  const [a, b] = process.argv[arg + 1].split('-').map(Number)
  elements = elements.filter((e) => e.line >= a && e.line <= b)
}

const uncovered = coverage(elements, rules)
if (uncovered.length === 0) {
  console.log(`✓ ${elements.length} prototype elements covered by ${rules.length} CSS rules`)
  process.exit(0)
}
for (const u of uncovered) console.log(`line ${u.line}: missing ${u.missing.join(' | ')}`)
console.log(`✗ ${uncovered.length} of ${elements.length} elements not covered`)
process.exit(1)
```

- [ ] **Step 7: Run tests, verify the CLI runs, build**

Run: `cd web && npm test && node tools/verify-styles.mjs --lines 1-1 ; npm run build`
Expected: tests PASS; the CLI prints `✓ 1 prototype elements covered` (line 1 of the markup is the `.site` wrapper, now covered by globals.css); build succeeds and the HTML `<html class="…">` carries four font variables (check `.next/server/app/index.html` contains `--font-anton`).

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/styles web/lib/fonts.ts web/app/layout.tsx web/tools
git commit -m "feat(web): design tokens, verbatim keyframes, hover classes, fonts, style verifier

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Sanity client, live fetch, image URLs, SanityImage and MediaSlot

**Files:**
- Create: `web/lib/sanity/client.ts`, `web/lib/sanity/live.ts`, `web/lib/sanity/writeClient.ts`, `web/lib/sanity/image.ts`
- Create: `web/lib/viewmodel/types.ts`
- Create: `web/components/media/SanityImage.tsx`, `web/components/media/MediaSlot.tsx`, `web/components/media/MediaSlot.module.css`
- Test: `web/lib/sanity/image.test.ts`, `web/components/media/SanityImage.test.tsx`, `web/components/media/MediaSlot.test.tsx`

**Interfaces:**
- Produces: `client`, `sanityFetch`, `SanityLive`, `writeClient`; `imageSrc(image: ImageVM): string`, `sanityImageLoader({src,width,quality}): string`, `objectPositionFor(hotspot): string`; `ImageVM`, `MediaVM`, `SeoVM`, `LinkVM`, `PageKey`, `PAGE_KEYS`, `PAGE_ROUTES`; `<SanityImage image sizes priority? className? />`, `<MediaSlot media sizes />`.

- [ ] **Step 1: View-model types shared by everything**

```ts
// web/lib/viewmodel/types.ts
export const PAGE_KEYS = ['home', 'about', 'work', 'frames', 'contact'] as const
export type PageKey = (typeof PAGE_KEYS)[number]
export const PAGE_ROUTES: Record<PageKey, string> = {home: '/', about: '/about', work: '/work', frames: '/frames', contact: '/contact'}

export type Hotspot = {x: number; y: number; width: number; height: number}
export type Crop = {top: number; bottom: number; left: number; right: number}

export type ImageVM = {
  assetId: string
  url: string
  width: number
  height: number
  extension: string
  lqip: string | null
  alt: string
  hotspot: Hotspot | null
  crop: Crop | null
}

export type MediaVM = {kind: 'image'; image: ImageVM} | {kind: 'video'; url: string}

export type SeoVM = {title: string | null; description: string | null; image: ImageVM | null}
export type LinkVM = {label: string; url: string}
```

- [ ] **Step 2: Write the failing tests**

```ts
// web/lib/sanity/image.test.ts
import {describe, expect, it} from 'vitest'
import type {ImageVM} from '@/lib/viewmodel/types'
import {imageSrc, objectPositionFor, sanityImageLoader} from './image'

const base: ImageVM = {
  assetId: 'image-abc123-1400x900-jpg',
  url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg',
  width: 1400, height: 900, extension: 'jpg', lqip: null, alt: 'x', hotspot: null, crop: null,
}

describe('imageSrc', () => {
  it('builds the CDN url from the asset id', () => {
    expect(imageSrc(base)).toBe('https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg')
  })
  it('applies a crop rect when present', () => {
    const src = imageSrc({...base, crop: {top: 0.1, bottom: 0.1, left: 0, right: 0}})
    expect(src).toContain('rect=0,90,1400,720')
  })
})

describe('sanityImageLoader', () => {
  it('appends width, quality 65, auto format and fit max', () => {
    const out = sanityImageLoader({src: base.url, width: 800})
    const u = new URL(out)
    expect(u.searchParams.get('w')).toBe('800')
    expect(u.searchParams.get('q')).toBe('65')
    expect(u.searchParams.get('auto')).toBe('format')
    expect(u.searchParams.get('fit')).toBe('max')
  })
  it('keeps an existing rect and honours explicit quality', () => {
    const out = sanityImageLoader({src: base.url + '?rect=0,90,1400,720', width: 400, quality: 80})
    expect(out).toContain('rect=0%2C90%2C1400%2C720')
    expect(out).toContain('q=80')
  })
})

describe('objectPositionFor', () => {
  it('maps hotspot to percentages and defaults to center', () => {
    expect(objectPositionFor({x: 0.25, y: 0.75, width: 0.2, height: 0.2})).toBe('25.00% 75.00%')
    expect(objectPositionFor(null)).toBe('50% 50%')
  })
})
```

```tsx
// web/components/media/SanityImage.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ImageVM} from '@/lib/viewmodel/types'
import {SanityImage} from './SanityImage'

const jpg: ImageVM = {
  assetId: 'image-abc123-1400x900-jpg',
  url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg',
  width: 1400, height: 900, extension: 'jpg', lqip: null, alt: 'A frame', hotspot: {x: 0.2, y: 0.4, width: 0.1, height: 0.1}, crop: null,
}

describe('SanityImage', () => {
  it('renders a cover image positioned by the hotspot, through the Sanity loader', () => {
    render(<SanityImage image={jpg} sizes="100vw" />)
    const img = screen.getByRole('img', {name: 'A frame'}) as HTMLImageElement
    expect(img.style.objectFit).toBe('cover')
    expect(img.style.objectPosition).toBe('20.00% 40.00%')
    expect(img.getAttribute('src')).toContain('auto=format')
  })
  it('serves GIFs untransformed', () => {
    const gif = {...jpg, extension: 'gif', url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-400x300.gif', assetId: 'image-abc123-400x300-gif'}
    render(<SanityImage image={gif} sizes="100vw" />)
    const img = screen.getByRole('img', {name: 'A frame'}) as HTMLImageElement
    expect(img.getAttribute('src')).toBe(gif.url)
  })
})
```

```tsx
// web/components/media/MediaSlot.test.tsx
import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {MediaSlot} from './MediaSlot'

describe('MediaSlot', () => {
  it('renders a muted looping video for video media', () => {
    const {container} = render(<MediaSlot media={{kind: 'video', url: 'https://cdn.sanity.io/files/x/y/loop.mp4'}} sizes="30vw" />)
    const video = container.querySelector('video')!
    expect(video).toBeTruthy()
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.getAttribute('playsinline')).not.toBeNull()
    expect(video.getAttribute('src')).toBe('https://cdn.sanity.io/files/x/y/loop.mp4')
  })
  it('renders nothing when media is null', () => {
    const {container} = render(<MediaSlot media={null} sizes="30vw" />)
    expect(container.innerHTML).toBe('')
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd web && npx vitest run lib/sanity components/media`
Expected: FAIL — modules not found.

- [ ] **Step 4: Client, live, write client**

```ts
// web/lib/sanity/client.ts
import {createClient} from 'next-sanity'
import {env} from '@/lib/env'

export const client = createClient({
  projectId: env.projectId,
  dataset: env.dataset,
  apiVersion: env.apiVersion,
  useCdn: true,
  stega: {studioUrl: env.studioUrl},
})
```

```ts
// web/lib/sanity/live.ts
import {defineLive} from 'next-sanity/live'
import {client} from './client'

const token = process.env.SANITY_API_READ_TOKEN

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
```

```ts
// web/lib/sanity/writeClient.ts
import 'server-only'
import {createClient} from 'next-sanity'
import {env} from '@/lib/env'

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) console.warn('SANITY_API_WRITE_TOKEN is not set — the contact form cannot store inquiries')

export const writeClient = createClient({
  projectId: env.projectId,
  dataset: env.dataset,
  apiVersion: env.apiVersion,
  useCdn: false,
  token,
})
```

Install the guard package: `npm install server-only`.

- [ ] **Step 5: Image helpers**

```ts
// web/lib/sanity/image.ts
import {createImageUrlBuilder} from '@sanity/image-url'
import {env} from '@/lib/env'
import type {Hotspot, ImageVM} from '@/lib/viewmodel/types'

const builder = createImageUrlBuilder({projectId: env.projectId, dataset: env.dataset})

/** CDN url for the asset with the editor's crop applied (no size params — the loader adds them). */
export function imageSrc(image: ImageVM): string {
  return builder
    .image({
      _type: 'image',
      asset: {_type: 'reference', _ref: image.assetId},
      crop: image.crop ?? undefined,
      hotspot: image.hotspot ?? undefined,
    })
    .url()
}

/** next/image loader: Sanity CDN does the resizing, Vercel's optimizer is never used (spec §8). */
export function sanityImageLoader({src, width, quality}: {src: string; width: number; quality?: number}): string {
  const url = new URL(src)
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality ?? 65))
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'max')
  return url.toString()
}

export function objectPositionFor(hotspot: Hotspot | null | undefined): string {
  if (!hotspot) return '50% 50%'
  return `${(hotspot.x * 100).toFixed(2)}% ${(hotspot.y * 100).toFixed(2)}%`
}
```

- [ ] **Step 6: SanityImage and MediaSlot**

```tsx
// web/components/media/SanityImage.tsx
import Image from 'next/image'
import {imageSrc, objectPositionFor, sanityImageLoader} from '@/lib/sanity/image'
import type {ImageVM} from '@/lib/viewmodel/types'

type Props = {image: ImageVM; sizes: string; priority?: boolean; className?: string}

/** Fills its positioned parent, like the prototype's <image-slot>. */
export function SanityImage({image, sizes, priority = false, className}: Props) {
  const isGif = image.extension === 'gif'
  return (
    <Image
      src={isGif ? image.url : imageSrc(image)}
      loader={isGif ? undefined : sanityImageLoader}
      unoptimized={isGif}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder={image.lqip ? 'blur' : 'empty'}
      blurDataURL={image.lqip ?? undefined}
      className={className}
      style={{objectFit: 'cover', objectPosition: objectPositionFor(image.hotspot)}}
    />
  )
}
```

```tsx
// web/components/media/MediaSlot.tsx
import type {MediaVM} from '@/lib/viewmodel/types'
import {SanityImage} from './SanityImage'
import styles from './MediaSlot.module.css'

type Props = {media: MediaVM | null; sizes: string; priority?: boolean}

export function MediaSlot({media, sizes, priority}: Props) {
  if (!media) return null
  if (media.kind === 'video') {
    return <video className={styles.video} src={media.url} autoPlay muted loop playsInline aria-hidden="true" />
  }
  return <SanityImage image={media.image} sizes={sizes} priority={priority} />
}
```

```css
/* web/components/media/MediaSlot.module.css */
.video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
```

- [ ] **Step 7: Run tests and typecheck**

Run: `cd web && npx vitest run && npm run typecheck`
Expected: PASS / 0.

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/lib/sanity web/lib/viewmodel/types.ts web/components/media web/package.json web/package-lock.json
git commit -m "feat(web): Sanity client, live fetch, image loader, SanityImage and MediaSlot

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: GROQ queries, generated types, view-model mappers, data loaders

**Files:**
- Create: `web/lib/sanity/queries.ts`
- Create: `web/lib/sanity/types.ts` (generated by `cd studio && npm run typegen`; committed)
- Create: `web/lib/viewmodel/images.ts`, `web/lib/viewmodel/site.ts`, `web/lib/viewmodel/projects.ts`, `web/lib/viewmodel/pages.ts`
- Create: `web/lib/data.ts`
- Test: `web/lib/viewmodel/images.test.ts`, `web/lib/viewmodel/projects.test.ts`, `web/lib/viewmodel/pages.test.ts`, `web/lib/viewmodel/site.test.ts`

**Interfaces:**
- Consumes: `sanityFetch` (Task 3), Plan 01 schema (field names).
- Produces:
  - queries: `SITE_SETTINGS_QUERY`, `HOME_QUERY`, `WORK_QUERY`, `FRAMES_PAGE_QUERY`, `FRAMES_QUERY`, `ABOUT_QUERY`, `CONTACT_QUERY`, `PROJECTS_QUERY`, `PROJECT_SLUGS_QUERY`
  - mappers: `toImageVM(raw)`, `toMediaVM(raw)`, `toSeoVM(raw)`, `toSiteSettingsVM(raw)`, `toHomeVM`, `toWorkVM`, `toFramesPageVM`, `toFramesVM`, `toAboutVM`, `toContactVM`, `deriveProjects(raw[]) → ProjectVM[]`, `pageProjects(vms)`, `filterProjects(vms, filter)`, `alternateOrder(visible)`, `nextProject(vms, slug)`, `showreelOrderNote(vms, prefix, override)`, `navEntries(pages, pathname)`, `preFooterEntries(pages, pathname)`, `activePageKey(pathname)`
  - loaders: `getSiteSettings()`, `getHome()`, `getWork()`, `getFramesPage()`, `getFrames()`, `getAbout()`, `getContact()`, `getProjects()`, `getProjectSlugs()`
  - VM types: `SiteSettingsVM`, `PageEntryVM`, `HomeVM`, `WorkVM`, `FramesPageVM`, `FrameVM`, `AboutVM`, `ContactVM`, `ProjectVM`, `WorkFilter = 'all' | 'cinematography' | 'editing'`

- [ ] **Step 1: Write the queries**

```ts
// web/lib/sanity/queries.ts
import {defineQuery} from 'next-sanity'

export const IMAGE_FIELDS = /* groq */ `{
  alt, hotspot, crop,
  asset->{ _id, url, extension, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "lqip": metadata.lqip }
}`

export const MEDIA_FIELDS = /* groq */ `{ kind, image ${IMAGE_FIELDS}, "videoUrl": video.asset->url }`

export const SEO_FIELDS = /* groq */ `{ title, description, image ${IMAGE_FIELDS} }`

export const PROJECT_FIELDS = /* groq */ `{
  _id, title, "slug": slug.current, format, year, role, category,
  cover ${IMAGE_FIELDS}, frameGrabs[] ${IMAGE_FIELDS}, videoUrl, showOnHome, creditOnly, seo ${SEO_FIELDS}
}`

export const SITE_SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  brandWord, brandScript, copyright,
  socials[]{ label, url },
  management{ label, handle, url }, dm{ label, handle, url },
  marqueeWords,
  pages[]{ key, navLabel, menuLabel, preFooterScript, preFooterLabel },
  leaderLeft, leaderRight, leaderSkip, menuScript, menuClose, menuSocialsLabel,
  menuPhoto ${IMAGE_FIELDS},
  showIntro, showMarquee, showGrain, showRec,
  seo ${SEO_FIELDS}
}`)

export const HOME_QUERY = defineQuery(`*[_id == "homePage"][0]{
  hero{ word, script, mainImage ${IMAGE_FIELDS}, polaroidLeft ${MEDIA_FIELDS}, polaroidRight ${MEDIA_FIELDS} },
  intro{ script, heading, subline, body, ctaLabel, imageA ${IMAGE_FIELDS}, imageB ${IMAGE_FIELDS} },
  reels{ headingBlock{ script, heading }, ctaLabel },
  explore{ headingBlock{ script, heading }, cards[]{ label, sub, target, image ${IMAGE_FIELDS} } },
  currently{ script, heading, body, ctaLabel, bgImage ${IMAGE_FIELDS} },
  seo ${SEO_FIELDS}
}`)

export const WORK_QUERY = defineQuery(`*[_id == "workPage"][0]{
  title, script, intro, filterAll, filterDop, filterEditor,
  showreel{ poster ${IMAGE_FIELDS}, videoUrl, label, orderNotePrefix, orderNoteOverride },
  numberPrefix, projectCta,
  skills{ headingBlock{ script, heading }, items[]{ label, tilt, media ${MEDIA_FIELDS} } },
  projectPage{ backLabel, reelPrefix, roleLabel, formatLabel, yearLabel, aspectLabel, grabsScript, grabsHeading, upNextScript },
  seo ${SEO_FIELDS}
}`)

export const FRAMES_PAGE_QUERY = defineQuery(`*[_id == "framesPage"][0]{
  script, heading, linkLabel, linkUrl, reelLabel, postLabel, seo ${SEO_FIELDS}
}`)

export const FRAMES_QUERY = defineQuery(`*[_type == "frame"] | order(orderRank){
  _id, image ${IMAGE_FIELDS}, ratio, instagramUrl
}`)

export const ABOUT_QUERY = defineQuery(`*[_id == "aboutPage"][0]{
  hero{ script, heading, body, ctaLabel, portrait ${IMAGE_FIELDS}, polaroid ${MEDIA_FIELDS} },
  statement{ headingPlain, headingAccent, paragraphs, aside },
  credits{ headingBlock{ script, heading }, imdbLabel, imdbUrl },
  finale{ script, sub, bgImage ${IMAGE_FIELDS} },
  seo ${SEO_FIELDS}
}`)

export const CONTACT_QUERY = defineQuery(`*[_id == "contactPage"][0]{
  script, heading, intro, photo ${IMAGE_FIELDS},
  form{ heading, typeQuestion, types, nameLabel, contactLabel, datesLabel, briefLabel, submitLabel },
  success{ script, body, resetLabel },
  seo ${SEO_FIELDS}
}`)

export const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(orderRank) ${PROJECT_FIELDS}`)

export const PROJECT_SLUGS_QUERY = defineQuery(`*[_type == "project" && creditOnly != true && defined(slug.current)]{ "slug": slug.current }`)
```

- [ ] **Step 2: Generate the types**

Run: `cd studio && npm run typegen`
Expected: `Generated TypeScript types for N schema types and 9 GROQ queries in 1 file into: ../web/lib/sanity/types.ts`. The file exports `SITE_SETTINGS_QUERYResult`, `HOME_QUERYResult`, `WORK_QUERYResult`, `FRAMES_PAGE_QUERYResult`, `FRAMES_QUERYResult`, `ABOUT_QUERYResult`, `CONTACT_QUERYResult`, `PROJECTS_QUERYResult`, `PROJECT_SLUGS_QUERYResult`. If it reports 0 queries, check `studio/sanity-typegen.json` `path` points at `../web/**/*.{ts,tsx}`.

- [ ] **Step 3: Write the failing mapper tests**

```ts
// web/lib/viewmodel/images.test.ts
import {describe, expect, it} from 'vitest'
import {toImageVM, toMediaVM} from './images'

const asset = {_id: 'image-abc-1400x900-jpg', url: 'https://cdn.sanity.io/images/p/d/abc-1400x900.jpg', extension: 'jpg', width: 1400, height: 900, lqip: 'data:image/jpeg;base64,xx'}

describe('toImageVM', () => {
  it('flattens the projection', () => {
    const vm = toImageVM({alt: 'A', hotspot: {x: 0.5, y: 0.5, width: 1, height: 1, _type: 'sanity.imageHotspot'}, crop: null, asset})
    expect(vm).toEqual({assetId: asset._id, url: asset.url, width: 1400, height: 900, extension: 'jpg', lqip: asset.lqip, alt: 'A', hotspot: {x: 0.5, y: 0.5, width: 1, height: 1}, crop: null})
  })
  it('returns null without an asset and tolerates missing metadata', () => {
    expect(toImageVM(null)).toBeNull()
    expect(toImageVM({alt: 'A', hotspot: null, crop: null, asset: null})).toBeNull()
    const vm = toImageVM({alt: null, hotspot: null, crop: null, asset: {...asset, width: null, height: null, lqip: null}})
    expect(vm?.width).toBe(0)
    expect(vm?.alt).toBe('')
  })
})

describe('toMediaVM', () => {
  it('maps video and image kinds, null when incomplete', () => {
    expect(toMediaVM({kind: 'video', image: null, videoUrl: 'https://cdn.sanity.io/files/p/d/x.mp4'})).toEqual({kind: 'video', url: 'https://cdn.sanity.io/files/p/d/x.mp4'})
    expect(toMediaVM({kind: 'image', image: {alt: 'A', hotspot: null, crop: null, asset}, videoUrl: null})?.kind).toBe('image')
    expect(toMediaVM({kind: 'video', image: null, videoUrl: null})).toBeNull()
    expect(toMediaVM(null)).toBeNull()
  })
})
```

```ts
// web/lib/viewmodel/projects.test.ts
import {describe, expect, it} from 'vitest'
import {alternateOrder, deriveProjects, filterProjects, nextProject, pageProjects, showreelOrderNote} from './projects'

const raw = (slug: string, category: 'dop' | 'editor', creditOnly = false, showOnHome = true) => ({
  _id: `project-${slug}`, title: slug.toUpperCase(), slug, format: 'Music Video', year: '2022',
  role: category === 'dop' ? 'Director of Photography' : 'Editor', category,
  cover: null, frameGrabs: null, videoUrl: null, showOnHome, creditOnly, seo: null,
})

const all = deriveProjects([raw('a', 'dop'), raw('credit', 'dop', true), raw('b', 'editor'), raw('c', 'dop', false, false)] as any)

describe('deriveProjects', () => {
  it('numbers page projects only, in order, padded to two digits', () => {
    expect(all.map((p) => [p.slug, p.n])).toEqual([['a', '01'], ['credit', ''], ['b', '02'], ['c', '03']])
  })
  it('derives roleShort and formatLower', () => {
    expect(all[0].roleShort).toBe('DOP')
    expect(all[2].roleShort).toBe('Editor')
    expect(all[0].formatLower).toBe('music video')
  })
})

describe('pageProjects / filterProjects', () => {
  const pages = pageProjects(all)
  it('excludes credit-only entries', () => {
    expect(pages.map((p) => p.slug)).toEqual(['a', 'b', 'c'])
  })
  it('filters by category', () => {
    expect(filterProjects(pages, 'all').map((p) => p.slug)).toEqual(['a', 'b', 'c'])
    expect(filterProjects(pages, 'cinematography').map((p) => p.slug)).toEqual(['a', 'c'])
    expect(filterProjects(pages, 'editing').map((p) => p.slug)).toEqual(['b'])
  })
})

describe('alternateOrder', () => {
  it('gives every second visible item order 2, counting visible items only (prototype vi++ % 2)', () => {
    expect(alternateOrder(3)).toEqual([0, 2, 0])
    expect(alternateOrder(4)).toEqual([0, 2, 0, 2])
  })
})

describe('nextProject', () => {
  const pages = pageProjects(all)
  it('wraps to the first page project and skips credit-only', () => {
    expect(nextProject(pages, 'a')?.slug).toBe('b')
    expect(nextProject(pages, 'c')?.slug).toBe('a')
    expect(nextProject(pages, 'missing')).toBeNull()
  })
})

describe('showreelOrderNote', () => {
  it('joins page project titles unless overridden', () => {
    expect(showreelOrderNote(pageProjects(all), 'in order of appearance:', null)).toBe('(in order of appearance: A, B, C)')
    expect(showreelOrderNote(pageProjects(all), 'x', 'Custom')).toBe('(x Custom)')
  })
})
```

```ts
// web/lib/viewmodel/pages.test.ts
import {describe, expect, it} from 'vitest'
import type {PageEntryVM} from './site'
import {activePageKey, navEntries, preFooterEntries} from './pages'

const pages: PageEntryVM[] = [
  {key: 'home', href: '/', navLabel: 'Home', menuLabel: 'Home', preFooterScript: '', preFooterLabel: ''},
  {key: 'about', href: '/about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
  {key: 'work', href: '/work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
  {key: 'frames', href: '/frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
  {key: 'contact', href: '/contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
]

describe('activePageKey', () => {
  it('maps pathnames to page keys, project pages to work', () => {
    expect(activePageKey('/')).toBe('home')
    expect(activePageKey('/work')).toBe('work')
    expect(activePageKey('/work/pagal')).toBe('work')
    expect(activePageKey('/frames')).toBe('frames')
    expect(activePageKey('/nope')).toBe(null)
  })
})

describe('navEntries', () => {
  it('returns pages 2–5 with the active flag', () => {
    const nav = navEntries(pages, '/work/pagal')
    expect(nav.map((n) => [n.key, n.active])).toEqual([['about', false], ['work', true], ['frames', false], ['contact', false]])
  })
})

describe('preFooterEntries', () => {
  it('excludes the current page and returns the first three in prototype order', () => {
    expect(preFooterEntries(pages, '/').map((p) => p.key)).toEqual(['about', 'work', 'frames'])
    expect(preFooterEntries(pages, '/about').map((p) => p.key)).toEqual(['work', 'frames', 'contact'])
    expect(preFooterEntries(pages, '/work/x').map((p) => p.key)).toEqual(['about', 'frames', 'contact'])
  })
})
```

```ts
// web/lib/viewmodel/site.test.ts
import {describe, expect, it} from 'vitest'
import {toSiteSettingsVM} from './site'

describe('toSiteSettingsVM', () => {
  it('throws when the document is missing', () => {
    expect(() => toSiteSettingsVM(null)).toThrow(/siteSettings/)
  })
  it('fills defaults and resolves page hrefs', () => {
    const vm = toSiteSettingsVM({
      brandWord: 'Vazeer', brandScript: 'art.', copyright: '©', socials: null, management: null, dm: null, marqueeWords: null,
      pages: [{key: 'home', navLabel: 'Home', menuLabel: 'Home', preFooterScript: null, preFooterLabel: null}],
      leaderLeft: null, leaderRight: null, leaderSkip: null, menuScript: null, menuClose: null, menuSocialsLabel: null,
      menuPhoto: null, showIntro: null, showMarquee: null, showGrain: null, showRec: null, seo: null,
    } as any)
    expect(vm.pages[0].href).toBe('/')
    expect(vm.socials).toEqual([])
    expect(vm.showIntro).toBe(true)
    expect(vm.leaderSkip).toBe('Skip →')
  })
})
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `cd web && npx vitest run lib/viewmodel`
Expected: FAIL — modules not found.

- [ ] **Step 5: Write images.ts and site.ts**

```ts
// web/lib/viewmodel/images.ts
import type {ImageVM, MediaVM, SeoVM} from './types'

type RawAsset = {_id: string; url: string | null; extension: string | null; width: number | null; height: number | null; lqip: string | null} | null
type RawImage = {alt: string | null; hotspot: {x: number; y: number; width: number; height: number} | null; crop: {top: number; bottom: number; left: number; right: number} | null; asset: RawAsset} | null
type RawMedia = {kind: string | null; image: RawImage; videoUrl: string | null} | null
type RawSeo = {title: string | null; description: string | null; image: RawImage} | null

export function toImageVM(raw: RawImage | undefined): ImageVM | null {
  if (!raw?.asset?._id || !raw.asset.url) return null
  const {asset} = raw
  return {
    assetId: asset._id,
    url: asset.url,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    extension: asset.extension ?? 'jpg',
    lqip: asset.lqip ?? null,
    alt: raw.alt ?? '',
    hotspot: raw.hotspot ? {x: raw.hotspot.x, y: raw.hotspot.y, width: raw.hotspot.width, height: raw.hotspot.height} : null,
    crop: raw.crop ? {top: raw.crop.top, bottom: raw.crop.bottom, left: raw.crop.left, right: raw.crop.right} : null,
  }
}

export function toMediaVM(raw: RawMedia | undefined): MediaVM | null {
  if (!raw) return null
  if (raw.kind === 'video') return raw.videoUrl ? {kind: 'video', url: raw.videoUrl} : null
  const image = toImageVM(raw.image)
  return image ? {kind: 'image', image} : null
}

export function toSeoVM(raw: RawSeo | undefined): SeoVM {
  return {title: raw?.title ?? null, description: raw?.description ?? null, image: toImageVM(raw?.image)}
}

export const str = (v: string | null | undefined, fallback = ''): string => v ?? fallback
export const bool = (v: boolean | null | undefined, fallback: boolean): boolean => (v === null || v === undefined ? fallback : v)
```

```ts
// web/lib/viewmodel/site.ts
import type {SITE_SETTINGS_QUERYResult} from '@/lib/sanity/types'
import {bool, str, toImageVM, toSeoVM} from './images'
import {PAGE_KEYS, PAGE_ROUTES, type ImageVM, type LinkVM, type PageKey, type SeoVM} from './types'

export type PageEntryVM = {key: PageKey; href: string; navLabel: string; menuLabel: string; preFooterScript: string; preFooterLabel: string}
export type ContactLinkVM = {label: string; handle: string; url: string}

export type SiteSettingsVM = {
  brandWord: string; brandScript: string; copyright: string
  socials: LinkVM[]
  management: ContactLinkVM; dm: ContactLinkVM
  marqueeWords: string[]
  pages: PageEntryVM[]
  leaderLeft: string; leaderRight: string; leaderSkip: string
  menuScript: string; menuClose: string; menuSocialsLabel: string
  menuPhoto: ImageVM | null
  showIntro: boolean; showMarquee: boolean; showGrain: boolean; showRec: boolean
  seo: SeoVM
}

export class ContentMissingError extends Error {
  constructor(id: string) {
    super(`Sanity document "${id}" is missing — run \`npm run seed\` in studio/`)
  }
}

const isPageKey = (k: string | null): k is PageKey => !!k && (PAGE_KEYS as readonly string[]).includes(k)

export function toSiteSettingsVM(raw: SITE_SETTINGS_QUERYResult): SiteSettingsVM {
  if (!raw) throw new ContentMissingError('siteSettings')
  const contact = (c: {label: string | null; handle: string | null; url: string | null} | null, label: string): ContactLinkVM => ({
    label: str(c?.label, label), handle: str(c?.handle), url: str(c?.url, '#'),
  })
  return {
    brandWord: str(raw.brandWord, 'Vazeer'),
    brandScript: str(raw.brandScript, 'art.'),
    copyright: str(raw.copyright),
    socials: (raw.socials ?? []).flatMap((s) => (s.label && s.url ? [{label: s.label, url: s.url}] : [])),
    management: contact(raw.management, 'management'),
    dm: contact(raw.dm, 'dm me'),
    marqueeWords: (raw.marqueeWords ?? []).filter((w): w is string => !!w),
    pages: (raw.pages ?? []).flatMap((p) =>
      isPageKey(p.key)
        ? [{key: p.key, href: PAGE_ROUTES[p.key], navLabel: str(p.navLabel, p.key), menuLabel: str(p.menuLabel, str(p.navLabel, p.key)), preFooterScript: str(p.preFooterScript), preFooterLabel: str(p.preFooterLabel)}]
        : [],
    ),
    leaderLeft: str(raw.leaderLeft, 'Vazeer Art'),
    leaderRight: str(raw.leaderRight, 'Showreel 2026'),
    leaderSkip: str(raw.leaderSkip, 'Skip →'),
    menuScript: str(raw.menuScript, 'menu'),
    menuClose: str(raw.menuClose, 'Close ✕'),
    menuSocialsLabel: str(raw.menuSocialsLabel, 'follow on socials /'),
    menuPhoto: toImageVM(raw.menuPhoto),
    showIntro: bool(raw.showIntro, true),
    showMarquee: bool(raw.showMarquee, true),
    showGrain: bool(raw.showGrain, true),
    showRec: bool(raw.showRec, true),
    seo: toSeoVM(raw.seo),
  }
}
```

- [ ] **Step 6: Write projects.ts and pages.ts**

```ts
// web/lib/viewmodel/projects.ts
import type {PROJECTS_QUERYResult} from '@/lib/sanity/types'
import {str, toImageVM, toSeoVM} from './images'
import type {ImageVM, SeoVM} from './types'

export type WorkFilter = 'all' | 'cinematography' | 'editing'
export const WORK_FILTERS: WorkFilter[] = ['all', 'cinematography', 'editing']

export type ProjectVM = {
  id: string; slug: string; title: string
  format: string; formatLower: string; year: string
  role: string; roleShort: 'DOP' | 'Editor'; category: 'dop' | 'editor'
  cover: ImageVM | null; frameGrabs: ImageVM[]
  videoUrl: string | null
  showOnHome: boolean; creditOnly: boolean
  /** "01", "02"… among page projects; "" for credit-only */
  n: string
  seo: SeoVM
}

export function deriveProjects(raw: PROJECTS_QUERYResult): ProjectVM[] {
  let counter = 0
  return raw.flatMap((p) => {
    if (!p.slug || !p.title) return []
    const creditOnly = p.creditOnly === true
    const category: 'dop' | 'editor' = p.category === 'editor' ? 'editor' : 'dop'
    const n = creditOnly ? '' : String(++counter).padStart(2, '0')
    const format = str(p.format)
    return [{
      id: p._id, slug: p.slug, title: p.title,
      format, formatLower: format.toLowerCase(), year: str(p.year),
      role: str(p.role), roleShort: category === 'dop' ? 'DOP' : 'Editor', category,
      cover: toImageVM(p.cover),
      frameGrabs: (p.frameGrabs ?? []).flatMap((g) => { const vm = toImageVM(g); return vm ? [vm] : [] }),
      videoUrl: p.videoUrl ?? null,
      showOnHome: p.showOnHome !== false, creditOnly, n,
      seo: toSeoVM(p.seo),
    }]
  })
}

export const pageProjects = (all: ProjectVM[]) => all.filter((p) => !p.creditOnly)
export const homeProjects = (all: ProjectVM[]) => pageProjects(all).filter((p) => p.showOnHome)

export function filterProjects(pages: ProjectVM[], filter: WorkFilter): ProjectVM[] {
  if (filter === 'cinematography') return pages.filter((p) => p.category === 'dop')
  if (filter === 'editing') return pages.filter((p) => p.category === 'editor')
  return pages
}

/** Prototype: `order = visible && (vi++ % 2) ? 2 : 0` — counts visible items only. */
export function alternateOrder(visibleCount: number): number[] {
  return Array.from({length: visibleCount}, (_, i) => (i % 2 ? 2 : 0))
}

export function nextProject(pages: ProjectVM[], slug: string): ProjectVM | null {
  const i = pages.findIndex((p) => p.slug === slug)
  if (i === -1 || pages.length === 0) return null
  return pages[(i + 1) % pages.length]
}

export function showreelOrderNote(pages: ProjectVM[], prefix: string, override: string | null): string {
  return `(${prefix} ${override ?? pages.map((p) => p.title).join(', ')})`
}

export function parseWorkFilter(value: string | null | undefined): WorkFilter {
  return (WORK_FILTERS as string[]).includes(value ?? '') ? (value as WorkFilter) : 'all'
}
```

```ts
// web/lib/viewmodel/pages.ts
import type {PageEntryVM} from './site'
import {PAGE_KEYS, PAGE_ROUTES, type PageKey} from './types'

export function activePageKey(pathname: string): PageKey | null {
  if (pathname === '/') return 'home'
  if (pathname === '/work' || pathname.startsWith('/work/')) return 'work'
  for (const key of PAGE_KEYS) if (pathname === PAGE_ROUTES[key]) return key
  return null
}

export type NavEntry = PageEntryVM & {active: boolean}

/** Header shows pages 2–5 (everything but home). */
export function navEntries(pages: PageEntryVM[], pathname: string): NavEntry[] {
  const active = activePageKey(pathname)
  return pages.filter((p) => p.key !== 'home').map((p) => ({...p, active: p.key === active}))
}

/** Prototype pre-footer order: about, work, frames, contact → drop current → first three. */
export function preFooterEntries(pages: PageEntryVM[], pathname: string): PageEntryVM[] {
  const active = activePageKey(pathname)
  const order: PageKey[] = ['about', 'work', 'frames', 'contact']
  return order
    .filter((k) => k !== active)
    .flatMap((k) => pages.filter((p) => p.key === k))
    .slice(0, 3)
}
```

- [ ] **Step 7: Page view models and data loaders**

```ts
// web/lib/viewmodel/pagesContent.ts
import type {ABOUT_QUERYResult, CONTACT_QUERYResult, FRAMES_PAGE_QUERYResult, FRAMES_QUERYResult, HOME_QUERYResult, WORK_QUERYResult} from '@/lib/sanity/types'
import {str, toImageVM, toMediaVM, toSeoVM} from './images'
import {ContentMissingError} from './site'
import {PAGE_ROUTES, type ImageVM, type MediaVM, type PageKey, type SeoVM} from './types'

export type HomeVM = {
  hero: {word: string; script: string; mainImage: ImageVM | null; polaroidLeft: MediaVM | null; polaroidRight: MediaVM | null}
  intro: {script: string; heading: string; subline: string; body: string; ctaLabel: string; imageA: ImageVM | null; imageB: ImageVM | null}
  reels: {script: string; heading: string; ctaLabel: string}
  explore: {script: string; heading: string; cards: {label: string; sub: string; href: string; image: ImageVM | null}[]}
  currently: {script: string; heading: string; body: string; ctaLabel: string; bgImage: ImageVM | null}
  seo: SeoVM
}

export function toHomeVM(raw: HOME_QUERYResult): HomeVM {
  if (!raw) throw new ContentMissingError('homePage')
  const target = (t: string | null): string => PAGE_ROUTES[(t as PageKey) in PAGE_ROUTES ? (t as PageKey) : 'work']
  return {
    hero: {word: str(raw.hero?.word, 'Vazeer'), script: str(raw.hero?.script, 'art'), mainImage: toImageVM(raw.hero?.mainImage), polaroidLeft: toMediaVM(raw.hero?.polaroidLeft), polaroidRight: toMediaVM(raw.hero?.polaroidRight)},
    intro: {script: str(raw.intro?.script), heading: str(raw.intro?.heading), subline: str(raw.intro?.subline), body: str(raw.intro?.body), ctaLabel: str(raw.intro?.ctaLabel), imageA: toImageVM(raw.intro?.imageA), imageB: toImageVM(raw.intro?.imageB)},
    reels: {script: str(raw.reels?.headingBlock?.script), heading: str(raw.reels?.headingBlock?.heading), ctaLabel: str(raw.reels?.ctaLabel)},
    explore: {
      script: str(raw.explore?.headingBlock?.script), heading: str(raw.explore?.headingBlock?.heading),
      cards: (raw.explore?.cards ?? []).map((c) => ({label: str(c.label), sub: str(c.sub), href: target(c.target), image: toImageVM(c.image)})),
    },
    currently: {script: str(raw.currently?.script), heading: str(raw.currently?.heading), body: str(raw.currently?.body), ctaLabel: str(raw.currently?.ctaLabel), bgImage: toImageVM(raw.currently?.bgImage)},
    seo: toSeoVM(raw.seo),
  }
}

export type WorkVM = {
  title: string; script: string; intro: string
  filters: {all: string; cinematography: string; editing: string}
  showreel: {poster: ImageVM | null; videoUrl: string | null; label: string; orderNotePrefix: string; orderNoteOverride: string | null}
  numberPrefix: string; projectCta: string
  skills: {script: string; heading: string; items: {label: string; tilt: number; media: MediaVM | null}[]}
  projectPage: {backLabel: string; reelPrefix: string; roleLabel: string; formatLabel: string; yearLabel: string; aspectLabel: string; grabsScript: string; grabsHeading: string; upNextScript: string}
  seo: SeoVM
}

export function toWorkVM(raw: WORK_QUERYResult): WorkVM {
  if (!raw) throw new ContentMissingError('workPage')
  const pp = raw.projectPage
  return {
    title: str(raw.title, 'Work'), script: str(raw.script, '& reels'), intro: str(raw.intro),
    filters: {all: str(raw.filterAll, 'All'), cinematography: str(raw.filterDop, 'Cinematography'), editing: str(raw.filterEditor, 'Editing')},
    showreel: {poster: toImageVM(raw.showreel?.poster), videoUrl: raw.showreel?.videoUrl ?? null, label: str(raw.showreel?.label, 'Showreel'), orderNotePrefix: str(raw.showreel?.orderNotePrefix, 'in order of appearance:'), orderNoteOverride: raw.showreel?.orderNoteOverride ?? null},
    numberPrefix: str(raw.numberPrefix, 'no.'), projectCta: str(raw.projectCta),
    skills: {script: str(raw.skills?.headingBlock?.script), heading: str(raw.skills?.headingBlock?.heading), items: (raw.skills?.items ?? []).map((s) => ({label: str(s.label), tilt: s.tilt ?? 0, media: toMediaVM(s.media)}))},
    projectPage: {backLabel: str(pp?.backLabel, '← Work & reels'), reelPrefix: str(pp?.reelPrefix, 'reel no.'), roleLabel: str(pp?.roleLabel, 'role'), formatLabel: str(pp?.formatLabel, 'format'), yearLabel: str(pp?.yearLabel, 'year'), aspectLabel: str(pp?.aspectLabel, '2.39 : 1'), grabsScript: str(pp?.grabsScript, 'frame'), grabsHeading: str(pp?.grabsHeading, 'Grabs'), upNextScript: str(pp?.upNextScript, 'up next')},
    seo: toSeoVM(raw.seo),
  }
}

export type FramesPageVM = {script: string; heading: string; linkLabel: string; linkUrl: string; reelLabel: string; postLabel: string; seo: SeoVM}
export function toFramesPageVM(raw: FRAMES_PAGE_QUERYResult): FramesPageVM {
  if (!raw) throw new ContentMissingError('framesPage')
  return {script: str(raw.script), heading: str(raw.heading, 'Frames'), linkLabel: str(raw.linkLabel), linkUrl: str(raw.linkUrl, '#'), reelLabel: str(raw.reelLabel, 'Reel cover'), postLabel: str(raw.postLabel, 'Instagram post'), seo: toSeoVM(raw.seo)}
}

export type FrameVM = {id: string; image: ImageVM; ratio: '4/5' | '9/16' | '1/1' | '16/9'; instagramUrl: string | null; label: string}
export function toFramesVM(raw: FRAMES_QUERYResult, page: FramesPageVM): FrameVM[] {
  return raw.flatMap((f) => {
    const image = toImageVM(f.image)
    if (!image) return []
    const ratio = (['4/5', '9/16', '1/1', '16/9'] as const).includes(f.ratio as never) ? (f.ratio as FrameVM['ratio']) : '4/5'
    return [{id: f._id, image, ratio, instagramUrl: f.instagramUrl ?? null, label: ratio === '9/16' ? page.reelLabel : page.postLabel}]
  })
}

export type AboutVM = {
  hero: {script: string; heading: string; body: string; ctaLabel: string; portrait: ImageVM | null; polaroid: MediaVM | null}
  statement: {headingPlain: string; headingAccent: string; paragraphs: string[]; aside: string}
  credits: {script: string; heading: string; imdbLabel: string; imdbUrl: string}
  finale: {script: string; sub: string; bgImage: ImageVM | null}
  seo: SeoVM
}
export function toAboutVM(raw: ABOUT_QUERYResult): AboutVM {
  if (!raw) throw new ContentMissingError('aboutPage')
  return {
    hero: {script: str(raw.hero?.script), heading: str(raw.hero?.heading), body: str(raw.hero?.body), ctaLabel: str(raw.hero?.ctaLabel), portrait: toImageVM(raw.hero?.portrait), polaroid: toMediaVM(raw.hero?.polaroid)},
    statement: {headingPlain: str(raw.statement?.headingPlain), headingAccent: str(raw.statement?.headingAccent), paragraphs: (raw.statement?.paragraphs ?? []).filter((p): p is string => !!p), aside: str(raw.statement?.aside)},
    credits: {script: str(raw.credits?.headingBlock?.script), heading: str(raw.credits?.headingBlock?.heading), imdbLabel: str(raw.credits?.imdbLabel), imdbUrl: str(raw.credits?.imdbUrl, '#')},
    finale: {script: str(raw.finale?.script), sub: str(raw.finale?.sub), bgImage: toImageVM(raw.finale?.bgImage)},
    seo: toSeoVM(raw.seo),
  }
}

export type ContactVM = {
  script: string; heading: string; intro: string; photo: ImageVM | null
  form: {heading: string; typeQuestion: string; types: string[]; nameLabel: string; contactLabel: string; datesLabel: string; briefLabel: string; submitLabel: string}
  success: {script: string; body: string; resetLabel: string}
  seo: SeoVM
}
export function toContactVM(raw: CONTACT_QUERYResult): ContactVM {
  if (!raw) throw new ContentMissingError('contactPage')
  return {
    script: str(raw.script), heading: str(raw.heading, 'Touch'), intro: str(raw.intro), photo: toImageVM(raw.photo),
    form: {heading: str(raw.form?.heading, 'The brief'), typeQuestion: str(raw.form?.typeQuestion), types: (raw.form?.types ?? []).filter((t): t is string => !!t), nameLabel: str(raw.form?.nameLabel), contactLabel: str(raw.form?.contactLabel), datesLabel: str(raw.form?.datesLabel), briefLabel: str(raw.form?.briefLabel), submitLabel: str(raw.form?.submitLabel, 'Send it →')},
    success: {script: str(raw.success?.script), body: str(raw.success?.body), resetLabel: str(raw.success?.resetLabel, 'Send another')},
    seo: toSeoVM(raw.seo),
  }
}
```

```ts
// web/lib/data.ts
import {sanityFetch} from '@/lib/sanity/live'
import {ABOUT_QUERY, CONTACT_QUERY, FRAMES_PAGE_QUERY, FRAMES_QUERY, HOME_QUERY, PROJECTS_QUERY, PROJECT_SLUGS_QUERY, SITE_SETTINGS_QUERY, WORK_QUERY} from '@/lib/sanity/queries'
import {toAboutVM, toContactVM, toFramesPageVM, toFramesVM, toHomeVM, toWorkVM} from '@/lib/viewmodel/pagesContent'
import {deriveProjects} from '@/lib/viewmodel/projects'
import {toSiteSettingsVM} from '@/lib/viewmodel/site'

export async function getSiteSettings() {
  const {data} = await sanityFetch({query: SITE_SETTINGS_QUERY})
  return toSiteSettingsVM(data)
}
export async function getHome() {
  const {data} = await sanityFetch({query: HOME_QUERY})
  return toHomeVM(data)
}
export async function getWork() {
  const {data} = await sanityFetch({query: WORK_QUERY})
  return toWorkVM(data)
}
export async function getFramesPage() {
  const {data} = await sanityFetch({query: FRAMES_PAGE_QUERY})
  return toFramesPageVM(data)
}
export async function getFrames() {
  const [{data}, page] = await Promise.all([sanityFetch({query: FRAMES_QUERY}), getFramesPage()])
  return toFramesVM(data, page)
}
export async function getAbout() {
  const {data} = await sanityFetch({query: ABOUT_QUERY})
  return toAboutVM(data)
}
export async function getContact() {
  const {data} = await sanityFetch({query: CONTACT_QUERY})
  return toContactVM(data)
}
export async function getProjects() {
  const {data} = await sanityFetch({query: PROJECTS_QUERY})
  return deriveProjects(data)
}
/** For generateStaticParams: published only, no stega. */
export async function getProjectSlugs() {
  const {data} = await sanityFetch({query: PROJECT_SLUGS_QUERY, perspective: 'published', stega: false})
  return data.flatMap((d) => (d.slug ? [{slug: d.slug}] : []))
}
```

- [ ] **Step 8: Run tests and typecheck**

Run: `cd web && npx vitest run && npm run typecheck`
Expected: PASS / 0. If typecheck complains that a generated type is narrower than a mapper expects, fix the mapper (the generated types are the source of truth), never the generated file.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/lib/sanity/queries.ts web/lib/sanity/types.ts web/lib/viewmodel web/lib/data.ts
git commit -m "feat(web): GROQ queries, generated types, view-model mappers and data loaders

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Motion constants and pure helpers

**Files:**
- Create: `web/lib/motion/constants.ts`, `web/lib/motion/timecode.ts`, `web/lib/motion/parallax.ts`, `web/lib/motion/reveal.ts`
- Test: `web/lib/motion/timecode.test.ts`, `web/lib/motion/parallax.test.ts`, `web/lib/motion/reveal.test.ts`

**Interfaces:**
- Produces: `PARALLAX`, `REVEAL`, `TIMECODE`, `LEADER` constants; `formatTimecode(elapsedMs)`, `lerp(a,b,k)`, `parallaxTransform(cx,cy,depth,scrollFactor,scrollY)`, `revealTransition(index)`, `shouldSkipReveal(top, innerHeight)`.

- [ ] **Step 1: Write the failing tests**

```ts
// web/lib/motion/timecode.test.ts
import {describe, expect, it} from 'vitest'
import {formatTimecode} from './timecode'

describe('formatTimecode (25 fps, 40 ms ticks — prototype)', () => {
  it('starts at zero', () => expect(formatTimecode(0)).toBe('00:00:00:00'))
  it('counts frames', () => expect(formatTimecode(40 * 7)).toBe('00:00:00:07'))
  it('rolls frames into seconds at 25', () => expect(formatTimecode(40 * 25)).toBe('00:00:01:00'))
  it('rolls minutes and hours', () => {
    expect(formatTimecode(60_000)).toBe('00:01:00:00')
    expect(formatTimecode(3_600_000 + 61_000 + 40 * 3)).toBe('01:01:01:03')
  })
  it('wraps hours at 24', () => expect(formatTimecode(24 * 3_600_000)).toBe('00:00:00:00'))
})
```

```ts
// web/lib/motion/parallax.test.ts
import {describe, expect, it} from 'vitest'
import {PARALLAX} from './constants'
import {lerp, parallaxTransform} from './parallax'

describe('lerp', () => {
  it('moves 8% toward the target (prototype 0.08)', () => {
    expect(PARALLAX.LERP).toBe(0.08)
    expect(lerp(0, 1, PARALLAX.LERP)).toBeCloseTo(0.08)
  })
})

describe('parallaxTransform', () => {
  it('matches translate3d(cx*d*28, cy*d*20 + min(scrollY,1200)*k, 0)', () => {
    expect(parallaxTransform(0.5, -0.25, 2, -0.45, 300)).toBe('translate3d(28.00px,-145.00px,0)')
  })
  it('caps scroll at 1200', () => {
    expect(parallaxTransform(0, 0, 1, 0.1, 5000)).toBe('translate3d(0.00px,120.00px,0)')
  })
})
```

```ts
// web/lib/motion/reveal.test.ts
import {describe, expect, it} from 'vitest'
import {revealTransition, shouldSkipReveal} from './reveal'

describe('revealTransition', () => {
  it('staggers by (i % 3) * 0.08s with the prototype easing', () => {
    expect(revealTransition(0)).toBe('opacity 1s cubic-bezier(.2,.8,.2,1) 0s, translate 1s cubic-bezier(.2,.8,.2,1) 0s')
    expect(revealTransition(4)).toBe('opacity 1s cubic-bezier(.2,.8,.2,1) 0.08s, translate 1s cubic-bezier(.2,.8,.2,1) 0.08s')
    expect(revealTransition(5)).toContain('0.16s')
  })
})

describe('shouldSkipReveal', () => {
  it('skips elements whose top is above 92% of the viewport height', () => {
    expect(shouldSkipReveal(800, 1000)).toBe(true)
    expect(shouldSkipReveal(920, 1000)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run lib/motion`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the constants and helpers**

```ts
// web/lib/motion/constants.ts
// Every number here is copied from design-reference/design-source.jsx and keyframes.css (spec §3.3).
export const PARALLAX = {LERP: 0.08, SCROLL_CAP_PX: 1200, X_GAIN: 28, Y_GAIN: 20} as const

export const REVEAL = {
  THRESHOLD: 0.12,
  SKIP_VIEWPORT_RATIO: 0.92,
  DISTANCE_PX: 56,
  DURATION_S: 1,
  EASE: 'cubic-bezier(.2,.8,.2,1)',
  STAGGER_S: 0.08,
  STAGGER_MOD: 3,
  INITIAL_SCAN_DELAY_MS: 50,
} as const

export const TIMECODE = {TICK_MS: 40, FPS: 25} as const

export const LEADER = {
  STORAGE_KEY: 'vazeer-leader',
  STEPS: [3, 2, 1] as const,
  STEP_MS: 700,
  OUT_AT_MS: 2100,
  END_AT_MS: 2700,
} as const
```

```ts
// web/lib/motion/timecode.ts
import {TIMECODE} from './constants'

const pad = (n: number) => String(n).padStart(2, '0')

/** Prototype: f = floor(elapsed/40); HH = f/90000 % 24, MM = f/1500 % 60, SS = f/25 % 60, FF = f % 25 */
export function formatTimecode(elapsedMs: number): string {
  const f = Math.floor(elapsedMs / TIMECODE.TICK_MS)
  const fps = TIMECODE.FPS
  return `${pad(Math.floor(f / (fps * 3600)) % 24)}:${pad(Math.floor(f / (fps * 60)) % 60)}:${pad(Math.floor(f / fps) % 60)}:${pad(f % fps)}`
}
```

```ts
// web/lib/motion/parallax.ts
import {PARALLAX} from './constants'

export const lerp = (current: number, target: number, k: number) => current + (target - current) * k

export function parallaxTransform(cx: number, cy: number, depth: number, scrollFactor: number, scrollY: number): string {
  const sy = Math.min(scrollY, PARALLAX.SCROLL_CAP_PX)
  const x = (cx * depth * PARALLAX.X_GAIN).toFixed(2)
  const y = (cy * depth * PARALLAX.Y_GAIN + sy * scrollFactor).toFixed(2)
  return `translate3d(${x}px,${y}px,0)`
}
```

```ts
// web/lib/motion/reveal.ts
import {REVEAL} from './constants'

export function revealTransition(index: number): string {
  const delay = `${(index % REVEAL.STAGGER_MOD) * REVEAL.STAGGER_S}s`
  const t = `${REVEAL.DURATION_S}s ${REVEAL.EASE} ${delay}`
  return `opacity ${t}, translate ${t}`
}

export const shouldSkipReveal = (top: number, innerHeight: number) => top < innerHeight * REVEAL.SKIP_VIEWPORT_RATIO
```

Note: `(4 % 3) * 0.08` is `0.08` and `(5 % 3) * 0.08` is `0.16` in JS floating point; the tests above pass. If a future engine prints `0.16000000000000003`, round with `Number(x.toFixed(2))`.

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run lib/motion`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/lib/motion
git commit -m "feat(web): motion constants and pure helpers from the prototype

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Motion client components and the Leader

**Files:**
- Create: `web/components/motion/ParallaxLoop.tsx`, `web/components/motion/RevealObserver.tsx`, `web/components/motion/Timecode.tsx`
- Create: `web/components/chrome/Leader.tsx`, `web/components/chrome/Leader.module.css`, `web/components/chrome/LeaderBootScript.tsx`, `web/lib/motion/leaderBoot.ts`
- Test: `web/components/chrome/Leader.test.tsx`, `web/lib/motion/leaderBoot.test.ts`, `web/components/motion/RevealObserver.test.tsx`, `web/components/motion/ParallaxLoop.test.tsx`

**Interfaces:**
- Consumes: constants and helpers (Task 5), `SiteSettingsVM` (Task 4).
- Produces: `<ParallaxLoop/>`, `<RevealObserver/>`, `<Timecode/>`, `<Leader left right skip />`, `<LeaderBootScript enabled />`, `leaderShouldRun({enabled, storage, reducedMotion})`, `leaderBootSource(enabled)`.

- [ ] **Step 1: Write the failing tests**

```ts
// web/lib/motion/leaderBoot.test.ts
import {describe, expect, it} from 'vitest'
import {leaderBootSource, leaderShouldRun} from './leaderBoot'

describe('leaderShouldRun', () => {
  it('runs only when enabled, unseen, and motion is allowed', () => {
    expect(leaderShouldRun({enabled: true, seen: false, reducedMotion: false})).toBe(true)
    expect(leaderShouldRun({enabled: false, seen: false, reducedMotion: false})).toBe(false)
    expect(leaderShouldRun({enabled: true, seen: true, reducedMotion: false})).toBe(false)
    expect(leaderShouldRun({enabled: true, seen: false, reducedMotion: true})).toBe(false)
  })
})

describe('leaderBootSource', () => {
  it('sets data-leader="on" synchronously when the leader should run', () => {
    const src = leaderBootSource(true)
    const html = {dataset: {} as Record<string, string>}
    const sessionStorage = {getItem: () => null}
    const matchMedia = () => ({matches: false})
    new Function('document', 'sessionStorage', 'matchMedia', src)({documentElement: html}, sessionStorage, matchMedia)
    expect(html.dataset.leader).toBe('on')
  })
  it('does nothing when seen or disabled', () => {
    const html = {dataset: {} as Record<string, string>}
    new Function('document', 'sessionStorage', 'matchMedia', leaderBootSource(true))({documentElement: html}, {getItem: () => '1'}, () => ({matches: false}))
    expect(html.dataset.leader).toBeUndefined()
    new Function('document', 'sessionStorage', 'matchMedia', leaderBootSource(false))({documentElement: html}, {getItem: () => null}, () => ({matches: false}))
    expect(html.dataset.leader).toBeUndefined()
  })
})
```

```tsx
// web/components/chrome/Leader.test.tsx
import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {Leader} from './Leader'

describe('Leader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    document.documentElement.dataset.leader = 'on'
  })
  afterEach(() => {
    vi.useRealTimers()
    delete document.documentElement.dataset.leader
  })

  it('counts 3 → 2 → 1, fades at 2100 ms and ends at 2700 ms, marking the session', () => {
    render(<Leader left="Vazeer Art" right="Showreel 2026" skip="Skip →" />)
    const overlay = screen.getByTestId('leader')
    expect(screen.getByText('3')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByText('2')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByText('1')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(overlay.dataset.out).toBe('true')
    expect(document.documentElement.dataset.leader).toBe('out')
    act(() => vi.advanceTimersByTime(600))
    expect(screen.queryByTestId('leader')).toBeNull()
    expect(document.documentElement.dataset.leader).toBe('')
    expect(sessionStorage.getItem('vazeer-leader')).toBe('1')
  })

  it('skip ends it immediately', () => {
    render(<Leader left="a" right="b" skip="Skip →" />)
    act(() => screen.getByRole('button', {name: 'Skip →'}).click())
    expect(screen.queryByTestId('leader')).toBeNull()
    expect(sessionStorage.getItem('vazeer-leader')).toBe('1')
  })

  it('does nothing when the boot script did not arm it', () => {
    document.documentElement.dataset.leader = ''
    render(<Leader left="a" right="b" skip="s" />)
    act(() => vi.advanceTimersByTime(3000))
    expect(document.documentElement.dataset.leader).toBe('')
    expect(sessionStorage.getItem('vazeer-leader')).toBeNull()
  })
})
```

```tsx
// web/components/motion/RevealObserver.test.tsx
import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {RevealObserver} from './RevealObserver'

vi.mock('next/navigation', () => ({usePathname: () => '/'}))

type Entry = {isIntersecting: boolean; target: Element}
let observed: Element[] = []
let trigger: (entries: Entry[]) => void = () => {}

beforeEach(() => {
  observed = []
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (e: Entry[]) => void) { trigger = cb }
    observe = (el: Element) => { observed.push(el) }
    unobserve = () => {}
    disconnect = () => {}
  })
  Object.defineProperty(window, 'innerHeight', {value: 1000, configurable: true})
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

function mount(top: number) {
  const el = document.createElement('div')
  el.setAttribute('data-reveal', '1')
  el.getBoundingClientRect = () => ({top} as DOMRect)
  document.body.appendChild(el)
  return el
}

describe('RevealObserver', () => {
  it('hides below-fold elements, observes them, and reveals on intersection', () => {
    const el = mount(1500)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60)
    expect(el.style.opacity).toBe('0')
    expect(el.style.translate).toBe('0 56px')
    expect(el.dataset.rv).toBe('1')
    expect(observed).toContain(el)
    trigger([{isIntersecting: true, target: el}])
    expect(el.style.opacity).toBe('1')
    expect(el.style.translate).toBe('0 0')
    el.remove()
  })
  it('skips elements already in view', () => {
    const el = mount(200)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60)
    expect(el.style.opacity).toBe('')
    expect(el.dataset.rv).toBe('1')
    expect(observed).not.toContain(el)
    el.remove()
  })
})
```

```tsx
// web/components/motion/ParallaxLoop.test.tsx
import {render} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ParallaxLoop} from './ParallaxLoop'

afterEach(() => vi.unstubAllGlobals())

describe('ParallaxLoop', () => {
  it('does not start when the user prefers reduced motion', () => {
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)
    vi.stubGlobal('matchMedia', () => ({matches: true}))
    render(<ParallaxLoop />)
    expect(raf).not.toHaveBeenCalled()
  })
  it('writes translate3d transforms to [data-depth] elements', () => {
    let frame: FrameRequestCallback = () => {}
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frame = cb; return 1 })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.stubGlobal('matchMedia', () => ({matches: false}))
    const el = document.createElement('div')
    el.dataset.depth = '2'
    el.dataset.scroll = '-0.45'
    document.body.appendChild(el)
    render(<ParallaxLoop />)
    frame(0)
    expect(el.style.transform).toBe('translate3d(0.00px,0.00px,0)')
    el.remove()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run components lib/motion/leaderBoot`
Expected: FAIL — modules not found.

- [ ] **Step 3: Leader boot logic and inline script**

```ts
// web/lib/motion/leaderBoot.ts
import {LEADER} from './constants'

export function leaderShouldRun(input: {enabled: boolean; seen: boolean; reducedMotion: boolean}): boolean {
  return input.enabled && !input.seen && !input.reducedMotion
}

/**
 * Inline <head> script: decides before first paint whether the leader runs, so the hero
 * animations are paused (html[data-leader="on"]) exactly like the prototype's unmounted Home.
 */
export function leaderBootSource(enabled: boolean): string {
  return `try{if(${enabled ? 'true' : 'false'}&&sessionStorage.getItem(${JSON.stringify(LEADER.STORAGE_KEY)})!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.leader='on'}}catch(e){}`
}
```

```tsx
// web/components/chrome/LeaderBootScript.tsx
import {leaderBootSource} from '@/lib/motion/leaderBoot'

export function LeaderBootScript({enabled}: {enabled: boolean}) {
  return <script dangerouslySetInnerHTML={{__html: leaderBootSource(enabled)}} />
}
```

- [ ] **Step 4: Leader component and styles**

```tsx
// web/components/chrome/Leader.tsx
'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {LEADER} from '@/lib/motion/constants'
import styles from './Leader.module.css'

type Props = {left: string; right: string; skip: string}

export function Leader({left, right, skip}: Props) {
  const [step, setStep] = useState<number>(LEADER.STEPS[0])
  const [out, setOut] = useState(false)
  const [done, setDone] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const end = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    try { sessionStorage.setItem(LEADER.STORAGE_KEY, '1') } catch {}
    document.documentElement.dataset.leader = ''
    setDone(true)
  }, [])

  useEffect(() => {
    if (document.documentElement.dataset.leader !== 'on') return
    timers.current = [
      setTimeout(() => setStep(LEADER.STEPS[1]), LEADER.STEP_MS),
      setTimeout(() => setStep(LEADER.STEPS[2]), LEADER.STEP_MS * 2),
      setTimeout(() => { setOut(true); document.documentElement.dataset.leader = 'out' }, LEADER.OUT_AT_MS),
      setTimeout(end, LEADER.END_AT_MS),
    ]
    return () => timers.current.forEach(clearTimeout)
  }, [end])

  if (done) return null

  return (
    <div className={styles.overlay} data-leader-overlay="" data-out={out ? 'true' : 'false'} data-testid="leader" aria-hidden="true">
      <div className={styles.hline} />
      <div className={styles.vline} />
      <div className={styles.ring}>
        <div className={styles.spinner} />
        <div className={styles.innerRing} />
        <span className={styles.number}>{step}</span>
      </div>
      <div className={styles.captions}>
        <span>{left}</span>
        <span className={styles.dot}>●</span>
        <span>{right}</span>
      </div>
      <button type="button" className={styles.skip} onClick={end}>{skip}</button>
    </div>
  )
}
```

```css
/* web/components/chrome/Leader.module.css — markup.html lines 6–24 */
.overlay{position:fixed;inset:0;z-index:200;background:#0f0d0b;display:flex;align-items:center;justify-content:center;overflow:hidden;opacity:1;transition:opacity .6s ease}
.overlay[data-out="true"]{opacity:0}
.hline{position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(239,231,218,.25)}
.vline{position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(239,231,218,.25)}
.ring{position:relative;width:min(56vmin,480px);aspect-ratio:1;border-radius:50%;border:2px solid rgba(239,231,218,.5);display:flex;align-items:center;justify-content:center;overflow:hidden}
.spinner{position:absolute;inset:-2px;border-radius:50%;background:conic-gradient(from 0deg,rgba(232,162,74,.45),rgba(232,162,74,0) 30%);animation:spin .7s linear infinite}
.innerRing{position:absolute;inset:10%;border-radius:50%;border:1px solid rgba(239,231,218,.3)}
.number{position:relative;font-family:var(--font-anton),sans-serif;font-size:min(34vmin,300px);line-height:1;color:#efe7da}
.captions{position:absolute;bottom:32px;left:0;right:0;display:flex;justify-content:center;gap:24px;font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#b9b0a2}
.dot{color:#e8a24a}
.skip{all:unset;cursor:pointer;position:absolute;top:24px;right:28px;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#b9b0a2}
```

- [ ] **Step 5: ParallaxLoop, RevealObserver, Timecode**

```tsx
// web/components/motion/ParallaxLoop.tsx
'use client'

import {useEffect} from 'react'
import {PARALLAX} from '@/lib/motion/constants'
import {lerp, parallaxTransform} from '@/lib/motion/parallax'

/** Prototype componentDidMount loop: mouse lerp + capped scroll offset on every [data-depth]. */
export function ParallaxLoop() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let mx = 0, my = 0, cx = 0, cy = 0
    let raf = 0
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }
    const loop = () => {
      cx = lerp(cx, mx, PARALLAX.LERP)
      cy = lerp(cy, my, PARALLAX.LERP)
      const sy = window.scrollY
      document.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
        const d = Number(el.dataset.depth)
        const k = Number(el.dataset.scroll || 0)
        el.style.transform = parallaxTransform(cx, cy, d, k, sy)
      })
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])
  return null
}
```

```tsx
// web/components/motion/RevealObserver.tsx
'use client'

import {usePathname} from 'next/navigation'
import {useEffect} from 'react'
import {REVEAL} from '@/lib/motion/constants'
import {revealTransition, shouldSkipReveal} from '@/lib/motion/reveal'

/** Prototype scanReveal(): runs after mount, after each route change, and after DOM mutations (filters). */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          el.style.opacity = '1'
          el.style.translate = '0 0'
          io.unobserve(el)
        }
      },
      {threshold: REVEAL.THRESHOLD},
    )

    const scanAll = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rv])').forEach((el, i) => {
        el.dataset.rv = '1'
        if (shouldSkipReveal(el.getBoundingClientRect().top, window.innerHeight)) return
        el.style.opacity = '0'
        el.style.translate = `0 ${REVEAL.DISTANCE_PX}px`
        el.style.transition = revealTransition(i)
        io.observe(el)
      })
    }

    const initial = setTimeout(scanAll, REVEAL.INITIAL_SCAN_DELAY_MS)
    let pending = 0
    const mo = new MutationObserver(() => {
      if (pending) return
      pending = requestAnimationFrame(() => { pending = 0; scanAll() })
    })
    mo.observe(document.body, {childList: true, subtree: true})

    return () => {
      clearTimeout(initial)
      if (pending) cancelAnimationFrame(pending)
      mo.disconnect()
      io.disconnect()
    }
  }, [pathname])

  return null
}
```

```tsx
// web/components/motion/Timecode.tsx
'use client'

import {useEffect} from 'react'
import {TIMECODE} from '@/lib/motion/constants'
import {formatTimecode} from '@/lib/motion/timecode'

/** Prototype setInterval(40ms) writing HH:MM:SS:FF to every [data-tc]. t0 = page load. */
export function Timecode() {
  useEffect(() => {
    const t0 = Date.now()
    const id = setInterval(() => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-tc]')
      if (!nodes.length) return
      const txt = formatTimecode(Date.now() - t0)
      nodes.forEach((el) => { el.textContent = txt })
    }, TIMECODE.TICK_MS)
    return () => clearInterval(id)
  }, [])
  return null
}
```

- [ ] **Step 6: Run tests, typecheck, style verifier for the leader lines**

Run: `cd web && npx vitest run && npm run typecheck && node tools/verify-styles.mjs --lines 6-24`
Expected: PASS / 0 / `✓ … covered`.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/components/motion web/components/chrome web/lib/motion
git commit -m "feat(web): parallax loop, reveal observer, timecode and leader intro

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Plan 03 assembles these into the root layout together with the header, menu, pre-footer, footer and grain, and builds the home page.
