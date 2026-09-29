# Vazeer Art — Plan 01: Sanity Studio, Content Model and Seed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the separate Sanity Studio admin with the full content model, singleton enforcement, drag ordering, Presentation resolvers, a schema export for typegen, and a seed that recreates the prototype's content and placeholder images.

**Architecture:** `studio/` is an independent npm package (Sanity Studio v6, React 19). Schemas are split into `schemas/objects/*` and `schemas/documents/*`, assembled in `schemas/index.ts`. `structure.ts` pins six singletons and two orderable lists. `scripts/seed.ts` uploads the 22 placeholder images from `design-reference/images` and `createOrReplace`s every document with deterministic ids so it can be re-run safely.

**Tech Stack:** Node 22 (nvm), sanity 6.16, @sanity/orderable-document-list 2.0, @sanity/vision, @sanity/icons, TypeScript 5, Vitest 3.

**Spec:** `docs/superpowers/specs/2026-09-29-vazeer-portfolio-design.md` (§2, §3.5, §6, §7, §9, §12)

## Global Constraints

- Node `>=22.12` (Studio v6 requirement). Use `nvm use` at repo root; `.nvmrc` contains `22`.
- Sanity project id `iq6do512`, dataset `production`, org `o7fleb6ka`. Task 1 verifies the dataset name before anything else.
- Singleton document types and their `_id`s are identical: `siteSettings`, `homePage`, `workPage`, `framesPage`, `aboutPage`, `contactPage`.
- Every image field is `imageWithAlt` (hotspot on, required `alt`).
- Every list in the prototype is a Sanity `array`. Nothing that the prototype renders as text is hard-coded in the site.
- Page keys are exactly `home | about | work | frames | contact`. Project category values are exactly `dop | editor`. Frame ratio values are exactly `4/5 | 9/16 | 1/1 | 16/9`.
- Prototype copy is copied **verbatim** (curly apostrophes `’`, em dashes `—`, arrows `→ ↗ ✕` included) from `design-reference/markup.html`.
- Never commit `.env` files; commit `.env.example`.
- Commit after every task with the message shown; end commit bodies with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Editor deletes or duplicates a singleton** → the action must not be offered; `document.actions` filter in Task 6 has a test that the filter removes `delete` and `duplicate` for singleton types.
2. **Editor sets `mediaSlot.kind='video'` but leaves the file empty** → validation error, not a silent blank tile; Task 3 validates the conditional requirement.
3. **Editor enters a YouTube Shorts or `youtu.be` URL** → accepted; a Dailymotion URL → rejected. Task 5's `videoUrl` validation shares the regex with the web plan and is tested.
4. **Seed re-run** → no duplicate assets or documents; Task 8 tests `buildDocuments` ids are deterministic and the upload step de-duplicates by `originalFilename`.
5. **Editor removes a page entry or reorders `siteSettings.pages`** → the array is locked to the five fixed keys; Task 4 validation rejects anything other than exactly those five keys.

---

### Task 1: Toolchain and Sanity access

**Files:**
- Create: `.nvmrc`
- Create: `README.md`

**Interfaces:**
- Produces: repo root `.nvmrc` = `22`; confirmed dataset name for all later tasks.

- [ ] **Step 1: Pin Node 22 and switch to it**

```bash
cd "/Users/vikrantchaudhary/Desktop/vazeer portfolios/vazeer_web"
echo "22" > .nvmrc
source ~/.nvm/nvm.sh && nvm use
node -v
```

Expected: `Now using node v22.14.0` (or newer 22.x) and `v22.x.y`. If nvm lacks 22, run `nvm install 22`.

- [ ] **Step 2: Write the root README**

```markdown
# Vazeer Art — portfolio

Two independent packages:

- `web/` — Next.js 16 public site (deployed to Vercel)
- `studio/` — Sanity Studio v6 admin (deployed to https://vazeerart.sanity.studio)

Reference material extracted from the Claude Design export lives in `design-reference/`.
Spec and plans: `docs/superpowers/`.

## Requirements

Node 22 (`nvm use` in this folder), npm 10.

## Local development

```bash
cd studio && npm install && npm run dev      # http://localhost:3333
cd web && npm install && npm run dev         # http://localhost:3000
```
```

- [ ] **Step 3: Log in to Sanity and verify the dataset name (interactive, run by the human)**

Ask the human to run in their terminal, from the repo root:

```bash
npx sanity@latest login
npx sanity@latest datasets list --project iq6do512
```

Expected: a line containing `production`. If the dataset has a different name, replace `production` everywhere in this plan and in the spec §2 table before continuing.

- [ ] **Step 4: Commit**

```bash
git add .nvmrc README.md
git commit -m "chore: pin Node 22 and add root README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Studio package scaffold

**Files:**
- Create: `studio/package.json`
- Create: `studio/tsconfig.json`
- Create: `studio/sanity.cli.ts`
- Create: `studio/sanity.config.ts` (minimal; replaced in Task 6)
- Create: `studio/schemas/index.ts` (empty array; filled in Tasks 3–5)
- Create: `studio/.env.example`
- Create: `studio/.gitignore`
- Create: `studio/vitest.config.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `deploy`, `schema:validate`, `schema:extract`, `typegen`, `seed`, `test`, `typecheck`; `schemaTypes` export from `schemas/index.ts`.

- [ ] **Step 1: Initialise the package and install dependencies**

```bash
cd "/Users/vikrantchaudhary/Desktop/vazeer portfolios/vazeer_web"
source ~/.nvm/nvm.sh && nvm use
mkdir -p studio && cd studio
npm init -y >/dev/null
npm install sanity@latest @sanity/vision@latest @sanity/icons@latest @sanity/orderable-document-list@latest react@latest react-dom@latest styled-components@latest
npm install -D typescript@latest @types/react@latest vitest@latest
```

Expected: `sanity` resolves to 6.x, `@sanity/orderable-document-list` to 2.x, `react` to 19.2.x. Check with `npm ls sanity react @sanity/orderable-document-list --depth=0`.

- [ ] **Step 2: Replace package.json scripts and metadata**

Edit `studio/package.json` so the top-level fields read (keep the generated `dependencies`/`devDependencies`):

```json
{
  "name": "vazeer-studio",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "sanity dev",
    "build": "sanity build",
    "deploy": "sanity deploy",
    "schema:validate": "sanity schema validate",
    "schema:extract": "sanity schema extract --enforce-required-fields --path=./schema.json",
    "typegen": "npm run schema:extract && sanity typegen generate",
    "seed": "sanity exec scripts/seed.ts --with-user-token",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["./**/*.ts", "./**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write sanity.cli.ts**

```ts
// studio/sanity.cli.ts
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'iq6do512',
    dataset: 'production',
  },
  studioHost: 'vazeerart',
  autoUpdates: true,
})
```

- [ ] **Step 5: Write the minimal config and empty schema index**

```ts
// studio/schemas/index.ts
import type {SchemaTypeDefinition} from 'sanity'

export const schemaTypes: SchemaTypeDefinition[] = []
```

```ts
// studio/sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'vazeer',
  title: 'Vazeer Art',
  projectId: 'iq6do512',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
```

- [ ] **Step 6: Write .env.example, .gitignore and vitest config**

```bash
# studio/.env.example
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
```

```gitignore
# studio/.gitignore
node_modules/
dist/
.sanity/
.env
.env.*
!.env.example
```

```ts
// studio/vitest.config.ts
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
})
```

- [ ] **Step 7: Verify the studio builds and the schema validates**

```bash
cd studio && npm run typecheck && npm run schema:validate && npm run build
```

Expected: typecheck exits 0; schema validate prints no errors; build prints `Build Sanity Studio` … `Done` and creates `studio/dist/`.

- [ ] **Step 8: Commit**

```bash
cd ..
git add studio/package.json studio/package-lock.json studio/tsconfig.json studio/sanity.cli.ts studio/sanity.config.ts studio/schemas/index.ts studio/.env.example studio/.gitignore studio/vitest.config.ts
git commit -m "feat(studio): scaffold Sanity Studio v6 package

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Object types

**Files:**
- Create: `studio/schemas/objects/imageWithAlt.ts`
- Create: `studio/schemas/objects/seo.ts`
- Create: `studio/schemas/objects/link.ts`
- Create: `studio/schemas/objects/headingBlock.ts`
- Create: `studio/schemas/objects/mediaSlot.ts`
- Create: `studio/schemas/objects/exploreCard.ts`
- Create: `studio/schemas/objects/skill.ts`
- Create: `studio/schemas/objects/pageEntry.ts`
- Create: `studio/lib/constants.ts`
- Create: `studio/lib/validation.ts`
- Modify: `studio/schemas/index.ts`
- Test: `studio/lib/validation.test.ts`, `studio/schemas/objects/mediaSlot.test.ts`

**Interfaces:**
- Produces: schema type names `imageWithAlt`, `seo`, `link`, `headingBlock`, `mediaSlot`, `exploreCard`, `skill`, `pageEntry`; `SINGLETON_TYPES`, `PAGE_KEYS`, `PAGE_ROUTES`, `PageKey`, `EXPLORE_TARGETS`, `FRAME_RATIOS`, `PROJECT_CATEGORIES` from `lib/constants.ts`; `isVideoUrl(url)`, `validateMediaSlot(value)` from `lib/validation.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
// studio/lib/validation.test.ts
import {describe, expect, it} from 'vitest'
import {isVideoUrl, validateMediaSlot} from './validation'

describe('isVideoUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://vimeo.com/123456789',
    'https://player.vimeo.com/video/123456789',
  ])('accepts %s', (url) => {
    expect(isVideoUrl(url)).toBe(true)
  })

  it.each(['https://www.dailymotion.com/video/x7', 'not a url', 'https://youtube.com/', ''])(
    'rejects %s',
    (url) => {
      expect(isVideoUrl(url)).toBe(false)
    },
  )
})

describe('validateMediaSlot', () => {
  it('requires an image when kind is image', () => {
    expect(validateMediaSlot({kind: 'image'})).toBe('Choose an image')
    expect(validateMediaSlot({kind: 'image', image: {asset: {_ref: 'x'}}})).toBe(true)
  })
  it('requires a file when kind is video', () => {
    expect(validateMediaSlot({kind: 'video'})).toBe('Upload an MP4 or WebM loop')
    expect(validateMediaSlot({kind: 'video', video: {asset: {_ref: 'x'}}})).toBe(true)
  })
  it('passes when empty (field-level required handles that)', () => {
    expect(validateMediaSlot(undefined)).toBe(true)
  })
})
```

```ts
// studio/schemas/objects/mediaSlot.test.ts
import {describe, expect, it} from 'vitest'
import {mediaSlot} from './mediaSlot'

describe('mediaSlot schema', () => {
  it('has kind, image and video fields with kind defaulting to image', () => {
    const names = mediaSlot.fields.map((f) => f.name)
    expect(names).toEqual(['kind', 'image', 'video'])
    const kind = mediaSlot.fields.find((f) => f.name === 'kind')!
    expect(kind.initialValue).toBe('image')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd studio && npx vitest run`
Expected: FAIL — `Cannot find module './validation'` and `'./mediaSlot'`.

- [ ] **Step 3: Write constants and validation helpers**

```ts
// studio/lib/constants.ts
export const SINGLETON_TYPES = [
  'siteSettings',
  'homePage',
  'workPage',
  'framesPage',
  'aboutPage',
  'contactPage',
] as const
export type SingletonType = (typeof SINGLETON_TYPES)[number]

export const PAGE_KEYS = ['home', 'about', 'work', 'frames', 'contact'] as const
export type PageKey = (typeof PAGE_KEYS)[number]

export const PAGE_ROUTES: Record<PageKey, string> = {
  home: '/',
  about: '/about',
  work: '/work',
  frames: '/frames',
  contact: '/contact',
}

export const EXPLORE_TARGETS = ['work', 'frames', 'contact', 'about'] as const

export const FRAME_RATIOS = ['4/5', '9/16', '1/1', '16/9'] as const

export const PROJECT_CATEGORIES = [
  {value: 'dop', title: 'Cinematography (DOP)'},
  {value: 'editor', title: 'Editing (Editor)'},
] as const
```

```ts
// studio/lib/validation.ts
/** Same rules as web/lib/video.ts — keep in sync. */
const VIDEO_URL_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?(.*&)?v=[\w-]{6,}/i,
  /^https?:\/\/youtu\.be\/[\w-]{6,}/i,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{6,}/i,
  /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[\w-]{6,}/i,
  /^https?:\/\/(www\.)?vimeo\.com\/\d{6,}/i,
  /^https?:\/\/player\.vimeo\.com\/video\/\d{6,}/i,
]

export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false
  return VIDEO_URL_PATTERNS.some((re) => re.test(url))
}

type MediaSlotValue = {
  kind?: 'image' | 'video'
  image?: {asset?: {_ref?: string}}
  video?: {asset?: {_ref?: string}}
}

export function validateMediaSlot(value: MediaSlotValue | undefined): true | string {
  if (!value) return true
  if (value.kind === 'video') {
    return value.video?.asset?._ref ? true : 'Upload an MP4 or WebM loop'
  }
  return value.image?.asset?._ref ? true : 'Choose an image'
}
```

- [ ] **Step 4: Write the object types**

```ts
// studio/schemas/objects/imageWithAlt.ts
import {defineField, defineType} from 'sanity'

export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'One sentence describing the picture. Read by screen readers and search engines.',
      validation: (rule) => rule.required().max(200),
    }),
  ],
})
```

```ts
// studio/schemas/objects/seo.ts
import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Browser / share title', type: 'string', validation: (r) => r.max(70)}),
    defineField({name: 'description', title: 'Share description', type: 'text', rows: 3, validation: (r) => r.max(160)}),
    defineField({name: 'image', title: 'Share image (1200×630)', type: 'imageWithAlt'}),
  ],
})
```

```ts
// studio/schemas/objects/link.ts
import {defineField, defineType} from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(40)}),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (r) => r.required().uri({scheme: ['http', 'https', 'mailto', 'tel']}),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'url'}},
})
```

```ts
// studio/schemas/objects/headingBlock.ts
import {defineField, defineType} from 'sanity'

export const headingBlock = defineType({
  name: 'headingBlock',
  title: 'Heading',
  type: 'object',
  fields: [
    defineField({
      name: 'script',
      title: 'Script line (handwritten style)',
      type: 'string',
      description: 'The small cursive line above the heading, e.g. "now showing".',
      validation: (r) => r.required().max(40),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (r) => r.required().max(40),
    }),
  ],
  preview: {select: {title: 'heading', subtitle: 'script'}},
})
```

```ts
// studio/schemas/objects/mediaSlot.ts
import {defineField, defineType} from 'sanity'
import {validateMediaSlot} from '../../lib/validation'

export const mediaSlot = defineType({
  name: 'mediaSlot',
  title: 'Image or video loop',
  type: 'object',
  description: 'Use a still image or animated GIF, or a short muted MP4/WebM loop.',
  validation: (rule) => rule.custom((value) => validateMediaSlot(value as never)),
  fields: [
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      initialValue: 'image',
      options: {list: [{title: 'Image / GIF', value: 'image'}, {title: 'Video loop', value: 'video'}], layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image or GIF',
      type: 'imageWithAlt',
      hidden: ({parent}) => parent?.kind === 'video',
    }),
    defineField({
      name: 'video',
      title: 'Video loop (MP4 or WebM, muted)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
      hidden: ({parent}) => parent?.kind !== 'video',
    }),
  ],
  preview: {
    select: {kind: 'kind', media: 'image', alt: 'image.alt'},
    prepare({kind, media, alt}) {
      return {title: alt || (kind === 'video' ? 'Video loop' : 'Image'), media}
    },
  },
})
```

```ts
// studio/schemas/objects/exploreCard.ts
import {defineField, defineType} from 'sanity'
import {EXPLORE_TARGETS} from '../../lib/constants'

export const exploreCard = defineType({
  name: 'exploreCard',
  title: 'Explore card',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(30)}),
    defineField({name: 'sub', title: 'Small italic word (before the arrow)', type: 'string', validation: (r) => r.required().max(20)}),
    defineField({name: 'image', title: 'Image (3:4)', type: 'imageWithAlt', validation: (r) => r.required()}),
    defineField({
      name: 'target',
      title: 'Opens page',
      type: 'string',
      options: {list: EXPLORE_TARGETS.map((t) => ({title: t, value: t}))},
      validation: (r) => r.required(),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'target', media: 'image'}},
})
```

```ts
// studio/schemas/objects/skill.ts
import {defineField, defineType} from 'sanity'

export const skill = defineType({
  name: 'skill',
  title: 'Skill tile',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(30)}),
    defineField({name: 'media', title: 'Tile (square)', type: 'mediaSlot', validation: (r) => r.required()}),
    defineField({
      name: 'tilt',
      title: 'Tilt (degrees)',
      type: 'number',
      description: 'Negative tilts left, positive tilts right. Prototype uses -3, 2, -2, 3.',
      initialValue: 0,
      validation: (r) => r.required().min(-15).max(15),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'tilt', media: 'media.image'}},
})
```

```ts
// studio/schemas/objects/pageEntry.ts
import {defineField, defineType} from 'sanity'
import {PAGE_KEYS} from '../../lib/constants'

export const pageEntry = defineType({
  name: 'pageEntry',
  title: 'Page',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'Page',
      type: 'string',
      readOnly: true,
      options: {list: PAGE_KEYS.map((k) => ({title: k, value: k}))},
      validation: (r) => r.required(),
    }),
    defineField({name: 'navLabel', title: 'Header label', type: 'string', validation: (r) => r.required().max(20)}),
    defineField({name: 'menuLabel', title: 'Full-screen menu label', type: 'string', validation: (r) => r.required().max(20)}),
    defineField({
      name: 'preFooterScript',
      title: 'Pre-footer script line',
      type: 'string',
      description: 'Cursive line above the pre-footer link, e.g. "learn more". Leave empty for Home.',
      validation: (r) => r.max(20),
    }),
    defineField({
      name: 'preFooterLabel',
      title: 'Pre-footer label',
      type: 'string',
      description: 'e.g. "About me". Leave empty for Home.',
      validation: (r) => r.max(20),
    }),
  ],
  preview: {select: {title: 'navLabel', subtitle: 'key'}},
})
```

- [ ] **Step 5: Register the objects**

```ts
// studio/schemas/index.ts
import type {SchemaTypeDefinition} from 'sanity'
import {imageWithAlt} from './objects/imageWithAlt'
import {seo} from './objects/seo'
import {link} from './objects/link'
import {headingBlock} from './objects/headingBlock'
import {mediaSlot} from './objects/mediaSlot'
import {exploreCard} from './objects/exploreCard'
import {skill} from './objects/skill'
import {pageEntry} from './objects/pageEntry'

export const objectTypes: SchemaTypeDefinition[] = [
  imageWithAlt,
  seo,
  link,
  headingBlock,
  mediaSlot,
  exploreCard,
  skill,
  pageEntry,
]

export const documentTypes: SchemaTypeDefinition[] = []

export const schemaTypes: SchemaTypeDefinition[] = [...objectTypes, ...documentTypes]
```

- [ ] **Step 6: Run tests, typecheck and schema validation**

Run: `cd studio && npx vitest run && npm run typecheck && npm run schema:validate`
Expected: all tests PASS; typecheck exits 0; validate prints no errors.

- [ ] **Step 7: Commit**

```bash
cd ..
git add studio/schemas studio/lib
git commit -m "feat(studio): add object types, constants and validation helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Singleton documents

**Files:**
- Create: `studio/schemas/documents/siteSettings.ts`
- Create: `studio/schemas/documents/homePage.ts`
- Create: `studio/schemas/documents/workPage.ts`
- Create: `studio/schemas/documents/framesPage.ts`
- Create: `studio/schemas/documents/aboutPage.ts`
- Create: `studio/schemas/documents/contactPage.ts`
- Modify: `studio/schemas/index.ts`
- Test: `studio/schemas/documents/singletons.test.ts`

**Interfaces:**
- Produces: document types named exactly as `SINGLETON_TYPES`; field names as listed below are consumed verbatim by web GROQ queries (Plan 02 Task 4).

- [ ] **Step 1: Write the failing test**

```ts
// studio/schemas/documents/singletons.test.ts
import {describe, expect, it} from 'vitest'
import {documentTypes} from '../index'
import {SINGLETON_TYPES} from '../../lib/constants'

const byName = (name: string) => documentTypes.find((t) => t.name === name) as any

describe('singleton documents', () => {
  it('registers every singleton type', () => {
    for (const name of SINGLETON_TYPES) expect(byName(name), name).toBeDefined()
  })
  it('siteSettings has the five page entries validation and four toggles', () => {
    const fields = byName('siteSettings').fields.map((f: any) => f.name)
    expect(fields).toEqual(
      expect.arrayContaining(['brandWord', 'brandScript', 'copyright', 'socials', 'management', 'dm', 'marqueeWords', 'pages', 'leaderLeft', 'leaderRight', 'leaderSkip', 'menuScript', 'menuClose', 'menuSocialsLabel', 'menuPhoto', 'showIntro', 'showMarquee', 'showGrain', 'showRec', 'seo']),
    )
  })
  it('workPage carries the project-page labels group', () => {
    const projectPage = byName('workPage').fields.find((f: any) => f.name === 'projectPage')
    expect(projectPage.fields.map((f: any) => f.name)).toEqual([
      'backLabel', 'reelPrefix', 'roleLabel', 'formatLabel', 'yearLabel', 'aspectLabel', 'grabsScript', 'grabsHeading', 'upNextScript',
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd studio && npx vitest run schemas/documents`
Expected: FAIL — `byName('siteSettings')` is undefined.

- [ ] **Step 3: Write siteSettings**

```ts
// studio/schemas/documents/siteSettings.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons'
import {PAGE_KEYS} from '../../lib/constants'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'brand', title: 'Brand', default: true},
    {name: 'nav', title: 'Navigation'},
    {name: 'menu', title: 'Menu overlay'},
    {name: 'leader', title: 'Intro countdown'},
    {name: 'toggles', title: 'Toggles'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'brandWord', title: 'Brand word', type: 'string', group: 'brand', description: 'Header and footer, bold. Prototype: "Vazeer".', validation: (r) => r.required().max(20)}),
    defineField({name: 'brandScript', title: 'Brand script word', type: 'string', group: 'brand', description: 'Cursive amber word after the brand. Prototype: "art.".', validation: (r) => r.required().max(12)}),
    defineField({name: 'copyright', title: 'Footer copyright line', type: 'string', group: 'brand', validation: (r) => r.required().max(80)}),
    defineField({name: 'socials', title: 'Social links', type: 'array', group: 'brand', of: [defineArrayMember({type: 'link'})], validation: (r) => r.min(1)}),
    defineField({
      name: 'management',
      title: 'Management contact (contact page)',
      type: 'object',
      group: 'brand',
      fields: [
        defineField({name: 'label', title: 'Italic label', type: 'string', initialValue: 'management', validation: (r) => r.required()}),
        defineField({name: 'handle', title: 'Handle shown', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'dm',
      title: 'Direct message contact (contact page)',
      type: 'object',
      group: 'brand',
      fields: [
        defineField({name: 'label', title: 'Italic label', type: 'string', initialValue: 'dm me', validation: (r) => r.required()}),
        defineField({name: 'handle', title: 'Handle shown', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'marqueeWords',
      title: 'Marquee words',
      type: 'array',
      group: 'brand',
      of: [defineArrayMember({type: 'string'})],
      description: 'Scrolling amber band under the hero. Repeats automatically.',
      validation: (r) => r.min(2),
    }),
    defineField({
      name: 'pages',
      title: 'Pages (labels only — the pages themselves are fixed)',
      type: 'array',
      group: 'nav',
      of: [defineArrayMember({type: 'pageEntry'})],
      validation: (r) =>
        r.required().custom((value) => {
          const keys = ((value as {key?: string}[] | undefined) ?? []).map((p) => p.key)
          const expected = [...PAGE_KEYS]
          return keys.length === expected.length && keys.every((k, i) => k === expected[i])
            ? true
            : `Must contain exactly these pages in this order: ${expected.join(', ')}`
        }),
    }),
    defineField({name: 'menuScript', title: 'Menu script word', type: 'string', group: 'menu', initialValue: 'menu', validation: (r) => r.required().max(20)}),
    defineField({name: 'menuClose', title: 'Close label', type: 'string', group: 'menu', initialValue: 'Close ✕', validation: (r) => r.required().max(20)}),
    defineField({name: 'menuSocialsLabel', title: 'Socials label', type: 'string', group: 'menu', initialValue: 'follow on socials /', validation: (r) => r.required().max(40)}),
    defineField({name: 'menuPhoto', title: 'Menu photo (4:5, tilted polaroid)', type: 'imageWithAlt', group: 'menu', validation: (r) => r.required()}),
    defineField({name: 'leaderLeft', title: 'Countdown left caption', type: 'string', group: 'leader', initialValue: 'Vazeer Art', validation: (r) => r.required().max(30)}),
    defineField({name: 'leaderRight', title: 'Countdown right caption', type: 'string', group: 'leader', initialValue: 'Showreel 2026', validation: (r) => r.required().max(30)}),
    defineField({name: 'leaderSkip', title: 'Skip label', type: 'string', group: 'leader', initialValue: 'Skip →', validation: (r) => r.required().max(20)}),
    defineField({name: 'showIntro', title: 'Show 3-2-1 intro (once per visit)', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'showMarquee', title: 'Show marquee band', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'showGrain', title: 'Show film grain overlay', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'showRec', title: 'Show REC dot + timecode on project covers', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'seo', title: 'Default SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
```

- [ ] **Step 4: Write homePage**

```ts
// studio/schemas/documents/homePage.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'intro', title: 'Intro'},
    {name: 'reels', title: 'Selected reels'},
    {name: 'explore', title: 'Explore'},
    {name: 'currently', title: 'Currently'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({name: 'word', title: 'Giant word', type: 'string', initialValue: 'Vazeer', validation: (r) => r.required().max(12)}),
        defineField({name: 'script', title: 'Cursive word (bottom-right of giant word)', type: 'string', initialValue: 'art', validation: (r) => r.required().max(10)}),
        defineField({name: 'mainImage', title: 'Main 16:9 frame', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({name: 'polaroidLeft', title: 'Left polaroid (3:4) — GIF or loop', type: 'mediaSlot', validation: (r) => r.required()}),
        defineField({name: 'polaroidRight', title: 'Right polaroid (16:10) — film still', type: 'mediaSlot', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      group: 'intro',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: "hey, i'm", validation: (r) => r.required().max(30)}),
        defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Vazeer Art', validation: (r) => r.required().max(30)}),
        defineField({name: 'subline', title: 'Italic subline', type: 'string', validation: (r) => r.required().max(80)}),
        defineField({name: 'body', title: 'Paragraph', type: 'text', rows: 5, validation: (r) => r.required().max(600)}),
        defineField({name: 'ctaLabel', title: 'Button label', type: 'string', initialValue: 'More about me →', validation: (r) => r.required().max(40)}),
        defineField({name: 'imageA', title: 'Large image (4:5)', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({name: 'imageB', title: 'Small tilted image (4:5)', type: 'imageWithAlt', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'reels',
      title: 'Selected reels',
      type: 'object',
      group: 'reels',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'ctaLabel', title: 'Link label', type: 'string', initialValue: 'All work & reels →', validation: (r) => r.required().max(40)}),
      ],
    }),
    defineField({
      name: 'explore',
      title: 'Explore',
      type: 'object',
      group: 'explore',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'cards', title: 'Cards', type: 'array', of: [defineArrayMember({type: 'exploreCard'})], validation: (r) => r.min(1).max(6)}),
      ],
    }),
    defineField({
      name: 'currently',
      title: 'Currently',
      type: 'object',
      group: 'currently',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: 'currently', validation: (r) => r.required().max(30)}),
        defineField({name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required().max(80)}),
        defineField({name: 'body', title: 'Paragraph', type: 'text', rows: 4, validation: (r) => r.required().max(400)}),
        defineField({name: 'ctaLabel', title: 'Button label', type: 'string', initialValue: 'Start a project →', validation: (r) => r.required().max(40)}),
        defineField({name: 'bgImage', title: 'Full-bleed background', type: 'imageWithAlt', validation: (r) => r.required()}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Home'})},
})
```

- [ ] **Step 5: Write workPage and framesPage**

```ts
// studio/schemas/documents/workPage.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons'
import {isVideoUrl} from '../../lib/validation'

export const workPage = defineType({
  name: 'workPage',
  title: 'Work & Reels',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'header', title: 'Header', default: true},
    {name: 'showreel', title: 'Showreel'},
    {name: 'list', title: 'Project list'},
    {name: 'skills', title: 'Special skills'},
    {name: 'projectPage', title: 'Project page labels'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'title', title: 'Giant title', type: 'string', group: 'header', initialValue: 'Work', validation: (r) => r.required().max(12)}),
    defineField({name: 'script', title: 'Cursive word overlapping the title', type: 'string', group: 'header', initialValue: '& reels', validation: (r) => r.required().max(16)}),
    defineField({name: 'intro', title: 'Italic intro line', type: 'string', group: 'header', validation: (r) => r.required().max(120)}),
    defineField({name: 'filterAll', title: 'Filter label: all', type: 'string', group: 'header', initialValue: 'All', validation: (r) => r.required().max(20)}),
    defineField({name: 'filterDop', title: 'Filter label: cinematography', type: 'string', group: 'header', initialValue: 'Cinematography', validation: (r) => r.required().max(20)}),
    defineField({name: 'filterEditor', title: 'Filter label: editing', type: 'string', group: 'header', initialValue: 'Editing', validation: (r) => r.required().max(20)}),
    defineField({
      name: 'showreel',
      title: 'Showreel',
      type: 'object',
      group: 'showreel',
      fields: [
        defineField({name: 'poster', title: 'Poster frame (16:9)', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({
          name: 'videoUrl',
          title: 'YouTube or Vimeo URL',
          type: 'url',
          description: 'Leave empty to hide the play button.',
          validation: (r) => r.custom((v) => (!v || isVideoUrl(v) ? true : 'Enter a YouTube or Vimeo link')),
        }),
        defineField({name: 'label', title: 'Label', type: 'string', initialValue: 'Showreel', validation: (r) => r.required().max(20)}),
        defineField({name: 'orderNotePrefix', title: 'Order note prefix', type: 'string', initialValue: 'in order of appearance:', validation: (r) => r.required().max(40)}),
        defineField({name: 'orderNoteOverride', title: 'Order note override (optional)', type: 'string', description: 'If set, replaces the automatic list of project titles.', validation: (r) => r.max(200)}),
      ],
    }),
    defineField({name: 'numberPrefix', title: 'Number prefix in list', type: 'string', group: 'list', initialValue: 'no.', validation: (r) => r.required().max(10)}),
    defineField({name: 'projectCta', title: 'Project link label', type: 'string', group: 'list', initialValue: 'Watch & view frames →', validation: (r) => r.required().max(40)}),
    defineField({
      name: 'skills',
      title: 'Special skills',
      type: 'object',
      group: 'skills',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'items', title: 'Tiles', type: 'array', of: [defineArrayMember({type: 'skill'})], validation: (r) => r.min(1).max(8)}),
      ],
    }),
    defineField({
      name: 'projectPage',
      title: 'Project page labels',
      type: 'object',
      group: 'projectPage',
      fields: [
        defineField({name: 'backLabel', title: 'Back link', type: 'string', initialValue: '← Work & reels', validation: (r) => r.required().max(30)}),
        defineField({name: 'reelPrefix', title: 'Script prefix before the number', type: 'string', initialValue: 'reel no.', validation: (r) => r.required().max(20)}),
        defineField({name: 'roleLabel', title: 'Role label', type: 'string', initialValue: 'role', validation: (r) => r.required().max(20)}),
        defineField({name: 'formatLabel', title: 'Format label', type: 'string', initialValue: 'format', validation: (r) => r.required().max(20)}),
        defineField({name: 'yearLabel', title: 'Year label', type: 'string', initialValue: 'year', validation: (r) => r.required().max(20)}),
        defineField({name: 'aspectLabel', title: 'Aspect ratio HUD label', type: 'string', initialValue: '2.39 : 1', validation: (r) => r.required().max(20)}),
        defineField({name: 'grabsScript', title: 'Frame grabs script line', type: 'string', initialValue: 'frame', validation: (r) => r.required().max(20)}),
        defineField({name: 'grabsHeading', title: 'Frame grabs heading', type: 'string', initialValue: 'Grabs', validation: (r) => r.required().max(20)}),
        defineField({name: 'upNextScript', title: 'Up next script line', type: 'string', initialValue: 'up next', validation: (r) => r.required().max(20)}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Work & Reels'})},
})
```

```ts
// studio/schemas/documents/framesPage.ts
import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const framesPage = defineType({
  name: 'framesPage',
  title: 'Frames page',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({name: 'script', title: 'Script line', type: 'string', initialValue: 'straight from the grid', validation: (r) => r.required().max(40)}),
    defineField({name: 'heading', title: 'Giant heading', type: 'string', initialValue: 'Frames', validation: (r) => r.required().max(12)}),
    defineField({name: 'linkLabel', title: 'Link label', type: 'string', initialValue: '(follow along @vazeerart ↗)', validation: (r) => r.required().max(60)}),
    defineField({name: 'linkUrl', title: 'Link URL', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'reelLabel', title: 'Placeholder label for 9:16 frames', type: 'string', initialValue: 'Reel cover', validation: (r) => r.required().max(30)}),
    defineField({name: 'postLabel', title: 'Placeholder label for other frames', type: 'string', initialValue: 'Instagram post', validation: (r) => r.required().max(30)}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Frames page'})},
})
```

- [ ] **Step 6: Write aboutPage and contactPage**

```ts
// studio/schemas/documents/aboutPage.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'statement', title: 'Statement'},
    {name: 'credits', title: 'Credits'},
    {name: 'finale', title: 'Finale'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: "hey, i'm", validation: (r) => r.required().max(30)}),
        defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Vazeer Art', validation: (r) => r.required().max(30)}),
        defineField({name: 'body', title: 'Paragraph', type: 'text', rows: 5, validation: (r) => r.required().max(600)}),
        defineField({name: 'ctaLabel', title: 'Button label', type: 'string', initialValue: 'Get in touch →', validation: (r) => r.required().max(40)}),
        defineField({name: 'portrait', title: 'Portrait (4:5)', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({name: 'polaroid', title: 'Tilted polaroid (3:4) — GIF or loop', type: 'mediaSlot', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'statement',
      title: 'Statement',
      type: 'object',
      group: 'statement',
      fields: [
        defineField({name: 'headingPlain', title: 'Heading (plain part)', type: 'string', validation: (r) => r.required().max(120)}),
        defineField({name: 'headingAccent', title: 'Heading (rust accent part)', type: 'string', validation: (r) => r.required().max(40)}),
        defineField({name: 'paragraphs', title: 'Paragraphs', type: 'array', of: [defineArrayMember({type: 'text', rows: 4})], validation: (r) => r.min(1).max(6)}),
        defineField({name: 'aside', title: 'Italic aside', type: 'string', validation: (r) => r.required().max(80)}),
      ],
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'object',
      group: 'credits',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'imdbLabel', title: 'IMDb link label', type: 'string', initialValue: 'Full list on IMDb ↗', validation: (r) => r.required().max(40)}),
        defineField({name: 'imdbUrl', title: 'IMDb URL', type: 'url', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'finale',
      title: 'Finale',
      type: 'object',
      group: 'finale',
      fields: [
        defineField({name: 'script', title: 'Giant script line', type: 'string', initialValue: 'find the frame', validation: (r) => r.required().max(30)}),
        defineField({name: 'sub', title: 'Italic subline', type: 'string', validation: (r) => r.required().max(60)}),
        defineField({name: 'bgImage', title: 'Full-bleed background', type: 'imageWithAlt', validation: (r) => r.required()}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'About'})},
})
```

```ts
// studio/schemas/documents/contactPage.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact',
  type: 'document',
  icon: EnvelopeIcon,
  groups: [
    {name: 'intro', title: 'Intro', default: true},
    {name: 'form', title: 'Form'},
    {name: 'success', title: 'Sent state'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'script', title: 'Script line', type: 'string', group: 'intro', initialValue: 'get in', validation: (r) => r.required().max(20)}),
    defineField({name: 'heading', title: 'Giant heading', type: 'string', group: 'intro', initialValue: 'Touch', validation: (r) => r.required().max(12)}),
    defineField({name: 'intro', title: 'Italic intro', type: 'text', rows: 2, group: 'intro', validation: (r) => r.required().max(160)}),
    defineField({name: 'photo', title: 'Tilted photo (4:5)', type: 'imageWithAlt', group: 'intro', validation: (r) => r.required()}),
    defineField({
      name: 'form',
      title: 'Form',
      type: 'object',
      group: 'form',
      fields: [
        defineField({name: 'heading', title: 'Form heading', type: 'string', initialValue: 'The brief', validation: (r) => r.required().max(30)}),
        defineField({name: 'typeQuestion', title: 'Type question', type: 'string', initialValue: 'what are we making?', validation: (r) => r.required().max(60)}),
        defineField({name: 'types', title: 'Type chips', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (r) => r.min(1).max(8)}),
        defineField({name: 'nameLabel', title: 'Name label', type: 'string', initialValue: 'your name', validation: (r) => r.required().max(40)}),
        defineField({name: 'contactLabel', title: 'Contact label', type: 'string', initialValue: 'email or phone', validation: (r) => r.required().max(40)}),
        defineField({name: 'datesLabel', title: 'Dates label', type: 'string', initialValue: 'dates & location', validation: (r) => r.required().max(40)}),
        defineField({name: 'briefLabel', title: 'Brief label', type: 'string', initialValue: 'the idea, references, budget', validation: (r) => r.required().max(60)}),
        defineField({name: 'submitLabel', title: 'Submit label', type: 'string', initialValue: 'Send it →', validation: (r) => r.required().max(20)}),
      ],
    }),
    defineField({
      name: 'success',
      title: 'Sent state',
      type: 'object',
      group: 'success',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: 'that’s a wrap', validation: (r) => r.required().max(30)}),
        defineField({name: 'body', title: 'Message', type: 'string', validation: (r) => r.required().max(160)}),
        defineField({name: 'resetLabel', title: 'Reset label', type: 'string', initialValue: 'Send another', validation: (r) => r.required().max(20)}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Contact'})},
})
```

- [ ] **Step 7: Register the singletons**

In `studio/schemas/index.ts` add the imports and fill `documentTypes`:

```ts
import {siteSettings} from './documents/siteSettings'
import {homePage} from './documents/homePage'
import {workPage} from './documents/workPage'
import {framesPage} from './documents/framesPage'
import {aboutPage} from './documents/aboutPage'
import {contactPage} from './documents/contactPage'

export const documentTypes: SchemaTypeDefinition[] = [
  siteSettings,
  homePage,
  workPage,
  framesPage,
  aboutPage,
  contactPage,
]
```

- [ ] **Step 8: Run tests, typecheck, validate**

Run: `cd studio && npx vitest run && npm run typecheck && npm run schema:validate`
Expected: PASS / 0 / no errors.

- [ ] **Step 9: Commit**

```bash
cd ..
git add studio/schemas
git commit -m "feat(studio): add the six singleton page documents

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Collections — project, frame, inquiry

**Files:**
- Create: `studio/schemas/documents/project.ts`
- Create: `studio/schemas/documents/frame.ts`
- Create: `studio/schemas/documents/inquiry.ts`
- Modify: `studio/schemas/index.ts`
- Test: `studio/schemas/documents/collections.test.ts`

**Interfaces:**
- Produces: `project` fields `title, slug, format, year, role, category, cover, frameGrabs, videoUrl, showOnHome, creditOnly, seo, orderRank`; `frame` fields `image, ratio, instagramUrl, orderRank`; `inquiry` fields `type, name, contact, dates, brief, receivedAt, read`.

- [ ] **Step 1: Write the failing test**

```ts
// studio/schemas/documents/collections.test.ts
import {describe, expect, it} from 'vitest'
import {documentTypes} from '../index'

const byName = (name: string) => documentTypes.find((t) => t.name === name) as any
const fieldNames = (name: string) => byName(name).fields.map((f: any) => f.name)

describe('collections', () => {
  it('project has the spec fields including orderRank', () => {
    expect(fieldNames('project')).toEqual([
      'orderRank', 'title', 'slug', 'format', 'year', 'role', 'category', 'cover', 'frameGrabs', 'videoUrl', 'showOnHome', 'creditOnly', 'seo',
    ])
  })
  it('frame has image, ratio, instagramUrl and orderRank', () => {
    expect(fieldNames('frame')).toEqual(['orderRank', 'image', 'ratio', 'instagramUrl'])
  })
  it('inquiry fields are read-only except read', () => {
    const fields = byName('inquiry').fields as any[]
    for (const f of fields) {
      if (f.name === 'read') expect(f.readOnly).toBeFalsy()
      else expect(f.readOnly, f.name).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd studio && npx vitest run collections`
Expected: FAIL — `byName('project')` undefined.

- [ ] **Step 3: Write project**

```ts
// studio/schemas/documents/project.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {VideoIcon} from '@sanity/icons'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {PROJECT_CATEGORIES} from '../../lib/constants'
import {isVideoUrl} from '../../lib/validation'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: VideoIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'project'}),
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required().max(40)}),
    defineField({name: 'slug', title: 'URL slug', type: 'slug', options: {source: 'title', maxLength: 60}, validation: (r) => r.required()}),
    defineField({name: 'format', title: 'Format', type: 'string', description: 'e.g. Music Video, TV Mini Series, Short Film', validation: (r) => r.required().max(30)}),
    defineField({name: 'year', title: 'Year', type: 'string', validation: (r) => r.required().regex(/^\d{4}$/, {name: 'four digits'})}),
    defineField({name: 'role', title: 'Role (full)', type: 'string', description: 'e.g. Director of Photography', validation: (r) => r.required().max(40)}),
    defineField({
      name: 'category',
      title: 'Category (drives the Work filter)',
      type: 'string',
      options: {list: PROJECT_CATEGORIES.map((c) => ({title: c.title, value: c.value})), layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'cover', title: 'Cover frame (16:9, shown 2.39:1 on the project page)', type: 'imageWithAlt', validation: (r) => r.required()}),
    defineField({name: 'frameGrabs', title: 'Frame grabs (16:9)', type: 'array', of: [defineArrayMember({type: 'imageWithAlt'})], validation: (r) => r.max(12)}),
    defineField({
      name: 'videoUrl',
      title: 'YouTube or Vimeo URL',
      type: 'url',
      description: 'Adds a play button on the project cover. Leave empty if there is no video yet.',
      validation: (r) => r.custom((v) => (!v || isVideoUrl(v) ? true : 'Enter a YouTube or Vimeo link')),
    }),
    defineField({name: 'showOnHome', title: 'Show in the home "Selected reels" rail', type: 'boolean', initialValue: true}),
    defineField({
      name: 'creditOnly',
      title: 'Credit only (no project page)',
      type: 'boolean',
      description: 'On: appears in the About credits list only. Off: full project page and listing.',
      initialValue: false,
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {
    select: {title: 'title', format: 'format', year: 'year', media: 'cover', creditOnly: 'creditOnly'},
    prepare({title, format, year, media, creditOnly}) {
      return {title, subtitle: `${format ?? ''}, ${year ?? ''}${creditOnly ? ' · credit only' : ''}`, media}
    },
  },
})
```

- [ ] **Step 4: Write frame and inquiry**

```ts
// studio/schemas/documents/frame.ts
import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {FRAME_RATIOS} from '../../lib/constants'

export const frame = defineType({
  name: 'frame',
  title: 'Frame',
  type: 'document',
  icon: ImageIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'frame'}),
    defineField({name: 'image', title: 'Image', type: 'imageWithAlt', validation: (r) => r.required()}),
    defineField({
      name: 'ratio',
      title: 'Aspect ratio',
      type: 'string',
      initialValue: '4/5',
      options: {list: FRAME_RATIOS.map((v) => ({title: v.replace('/', ':'), value: v})), layout: 'radio', direction: 'horizontal'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'instagramUrl', title: 'Instagram post URL (optional)', type: 'url'}),
  ],
  preview: {
    select: {media: 'image', alt: 'image.alt', ratio: 'ratio'},
    prepare({media, alt, ratio}) {
      return {title: alt || 'Frame', subtitle: ratio, media}
    },
  },
})
```

```ts
// studio/schemas/documents/inquiry.ts
import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons'

export const inquiry = defineType({
  name: 'inquiry',
  title: 'Inquiry',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({name: 'type', title: 'Type', type: 'string', readOnly: true}),
    defineField({name: 'name', title: 'Name', type: 'string', readOnly: true}),
    defineField({name: 'contact', title: 'Email or phone', type: 'string', readOnly: true}),
    defineField({name: 'dates', title: 'Dates & location', type: 'string', readOnly: true}),
    defineField({name: 'brief', title: 'Brief', type: 'text', rows: 6, readOnly: true}),
    defineField({name: 'receivedAt', title: 'Received', type: 'datetime', readOnly: true}),
    defineField({name: 'read', title: 'Read', type: 'boolean', initialValue: false}),
  ],
  orderings: [{title: 'Newest first', name: 'receivedDesc', by: [{field: 'receivedAt', direction: 'desc'}]}],
  preview: {
    select: {name: 'name', type: 'type', receivedAt: 'receivedAt', read: 'read'},
    prepare({name, type, receivedAt, read}) {
      const when = receivedAt ? new Date(receivedAt).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : ''
      return {title: `${read ? '' : '● '}${name ?? 'Unnamed'}`, subtitle: `${type ?? ''} · ${when}`}
    },
  },
})
```

- [ ] **Step 5: Register the collections**

In `studio/schemas/index.ts` add imports for `project`, `frame`, `inquiry` and append them to `documentTypes` after `contactPage`.

- [ ] **Step 6: Run tests, typecheck, validate**

Run: `cd studio && npx vitest run && npm run typecheck && npm run schema:validate`
Expected: PASS / 0 / no errors.

- [ ] **Step 7: Commit**

```bash
cd ..
git add studio/schemas
git commit -m "feat(studio): add project, frame and inquiry collections

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Structure, singleton enforcement, Presentation resolvers, config

**Files:**
- Create: `studio/structure.ts`
- Create: `studio/lib/documentPolicies.ts`
- Create: `studio/presentation/resolve.ts`
- Modify: `studio/sanity.config.ts`
- Test: `studio/lib/documentPolicies.test.ts`

**Interfaces:**
- Consumes: `SINGLETON_TYPES`, `PAGE_ROUTES` (Task 3), all document types (Tasks 4–5).
- Produces: `filterNewDocumentOptions(prev, context)`, `filterDocumentActions(prev, context)`; `structure: StructureResolver`; `resolve: PresentationPluginOptions['resolve']`.

- [ ] **Step 1: Write the failing test**

```ts
// studio/lib/documentPolicies.test.ts
import {describe, expect, it} from 'vitest'
import {filterDocumentActions, filterNewDocumentOptions} from './documentPolicies'

const actions = ['publish', 'unpublish', 'discardChanges', 'duplicate', 'delete', 'restore'].map(
  (action) => ({action}) as any,
)

describe('filterDocumentActions', () => {
  it('leaves only publish, discardChanges and restore for singletons', () => {
    const out = filterDocumentActions(actions, {schemaType: 'homePage'} as any).map((a: any) => a.action)
    expect(out).toEqual(['publish', 'discardChanges', 'restore'])
  })
  it('removes duplicate for inquiries but keeps delete', () => {
    const out = filterDocumentActions(actions, {schemaType: 'inquiry'} as any).map((a: any) => a.action)
    expect(out).toEqual(['publish', 'unpublish', 'discardChanges', 'delete', 'restore'])
  })
  it('leaves projects untouched', () => {
    expect(filterDocumentActions(actions, {schemaType: 'project'} as any)).toEqual(actions)
  })
})

describe('filterNewDocumentOptions', () => {
  const templates = ['siteSettings', 'homePage', 'project', 'frame', 'inquiry'].map((templateId) => ({templateId}) as any)
  it('hides singletons and inquiries from the global create menu', () => {
    const out = filterNewDocumentOptions(templates, {creationContext: {type: 'global'}} as any).map((t: any) => t.templateId)
    expect(out).toEqual(['project', 'frame'])
  })
  it('does not touch non-global contexts', () => {
    expect(filterNewDocumentOptions(templates, {creationContext: {type: 'document'}} as any)).toEqual(templates)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd studio && npx vitest run documentPolicies`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the policies**

```ts
// studio/lib/documentPolicies.ts
import type {DocumentActionComponent, NewDocumentOptionsContext, TemplateItem} from 'sanity'
import {SINGLETON_TYPES} from './constants'

const singletons = new Set<string>(SINGLETON_TYPES)
const SINGLETON_ACTIONS = new Set(['publish', 'discardChanges', 'restore'])

export function filterNewDocumentOptions(prev: TemplateItem[], context: NewDocumentOptionsContext): TemplateItem[] {
  if (context.creationContext.type !== 'global') return prev
  return prev.filter((item) => !singletons.has(item.templateId) && item.templateId !== 'inquiry')
}

export function filterDocumentActions(
  prev: DocumentActionComponent[],
  context: {schemaType: string},
): DocumentActionComponent[] {
  if (singletons.has(context.schemaType)) {
    return prev.filter(({action}) => action && SINGLETON_ACTIONS.has(action))
  }
  if (context.schemaType === 'inquiry') {
    return prev.filter(({action}) => action !== 'duplicate')
  }
  return prev
}
```

- [ ] **Step 4: Write the structure**

```ts
// studio/structure.ts
import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {CogIcon, CommentIcon, EnvelopeIcon, HomeIcon, ImageIcon, ImagesIcon, PlayIcon, UserIcon, VideoIcon} from '@sanity/icons'
import type {SingletonType} from './lib/constants'

function singleton(S: StructureBuilder, type: SingletonType, title: string, icon: React.ComponentType) {
  return S.listItem().title(title).icon(icon).id(type).child(S.document().schemaType(type).documentId(type))
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Vazeer Art')
    .items([
      singleton(S, 'siteSettings', 'Site settings', CogIcon),
      singleton(S, 'homePage', 'Home', HomeIcon),
      singleton(S, 'workPage', 'Work & Reels', PlayIcon),
      singleton(S, 'framesPage', 'Frames page', ImagesIcon),
      singleton(S, 'aboutPage', 'About', UserIcon),
      singleton(S, 'contactPage', 'Contact', EnvelopeIcon),
      S.divider(),
      orderableDocumentListDeskItem({type: 'project', title: 'Projects', icon: VideoIcon, S, context}),
      orderableDocumentListDeskItem({type: 'frame', title: 'Frames', icon: ImageIcon, S, context}),
      S.divider(),
      S.listItem()
        .title('Inquiries')
        .icon(CommentIcon)
        .child(
          S.documentTypeList('inquiry')
            .title('Inquiries')
            .defaultOrdering([{field: 'receivedAt', direction: 'desc'}]),
        ),
    ])
```

- [ ] **Step 5: Write the Presentation resolvers**

```ts
// studio/presentation/resolve.ts
import {defineDocuments, defineLocations, type PresentationPluginOptions} from 'sanity/presentation'
import {PAGE_ROUTES} from '../lib/constants'

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    {route: PAGE_ROUTES.home, type: 'homePage'},
    {route: PAGE_ROUTES.work, type: 'workPage'},
    {route: '/work/:slug', filter: `_type == "project" && slug.current == $slug`},
    {route: PAGE_ROUTES.frames, type: 'framesPage'},
    {route: PAGE_ROUTES.about, type: 'aboutPage'},
    {route: PAGE_ROUTES.contact, type: 'contactPage'},
  ]),
  locations: {
    siteSettings: defineLocations({message: 'Header, footer, menu and intro — used on every page', tone: 'caution'}),
    homePage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Home', href: PAGE_ROUTES.home}]})}),
    workPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Work & Reels', href: PAGE_ROUTES.work}]})}),
    framesPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Frames', href: PAGE_ROUTES.frames}]})}),
    aboutPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'About', href: PAGE_ROUTES.about}]})}),
    contactPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Contact', href: PAGE_ROUTES.contact}]})}),
    project: defineLocations({
      select: {title: 'title', slug: 'slug.current', creditOnly: 'creditOnly'},
      resolve: (doc) => ({
        locations: [
          ...(doc?.creditOnly ? [] : [{title: doc?.title || 'Untitled', href: `/work/${doc?.slug}`}]),
          {title: 'Work & Reels', href: PAGE_ROUTES.work},
          {title: 'Home (selected reels)', href: PAGE_ROUTES.home},
          {title: 'About (credits)', href: PAGE_ROUTES.about},
        ],
      }),
    }),
    frame: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Frames', href: PAGE_ROUTES.frames}]})}),
  },
}
```

- [ ] **Step 6: Wire the config**

```ts
// studio/sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {resolve} from './presentation/resolve'
import {filterDocumentActions, filterNewDocumentOptions} from './lib/documentPolicies'
import {SINGLETON_TYPES} from './lib/constants'

const singletons = new Set<string>(SINGLETON_TYPES)
const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'

export default defineConfig({
  name: 'vazeer',
  title: 'Vazeer Art',
  projectId: 'iq6do512',
  dataset: 'production',
  plugins: [
    structureTool({structure}),
    presentationTool({
      previewUrl: {initial: previewUrl, previewMode: {enable: '/api/draft-mode/enable'}},
      resolve,
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((t) => !singletons.has(t.schemaType) && t.schemaType !== 'inquiry'),
  },
  document: {
    newDocumentOptions: filterNewDocumentOptions,
    actions: (prev, context) => filterDocumentActions(prev, context),
  },
})
```

- [ ] **Step 7: Run tests, typecheck, build**

Run: `cd studio && npx vitest run && npm run typecheck && npm run build`
Expected: PASS / 0 / `Done`.

- [ ] **Step 8: Smoke-run the Studio locally**

Run: `cd studio && npm run dev` then open `http://localhost:3333`, log in, and check: the sidebar shows Site settings, Home, Work & Reels, Frames page, About, Contact, Projects, Frames, Inquiries; the "+" create menu offers only Project and Frame; opening Site settings shows no Delete or Duplicate in the ⋯ menu. Stop the server.

- [ ] **Step 9: Commit**

```bash
cd ..
git add studio/structure.ts studio/lib studio/presentation studio/sanity.config.ts
git commit -m "feat(studio): pin singletons, orderable lists, presentation resolvers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Schema extract and typegen configuration

**Files:**
- Create: `studio/sanity-typegen.json`
- Create: `studio/schema.json` (generated, committed)
- Modify: `.gitignore` (root) — nothing to ignore; schema.json is committed on purpose

**Interfaces:**
- Produces: `studio/schema.json`; `npm run typegen` in `studio/` writes `web/lib/sanity/types.ts` (consumed by Plan 02 Task 4; until `web/` exists the command still extracts the schema and reports 0 queries).

- [ ] **Step 1: Write the typegen config**

```json
{
  "path": "../web/**/*.{ts,tsx}",
  "schema": "./schema.json",
  "generates": "../web/lib/sanity/types.ts",
  "overloadClientMethods": true
}
```

- [ ] **Step 2: Extract the schema**

Run: `cd studio && npm run schema:extract`
Expected: `Extracted schema to ./schema.json`. Open it: it must contain types named `siteSettings`, `homePage`, `workPage`, `framesPage`, `aboutPage`, `contactPage`, `project`, `frame`, `inquiry`, `imageWithAlt`, `mediaSlot`.

```bash
node -e 'const s=require("./schema.json");console.log(s.map(t=>t.name).sort().join(", "))'
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add studio/sanity-typegen.json studio/schema.json
git commit -m "feat(studio): extract schema and configure typegen for the web package

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Seed data, builders and seed script

**Files:**
- Create: `studio/scripts/lib/designData.ts`
- Create: `studio/scripts/lib/grabs.ts`
- Create: `studio/scripts/lib/buildDocuments.ts`
- Create: `studio/scripts/seed.ts`
- Test: `studio/scripts/lib/grabs.test.ts`, `studio/scripts/lib/buildDocuments.test.ts`

**Interfaces:**
- Consumes: `design-reference/images/images.json` (`{key, file, unsplashId, credit, handle, unsplashUrl}[]`), `design-reference/images/*.jpg`.
- Produces: `grabKeysFor(index)`, `GRAB_POOL`, `IMAGE_KEYS`, `buildDocuments(assetIdByKey)`, `lexoRank(index)`, `SLOT_IMAGE`.

- [ ] **Step 1: Write the failing tests**

```ts
// studio/scripts/lib/grabs.test.ts
import {describe, expect, it} from 'vitest'
import {GRAB_POOL, grabKeysFor, lexoRank} from './grabs'

describe('grabKeysFor', () => {
  it('matches the prototype: grabPool[(i*3+n) % 16]', () => {
    expect(GRAB_POOL).toHaveLength(16)
    expect(grabKeysFor(0)).toEqual(['C', 'E', 'F', 'G'])
    expect(grabKeysFor(1)).toEqual(['G', 'H', 'I', 'J'])
    expect(grabKeysFor(2)).toEqual(['J', 'K', 'N', 'O'])
    expect(grabKeysFor(3)).toEqual(['O', 'Q', 'R', 'T'])
    expect(grabKeysFor(4)).toEqual(['T', 'V', 'W', 'L'])
  })
})

describe('lexoRank', () => {
  it('produces valid, lexicographically ordered LexoRank strings', () => {
    const ranks = [0, 1, 2, 10, 34].map(lexoRank)
    expect(ranks[0]).toBe('0|100000:')
    expect(ranks[1]).toBe('0|200000:')
    expect(ranks[3]).toBe('0|b00000:')
    for (let i = 1; i < ranks.length; i++) expect(ranks[i] > ranks[i - 1]).toBe(true)
  })
})
```

```ts
// studio/scripts/lib/buildDocuments.test.ts
import {describe, expect, it} from 'vitest'
import {buildDocuments, IMAGE_KEYS} from './buildDocuments'

const assetIdByKey = Object.fromEntries(IMAGE_KEYS.map((k) => [k, `image-${k}-1400x900-jpg`])) as Record<string, string>

describe('buildDocuments', () => {
  const docs = buildDocuments(assetIdByKey)
  const byId = (id: string) => docs.find((d) => d._id === id) as any

  it('creates six singletons with _id === _type, five projects and twelve frames', () => {
    for (const id of ['siteSettings', 'homePage', 'workPage', 'framesPage', 'aboutPage', 'contactPage']) {
      expect(byId(id)?._type).toBe(id)
    }
    expect(docs.filter((d) => d._type === 'project')).toHaveLength(5)
    expect(docs.filter((d) => d._type === 'frame')).toHaveLength(12)
  })

  it('is deterministic', () => {
    expect(buildDocuments(assetIdByKey)).toEqual(docs)
  })

  it('maps prototype image slots to the right asset', () => {
    expect(byId('homePage').hero.mainImage.asset._ref).toBe(assetIdByKey.A)
    expect(byId('project-pagal').cover.asset._ref).toBe(assetIdByKey.A)
    expect(byId('project-dehleez').cover.asset._ref).toBe(assetIdByKey.M)
    expect(byId('project-pagal').frameGrabs.map((g: any) => g.asset._ref)).toEqual(['C', 'E', 'F', 'G'].map((k) => assetIdByKey[k]))
    expect(byId('siteSettings').menuPhoto.asset._ref).toBe(assetIdByKey.C)
  })

  it('orders projects and frames with increasing orderRank', () => {
    const ranks = docs.filter((d) => d._type === 'project').map((d: any) => d.orderRank)
    expect([...ranks].sort()).toEqual(ranks)
    const frames = docs.filter((d) => d._type === 'frame') as any[]
    expect(frames.map((f) => f.ratio)).toEqual(['4/5', '9/16', '4/5', '1/1', '4/5', '9/16', '4/5', '4/5', '1/1', '9/16', '4/5', '4/5'])
  })

  it('copies prototype copy verbatim, including curly quotes', () => {
    expect(byId('homePage').intro.subline).toBe('(Shakir Ali, if we’re being formal)')
    expect(byId('siteSettings').marqueeWords).toEqual(['Films', 'Commercials', 'Music Videos', 'Colour', 'The Edit'])
    expect(byId('siteSettings').pages.map((p: any) => p.key)).toEqual(['home', 'about', 'work', 'frames', 'contact'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd studio && npx vitest run scripts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write grabs.ts**

```ts
// studio/scripts/lib/grabs.ts
export const GRAB_POOL = ['C', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'N', 'O', 'Q', 'R', 'T', 'V', 'W', 'L'] as const

/** Prototype: g(n) = grabPool[(i*3 + n) % grabPool.length] for n in 0..3 */
export function grabKeysFor(projectIndex: number): string[] {
  return [0, 1, 2, 3].map((n) => GRAB_POOL[(projectIndex * 3 + n) % GRAB_POOL.length])
}

/** Valid LexoRank ("bucket|rank:") the orderable-document-list plugin can re-rank around. */
export function lexoRank(index: number): string {
  if (index < 0 || index > 34) throw new Error('lexoRank supports 0..34')
  return `0|${(index + 1).toString(36)}00000:`
}
```

- [ ] **Step 4: Write designData.ts (prototype content, verbatim)**

```ts
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
```

- [ ] **Step 5: Write buildDocuments.ts**

```ts
// studio/scripts/lib/buildDocuments.ts
import {COPY, EXPLORE_CARDS, FORM_TYPES, FRAME_KEYS, FRAME_RATIOS_SEED, MARQUEE_WORDS, PAGES, PROJECTS, SKILLS, SLOT_ALT, SLOT_IMAGE, SOCIALS} from './designData'
import {grabKeysFor, lexoRank} from './grabs'

export const IMAGE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'V', 'W'] as const
export type ImageKey = (typeof IMAGE_KEYS)[number]

type AssetIdByKey = Record<string, string>
type SanityDoc = {_id: string; _type: string; [key: string]: unknown}

function img(assetIds: AssetIdByKey, key: string, alt: string, keySuffix: string) {
  const ref = assetIds[key]
  if (!ref) throw new Error(`No asset uploaded for key ${key}`)
  return {_type: 'imageWithAlt', _key: keySuffix, asset: {_type: 'reference', _ref: ref}, alt}
}

function media(assetIds: AssetIdByKey, key: string, alt: string, keySuffix: string) {
  return {_type: 'mediaSlot', kind: 'image', image: img(assetIds, key, alt, `${keySuffix}-img`)}
}

export function buildDocuments(assetIds: AssetIdByKey): SanityDoc[] {
  const slot = (name: keyof typeof SLOT_IMAGE) => img(assetIds, SLOT_IMAGE[name], SLOT_ALT[name], name)
  const mediaSlot = (name: keyof typeof SLOT_IMAGE) => media(assetIds, SLOT_IMAGE[name], SLOT_ALT[name], name)

  const siteSettings: SanityDoc = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandWord: 'Vazeer',
    brandScript: 'art.',
    copyright: COPY.copyright,
    socials: SOCIALS.map((s, i) => ({_type: 'link', _key: `social-${i}`, ...s})),
    management: {...COPY.management},
    dm: {...COPY.dm},
    marqueeWords: [...MARQUEE_WORDS],
    pages: PAGES.map((p) => ({_type: 'pageEntry', _key: `page-${p.key}`, ...p})),
    leaderLeft: COPY.leader.left,
    leaderRight: COPY.leader.right,
    leaderSkip: COPY.leader.skip,
    menuScript: COPY.menu.script,
    menuClose: COPY.menu.close,
    menuSocialsLabel: COPY.menu.socials,
    menuPhoto: slot('menuPhoto'),
    showIntro: true,
    showMarquee: true,
    showGrain: true,
    showRec: true,
    seo: {_type: 'seo', title: 'Vazeer Art — DOP & editor, New Delhi', description: 'Cinematographer and editor for films, commercials and music videos.'},
  }

  const homePage: SanityDoc = {
    _id: 'homePage',
    _type: 'homePage',
    hero: {
      word: COPY.home.hero.word,
      script: COPY.home.hero.script,
      mainImage: slot('heroMain'),
      polaroidLeft: mediaSlot('heroPolaroidLeft'),
      polaroidRight: mediaSlot('heroPolaroidRight'),
    },
    intro: {...COPY.home.intro, imageA: slot('introA'), imageB: slot('introB')},
    reels: {headingBlock: {_type: 'headingBlock', script: COPY.home.reels.script, heading: COPY.home.reels.heading}, ctaLabel: COPY.home.reels.ctaLabel},
    explore: {
      headingBlock: {_type: 'headingBlock', ...COPY.home.explore},
      cards: EXPLORE_CARDS.map((c, i) => ({
        _type: 'exploreCard',
        _key: `explore-${i}`,
        label: c.label,
        sub: c.sub,
        target: c.target,
        image: img(assetIds, c.image, c.alt, `explore-${i}`),
      })),
    },
    currently: {...COPY.home.currently, bgImage: slot('currentlyBg')},
  }

  const workPage: SanityDoc = {
    _id: 'workPage',
    _type: 'workPage',
    title: COPY.work.title,
    script: COPY.work.script,
    intro: COPY.work.intro,
    filterAll: COPY.work.filters.all,
    filterDop: COPY.work.filters.dop,
    filterEditor: COPY.work.filters.editor,
    showreel: {poster: slot('showreelPoster'), label: COPY.work.showreel.label, orderNotePrefix: COPY.work.showreel.orderNotePrefix},
    numberPrefix: COPY.work.numberPrefix,
    projectCta: COPY.work.projectCta,
    skills: {
      headingBlock: {_type: 'headingBlock', ...COPY.work.skills},
      items: SKILLS.map((s, i) => ({_type: 'skill', _key: `skill-${i}`, label: s.label, tilt: s.tilt, media: media(assetIds, s.image, `GIF: ${s.label}`, `skill-${i}`)})),
    },
    projectPage: {...COPY.work.projectPage},
  }

  const framesPage: SanityDoc = {_id: 'framesPage', _type: 'framesPage', ...COPY.frames}

  const aboutPage: SanityDoc = {
    _id: 'aboutPage',
    _type: 'aboutPage',
    hero: {...COPY.about.hero, portrait: slot('aboutPortrait'), polaroid: mediaSlot('aboutPolaroid')},
    statement: {...COPY.about.statement, paragraphs: [...COPY.about.statement.paragraphs]},
    credits: {
      headingBlock: {_type: 'headingBlock', script: COPY.about.credits.script, heading: COPY.about.credits.heading},
      imdbLabel: COPY.about.credits.imdbLabel,
      imdbUrl: COPY.about.credits.imdbUrl,
    },
    finale: {...COPY.about.finale, bgImage: slot('aboutFinaleBg')},
  }

  const contactPage: SanityDoc = {
    _id: 'contactPage',
    _type: 'contactPage',
    script: COPY.contact.script,
    heading: COPY.contact.heading,
    intro: COPY.contact.intro,
    photo: slot('contactPhoto'),
    form: {...COPY.contact.form, types: [...FORM_TYPES]},
    success: {...COPY.contact.success},
  }

  const projects: SanityDoc[] = PROJECTS.map((p, i) => ({
    _id: `project-${p.slug}`,
    _type: 'project',
    orderRank: lexoRank(i),
    title: p.title,
    slug: {_type: 'slug', current: p.slug},
    format: p.format,
    year: p.year,
    role: p.role,
    category: p.category,
    cover: img(assetIds, p.cover, `Frame from ${p.title}`, `cover-${p.slug}`),
    frameGrabs: grabKeysFor(i).map((k, n) => img(assetIds, k, `Frame grab 0${n + 1} from ${p.title}`, `${p.slug}-grab-${n}`)),
    showOnHome: true,
    creditOnly: false,
  }))

  const frames: SanityDoc[] = FRAME_KEYS.map((k, i) => ({
    _id: `frame-${String(i + 1).padStart(2, '0')}`,
    _type: 'frame',
    orderRank: lexoRank(i),
    image: img(assetIds, k, FRAME_RATIOS_SEED[i] === '9/16' ? 'Reel cover' : 'Instagram post', `frame-${i}`),
    ratio: FRAME_RATIOS_SEED[i],
  }))

  return [siteSettings, homePage, workPage, framesPage, aboutPage, contactPage, ...projects, ...frames]
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd studio && npx vitest run scripts`
Expected: PASS (all cases).

- [ ] **Step 7: Write the seed script**

```ts
// studio/scripts/seed.ts
// Run: cd studio && npm run seed   (requires `npx sanity login` first)
import {createReadStream, readFileSync} from 'node:fs'
import {basename, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'
import {buildDocuments, IMAGE_KEYS} from './lib/buildDocuments'

type Manifest = {key: string; file: string; credit: string; handle: string}[]

const client = getCliClient({apiVersion: '2026-09-29'})
const imagesDir = resolve(process.cwd(), '../design-reference/images')
const manifest = JSON.parse(readFileSync(resolve(imagesDir, 'images.json'), 'utf8')) as Manifest

async function uploadPlaceholders(): Promise<Record<string, string>> {
  const existing = await client.fetch<{_id: string; originalFilename: string}[]>(
    `*[_type == "sanity.imageAsset" && originalFilename in $names]{_id, originalFilename}`,
    {names: manifest.map((m) => m.file)},
  )
  const byFilename = new Map(existing.map((a) => [a.originalFilename, a._id]))
  const ids: Record<string, string> = {}

  for (const entry of manifest) {
    if (!IMAGE_KEYS.includes(entry.key as (typeof IMAGE_KEYS)[number])) continue
    const found = byFilename.get(entry.file)
    if (found) {
      ids[entry.key] = found
      console.log(`↺ reuse ${entry.file}`)
      continue
    }
    const asset = await client.assets.upload('image', createReadStream(resolve(imagesDir, entry.file)), {
      filename: basename(entry.file),
      source: {name: 'unsplash', id: entry.file, url: `https://unsplash.com/@${entry.handle}`},
      creditLine: entry.credit,
    })
    ids[entry.key] = asset._id
    console.log(`↑ uploaded ${entry.file} → ${asset._id}`)
  }
  return ids
}

async function main() {
  console.log(`Seeding ${client.config().projectId}/${client.config().dataset}`)
  const assetIds = await uploadPlaceholders()
  const docs = buildDocuments(assetIds)
  const tx = client.transaction()
  for (const doc of docs) tx.createOrReplace(doc)
  const result = await tx.commit()
  console.log(`✓ wrote ${result.results.length} documents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 8: Run the seed against the real dataset**

Run: `cd studio && npm run seed`
Expected: 22 `↑ uploaded` lines (or `↺ reuse` on a second run) then `✓ wrote 23 documents`. Verify:

```bash
npx sanity documents query '*[_type in ["project","frame"]] | order(orderRank){_type, "t": coalesce(title, ratio)}' --project iq6do512 --dataset production
```

Expected: 5 projects in prototype order, then 12 frames. Run `npm run seed` a second time: only `↺ reuse` lines and the same document count, no duplicates.

- [ ] **Step 9: Commit**

```bash
cd ..
git add studio/scripts
git commit -m "feat(studio): seed prototype content and placeholder images idempotently

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Deploy the Studio, CORS and tokens (human-assisted)

**Files:**
- Modify: `README.md` (add the deploy + token instructions)

**Interfaces:**
- Produces: live Studio at `https://vazeerart.sanity.studio`; two API tokens saved by the human into `web/.env.local` (Plan 02 Task 1 reads them); CORS origin for `http://localhost:3000`.

- [ ] **Step 1: Deploy the Studio**

Run: `cd studio && npm run deploy`
Expected: `Success! Studio deployed to https://vazeerart.sanity.studio`. If the hostname is taken, choose `vazeer-art` and update `studioHost` in `sanity.cli.ts` and the spec §9 table.

- [ ] **Step 2: Add the local CORS origin (with credentials, needed by the Live API in the browser)**

```bash
npx sanity cors add http://localhost:3000 --credentials --project iq6do512
npx sanity cors list --project iq6do512
```

Expected: the list shows `http://localhost:3000` with `allowCredentials: true`. The production domain is added in Plan 06.

- [ ] **Step 3: Create the two tokens (human, in the browser)**

Ask the human to open `https://www.sanity.io/manage/project/iq6do512/api#tokens` and create:
- `web-read` with role **Viewer** → will become `SANITY_API_READ_TOKEN`
- `web-inquiries` with role **Editor** → will become `SANITY_API_WRITE_TOKEN`

They paste both into `web/.env.local` once Plan 02 Task 1 creates that file. Tokens are never pasted into chat or committed.

- [ ] **Step 4: Document it in README.md**

Append to `README.md`:

```markdown
## Admin (Sanity Studio)

- Live: https://vazeerart.sanity.studio
- Deploy: `cd studio && npm run deploy`
- Re-seed placeholder content: `cd studio && npm run seed` (safe to re-run)
- Tokens: https://www.sanity.io/manage/project/iq6do512/api#tokens — `web-read` (Viewer) and `web-inquiries` (Editor) live only in `web/.env.local` and Vercel env vars.
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: studio deploy, seed and token instructions

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
