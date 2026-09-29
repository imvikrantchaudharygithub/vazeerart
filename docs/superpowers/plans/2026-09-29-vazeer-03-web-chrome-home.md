# Vazeer Art — Plan 03: Site Chrome and Home Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assemble the root layout (header, full-screen menu, pre-footer, footer, grain, leader, motion loops, live content, draft mode) and build the Home screen pixel-for-pixel from the prototype.

**Architecture:** Chrome lives in `components/chrome/`; each Home section is a server component in `components/sections/<Name>/` with a CSS Module whose classes are verbatim copies of the prototype's inline styles. Interactivity is limited to two client islands: `SiteChrome` (menu open state, active nav) and `PreFooter` (needs the pathname). `app/page.tsx` fetches view models and composes sections. `npm run verify:styles` proves coverage of every prototype element the task ports.

**Tech Stack:** Next.js 16 App Router, React 19 server components, CSS Modules, next-sanity live + visual editing, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-09-29-vazeer-portfolio-design.md` (§3.2 Home, §3.3, §5.1, §5.2, §5.4, §5.6)

**Depends on:** Plan 02 (styles, data layer, motion components).

## Global Constraints

- One CSS Module class per prototype element, values verbatim (fonts → `var(--font-*)`). Confirm with `node tools/verify-styles.mjs --lines A-B` for the section's line range in `design-reference/markup.html` (find ranges with `grep -n '<section\|<header\|<footer\|<main\|data-screen-label' ../design-reference/markup.html`).
- Every element the prototype rendered as a `<button sc-camel-on-click>` that navigates becomes a `next/link` `<Link>` with class `asButton`, plus `hoverAmber` / `hoverRust` / `hoverLift` / `hoverBgRust` when the prototype had the matching `style-hover`.
- Every `data-reveal="1"`, `data-depth`, `data-scroll`, `data-tc` attribute in the prototype is preserved on the same element.
- Hero entrance elements carry `data-hero-anim`; infinite loops that are not hero entrances (Ken Burns wrappers, marquee track, grain, pulse) carry `data-motion="loop"`.
- Image `sizes` follow the element's rendered width in the prototype (see each task).
- Commit after every task; end commit bodies with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Menu open, then navigate with a menu link** → menu closes and the new page starts at the top. Task 1 tests that the overlay closes on pathname change.
2. **Site settings with `showMarquee=false` or an empty `marqueeWords`** → no band, no empty track. Task 2 tests both.
3. **Home rail when a project is `showOnHome=false` or `creditOnly=true`** → not shown. Task 3 tests the filtering through `homeProjects`.
4. **Escape key while the menu is open** → closes. Task 1 tests it.
5. **Hero when a polaroid media slot is empty** → the tilted frame still renders (background `#1c1916`) with nothing inside, no crash. Task 2 tests `MediaSlot` null inside the hero.

---

### Task 1: Chrome components, draft-mode routes, and root layout

**Files:**
- Create: `web/components/chrome/SiteChrome.tsx`, `web/components/chrome/Header.module.css`, `web/components/chrome/MenuOverlay.module.css`
- Create: `web/components/chrome/PreFooter.tsx`, `web/components/chrome/PreFooter.module.css`
- Create: `web/components/chrome/Footer.tsx`, `web/components/chrome/Footer.module.css`
- Create: `web/components/chrome/Grain.tsx`, `web/components/chrome/Grain.module.css`
- Create: `web/components/chrome/DisableDraftMode.tsx`, `web/components/chrome/DisableDraftMode.module.css`
- Create: `web/app/api/draft-mode/enable/route.ts`, `web/app/api/draft-mode/disable/route.ts`
- Modify: `web/app/layout.tsx`
- Test: `web/components/chrome/SiteChrome.test.tsx`, `web/components/chrome/PreFooter.test.tsx`

**Interfaces:**
- Consumes: `SiteSettingsVM`, `PageEntryVM`, `navEntries`, `preFooterEntries`, `SanityImage`, `Leader`, `LeaderBootScript`, `ParallaxLoop`, `RevealObserver`, `Timecode`, `SanityLive`, `getSiteSettings`.
- Produces: `<SiteChrome settings />`, `<PreFooter pages />`, `<Footer settings />`, `<Grain />`, `<DisableDraftMode />`; routes `GET /api/draft-mode/enable`, `GET /api/draft-mode/disable`.

- [ ] **Step 1: Write the failing tests**

```tsx
// web/components/chrome/SiteChrome.test.tsx
import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import {SiteChrome} from './SiteChrome'

let pathname = '/'
vi.mock('next/navigation', () => ({usePathname: () => pathname}))

const settings: SiteSettingsVM = {
  brandWord: 'Vazeer', brandScript: 'art.', copyright: '©', socials: [{label: 'Instagram', url: 'https://instagram.com/x'}],
  management: {label: 'management', handle: '@m', url: '#'}, dm: {label: 'dm me', handle: '@d', url: '#'},
  marqueeWords: [], leaderLeft: '', leaderRight: '', leaderSkip: '', menuScript: 'menu', menuClose: 'Close ✕', menuSocialsLabel: 'follow on socials /',
  menuPhoto: null, showIntro: true, showMarquee: true, showGrain: true, showRec: true, seo: {title: null, description: null, image: null},
  pages: [
    {key: 'home', href: '/', navLabel: 'Home', menuLabel: 'Home', preFooterScript: '', preFooterLabel: ''},
    {key: 'about', href: '/about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
    {key: 'work', href: '/work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
    {key: 'frames', href: '/frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
    {key: 'contact', href: '/contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
  ],
}

describe('SiteChrome', () => {
  beforeEach(() => { pathname = '/work/pagal' })

  it('renders the four nav links and marks Work active on a project page', () => {
    render(<SiteChrome settings={settings} />)
    const links = screen.getAllByRole('link').filter((a) => a.closest('nav'))
    expect(links.map((a) => a.textContent)).toEqual(['About', 'Work & Reels', 'Frames', 'Contact'])
    expect(links[1].getAttribute('data-active')).toBe('true')
    expect(links[0].getAttribute('data-active')).toBe('false')
  })

  it('opens the menu with all five pages numbered, closes on Close and on Escape', () => {
    render(<SiteChrome settings={settings} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('01')
    expect(dialog).toHaveTextContent('05')
    expect(dialog).toHaveTextContent('Work & Reels')
    fireEvent.click(screen.getByRole('button', {name: 'Close ✕'}))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))
    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes the menu when the pathname changes', () => {
    const {rerender} = render(<SiteChrome settings={settings} />)
    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    pathname = '/about'
    rerender(<SiteChrome settings={settings} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
```

```tsx
// web/components/chrome/PreFooter.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {PreFooter} from './PreFooter'

vi.mock('next/navigation', () => ({usePathname: () => '/about'}))

const pages = [
  {key: 'home', href: '/', navLabel: 'Home', menuLabel: 'Home', preFooterScript: '', preFooterLabel: ''},
  {key: 'about', href: '/about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
  {key: 'work', href: '/work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
  {key: 'frames', href: '/frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
  {key: 'contact', href: '/contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
] as const

describe('PreFooter', () => {
  it('shows the three other pages with script and label, each a reveal element', () => {
    render(<PreFooter pages={[...pages]} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work', '/frames', '/contact'])
    expect(links[0]).toHaveTextContent('watch the')
    expect(links[0]).toHaveTextContent('Reels')
    expect(links.every((l) => l.getAttribute('data-reveal') === '1')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run components/chrome/SiteChrome components/chrome/PreFooter`
Expected: FAIL — modules not found.

- [ ] **Step 3: Header and menu styles (markup.html `<header>` … `</header>` and the menu `<sc-if value="{{ menuOpen }}">` block)**

```css
/* web/components/chrome/Header.module.css */
.header{position:sticky;top:0;z-index:60;background:rgba(15,13,11,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid rgba(239,231,218,.12)}
.inner{max-width:1480px;margin:0 auto;padding:0 clamp(16px,4vw,48px);height:72px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.brand{all:unset;cursor:pointer;display:flex;align-items:baseline;gap:2px;line-height:1}
.brandWord{font-family:var(--font-anton),sans-serif;font-size:28px;letter-spacing:.02em;text-transform:uppercase}
.brandScript{font-family:var(--font-delafield),cursive;font-size:44px;color:#e8a24a;margin-left:4px;line-height:.5}
.nav{display:flex;align-items:center;gap:clamp(16px,2.6vw,40px)}
.links{display:flex;gap:clamp(16px,2.6vw,40px);flex-wrap:wrap;justify-content:flex-end}
.link{all:unset;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#efe7da}
.link[data-active="true"]{color:#e8a24a}
.burger{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:6px;padding:10px 0 10px 8px}
.bar1{display:block;width:28px;height:2px;background:#efe7da}
.bar2{display:block;width:20px;height:2px;background:#e8a24a;margin-left:8px}
```

```css
/* web/components/chrome/MenuOverlay.module.css */
.overlay{position:fixed;inset:0;z-index:90;background:#efe7da;color:#14110e;display:flex;flex-direction:column;padding:24px clamp(16px,4vw,48px) 40px;overflow:auto}
.top{display:flex;justify-content:space-between;align-items:center;height:48px}
.script{font-family:var(--font-delafield),cursive;font-size:48px;color:#a4501a;line-height:1}
.close{all:unset;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:1px solid #14110e;padding-bottom:4px}
.grid{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:40px;align-items:center;margin-top:24px}
.list{display:flex;flex-direction:column}
.item{all:unset;cursor:pointer;display:flex;align-items:baseline;gap:18px;border-bottom:1px solid rgba(20,17,14,.15);padding:6px 0}
.itemNum{font-family:var(--font-bodoni),serif;font-style:italic;font-size:18px;color:#5e564c;width:32px}
.itemLabel{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(48px,7vw,104px);line-height:1.02}
.aside{display:flex;flex-direction:column;gap:24px;max-width:420px}
.photo{position:relative;aspect-ratio:4/5;width:min(100%,320px);border:8px solid #fff;box-shadow:0 20px 50px rgba(0,0,0,.18);transform:rotate(3deg)}
.socialsLabel{font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px}
.socials{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}
```

- [ ] **Step 4: SiteChrome**

```tsx
// web/components/chrome/SiteChrome.tsx
'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {SanityImage} from '@/components/media/SanityImage'
import {navEntries} from '@/lib/viewmodel/pages'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import header from './Header.module.css'
import menu from './MenuOverlay.module.css'

export function SiteChrome({settings}: {settings: SiteSettingsVM}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const nav = navEntries(settings.pages, pathname)

  return (
    <>
      <header className={header.header}>
        <div className={header.inner}>
          <Link href="/" className={`${header.brand} asButton`} aria-label={`${settings.brandWord} ${settings.brandScript} — home`}>
            <span className={header.brandWord}>{settings.brandWord}</span>
            <span className={header.brandScript}>{settings.brandScript}</span>
          </Link>
          <nav className={header.nav}>
            <div className={header.links}>
              {nav.map((n) => (
                <Link key={n.key} href={n.href} className={`${header.link} hoverAmber`} data-active={n.active ? 'true' : 'false'}>
                  {n.navLabel}
                </Link>
              ))}
            </div>
            <button type="button" className={header.burger} aria-label="Open menu" onClick={() => setOpen(true)}>
              <span className={header.bar1} />
              <span className={header.bar2} />
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div className={menu.overlay} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={menu.top}>
            <span className={menu.script}>{settings.menuScript}</span>
            <button type="button" className={menu.close} onClick={() => setOpen(false)}>{settings.menuClose}</button>
          </div>
          <div className={menu.grid}>
            <div className={menu.list}>
              {settings.pages.map((p, i) => (
                <Link key={p.key} href={p.href} className={`${menu.item} hoverRust asButton`} onClick={() => setOpen(false)}>
                  <span className={menu.itemNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={menu.itemLabel}>{p.menuLabel}</span>
                </Link>
              ))}
            </div>
            <div className={menu.aside}>
              <div className={menu.photo}>
                {settings.menuPhoto && <SanityImage image={settings.menuPhoto} sizes="320px" />}
              </div>
              <span className={menu.socialsLabel}>{settings.menuSocialsLabel}</span>
              <div className={menu.socials}>
                {settings.socials.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 5: PreFooter, Footer, Grain, DisableDraftMode**

```css
/* web/components/chrome/PreFooter.module.css — markup.html pre-footer <section> before <footer> */
.section{background:#efe7da;color:#14110e;margin-top:clamp(64px,8vw,120px)}
.inner{max-width:1480px;margin:0 auto;padding:clamp(48px,6vw,80px) clamp(16px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:32px}
.card{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px}
.script{font-family:var(--font-delafield),cursive;font-size:56px;line-height:.7;color:#a4501a}
.label{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(40px,4.4vw,64px);line-height:1}
```

```tsx
// web/components/chrome/PreFooter.tsx
'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {preFooterEntries} from '@/lib/viewmodel/pages'
import type {PageEntryVM} from '@/lib/viewmodel/site'
import styles from './PreFooter.module.css'

export function PreFooter({pages}: {pages: PageEntryVM[]}) {
  const pathname = usePathname()
  const entries = preFooterEntries(pages, pathname)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {entries.map((e) => (
          <Link key={e.key} href={e.href} data-reveal="1" className={`${styles.card} hoverRust asButton`}>
            <span className={styles.script}>{e.preFooterScript}</span>
            <span className={styles.label}>{e.preFooterLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

```css
/* web/components/chrome/Footer.module.css — markup.html <footer> */
.footer{background:#0f0d0b}
.inner{max-width:1480px;margin:0 auto;padding:56px clamp(16px,4vw,48px) 28px;display:flex;flex-direction:column;gap:40px}
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;flex-wrap:wrap}
.brand{all:unset;cursor:pointer;display:flex;align-items:baseline;line-height:.85}
.brandWord{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(64px,10vw,150px)}
.brandScript{font-family:var(--font-delafield),cursive;font-size:clamp(80px,12vw,180px);color:#e8a24a;margin-left:8px;line-height:.4}
.nav{display:flex;gap:10px 28px;flex-wrap:wrap;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}
.navItem{all:unset;cursor:pointer}
.bottom{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-top:1px solid rgba(239,231,218,.14);padding-top:22px;font-size:13px;color:#b9b0a2}
.socials{display:flex;gap:22px;flex-wrap:wrap}
```

```tsx
// web/components/chrome/Footer.tsx
import Link from 'next/link'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import styles from './Footer.module.css'

export function Footer({settings}: {settings: SiteSettingsVM}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Link href="/" className={`${styles.brand} asButton`} aria-label={`${settings.brandWord} ${settings.brandScript} — home`}>
            <span className={styles.brandWord}>{settings.brandWord}</span>
            <span className={styles.brandScript}>{settings.brandScript}</span>
          </Link>
          <div className={styles.nav}>
            {settings.pages.map((p) => (
              <Link key={p.key} href={p.href} className={`${styles.navItem} hoverAmber asButton`}>{p.menuLabel}</Link>
            ))}
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.socials}>
            {settings.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </div>
          <span>{settings.copyright}</span>
        </div>
      </div>
    </footer>
  )
}
```

```css
/* web/components/chrome/Grain.module.css — markup.html grain <sc-if value="{{ grain }}"> */
.grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:.07;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");animation:grainshift .5s steps(4) infinite}
```

```tsx
// web/components/chrome/Grain.tsx
import styles from './Grain.module.css'

export function Grain() {
  return <div className={styles.grain} data-motion="loop" aria-hidden="true" />
}
```

```css
/* web/components/chrome/DisableDraftMode.module.css */
.pill{position:fixed;bottom:16px;left:16px;z-index:300;background:#e8a24a;color:#0f0d0b;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;padding:10px 14px}
```

```tsx
// web/components/chrome/DisableDraftMode.tsx
'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'
import styles from './DisableDraftMode.module.css'

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()
  if (isPresentationTool) return null
  return <a href="/api/draft-mode/disable" className={styles.pill}>Disable draft mode</a>
}
```

- [ ] **Step 6: Draft-mode routes**

```ts
// web/app/api/draft-mode/enable/route.ts
import {defineEnableDraftMode} from 'next-sanity/draft-mode'
import {client} from '@/lib/sanity/client'

export const {GET} = defineEnableDraftMode({
  client: client.withConfig({token: process.env.SANITY_API_READ_TOKEN}),
})
```

```ts
// web/app/api/draft-mode/disable/route.ts
import {draftMode} from 'next/headers'
import {NextResponse, type NextRequest} from 'next/server'

export async function GET(request: NextRequest) {
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL('/', request.url))
}
```

- [ ] **Step 7: Root layout**

```tsx
// web/app/layout.tsx
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import type {ReactNode} from 'react'
import {DisableDraftMode} from '@/components/chrome/DisableDraftMode'
import {Footer} from '@/components/chrome/Footer'
import {Grain} from '@/components/chrome/Grain'
import {Leader} from '@/components/chrome/Leader'
import {LeaderBootScript} from '@/components/chrome/LeaderBootScript'
import {PreFooter} from '@/components/chrome/PreFooter'
import {SiteChrome} from '@/components/chrome/SiteChrome'
import {ParallaxLoop} from '@/components/motion/ParallaxLoop'
import {RevealObserver} from '@/components/motion/RevealObserver'
import {Timecode} from '@/components/motion/Timecode'
import {getSiteSettings} from '@/lib/data'
import {fontVariables} from '@/lib/fonts'
import {SanityLive} from '@/lib/sanity/live'
import '@/styles/globals.css'

export default async function RootLayout({children}: {children: ReactNode}) {
  const settings = await getSiteSettings()
  const {isEnabled: draft} = await draftMode()

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <LeaderBootScript enabled={settings.showIntro} />
      </head>
      <body>
        <div className="site">
          {settings.showIntro && <Leader left={settings.leaderLeft} right={settings.leaderRight} skip={settings.leaderSkip} />}
          <SiteChrome settings={settings} />
          {children}
          <PreFooter pages={settings.pages} />
          <Footer settings={settings} />
          {settings.showGrain && <Grain />}
        </div>
        <ParallaxLoop />
        <RevealObserver />
        <Timecode />
        <SanityLive />
        {draft && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  )
}
```

`suppressHydrationWarning` is required because the boot script sets `data-leader` on `<html>` before React hydrates.

- [ ] **Step 8: Run tests, typecheck, style coverage for the chrome ranges, build**

```bash
cd web && npx vitest run && npm run typecheck
H=$(grep -n '^<header' ../design-reference/markup.html | cut -d: -f1); ME=$(grep -n 'value="{{ isHome }}"' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $H-$((ME-1))
PF=$(grep -n 'list="{{ preFooter }}"' ../design-reference/markup.html | cut -d: -f1); END=$(wc -l < ../design-reference/markup.html)
node tools/verify-styles.mjs --lines $((PF-3))-$END
npm run build
```

Expected: tests PASS; typecheck 0; both verifier runs print `✓ … covered`; build lists `/`, `/api/draft-mode/enable`, `/api/draft-mode/disable`. Then `npm run dev`, open `http://localhost:3000`: header, menu overlay (open/close), pre-footer, footer and grain render with seeded content; the leader counts down once and does not repeat on reload within the same tab.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/components/chrome web/app
git commit -m "feat(web): site chrome, draft-mode routes and root layout

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Home — Hero and Marquee

**Files:**
- Create: `web/components/sections/Hero/Hero.tsx`, `web/components/sections/Hero/Hero.module.css`
- Create: `web/components/sections/Marquee/Marquee.tsx`, `web/components/sections/Marquee/Marquee.module.css`
- Test: `web/components/sections/Hero/Hero.test.tsx`, `web/components/sections/Marquee/Marquee.test.tsx`

**Interfaces:**
- Consumes: `HomeVM['hero']`, `SanityImage`, `MediaSlot`.
- Produces: `<Hero hero />`, `<Marquee words />` (renders nothing when `words` is empty).

- [ ] **Step 1: Write the failing tests**

```tsx
// web/components/sections/Hero/Hero.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Hero} from './Hero'

const hero = {word: 'Vazeer', script: 'art', mainImage: null, polaroidLeft: null, polaroidRight: null}

describe('Hero', () => {
  it('renders the five parallax layers with the prototype depth and scroll factors', () => {
    const {container} = render(<Hero hero={hero} />)
    const layers = [...container.querySelectorAll('[data-depth]')].map((el) => [el.getAttribute('data-depth'), el.getAttribute('data-scroll')])
    expect(layers).toEqual([['0.2', '0.1'], ['0.4', '0.35'], ['1', '-0.12'], ['0.4', '0.35'], ['2', '-0.45'], ['1.6', '-0.25']])
  })
  it('marks every entrance animation with data-hero-anim and shows the word twice plus the script', () => {
    const {container} = render(<Hero hero={hero} />)
    expect(container.querySelectorAll('[data-hero-anim]').length).toBeGreaterThanOrEqual(7)
    expect(screen.getAllByText('Vazeer', {exact: false})).toHaveLength(2)
    expect(screen.getByText('art')).toBeInTheDocument()
  })
  it('renders the polaroid frames even when their media is empty', () => {
    const {container} = render(<Hero hero={hero} />)
    expect(container.querySelector('[data-depth="2"] > div')).not.toBeNull()
    expect(container.querySelector('[data-depth="1.6"] > div')).not.toBeNull()
  })
})
```

```tsx
// web/components/sections/Marquee/Marquee.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Marquee} from './Marquee'

describe('Marquee', () => {
  it('repeats the word list twice for a seamless loop', () => {
    render(<Marquee words={['Films', 'Colour']} />)
    expect(screen.getAllByText('Films', {exact: false})).toHaveLength(2)
    expect(screen.getAllByText('&')).toHaveLength(4)
  })
  it('renders nothing for an empty list', () => {
    const {container} = render(<Marquee words={[]} />)
    expect(container.innerHTML).toBe('')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run components/sections`
Expected: FAIL — modules not found.

- [ ] **Step 3: Hero styles (markup.html first `<section>` inside `<main data-screen-label="01 Home">`)**

```css
/* web/components/sections/Hero/Hero.module.css */
.section{position:relative;height:max(680px,calc(100vh - 72px));overflow:hidden;background:#0f0d0b}
.layerGlow{position:absolute;inset:0;pointer-events:none;z-index:0}
.glow{position:absolute;left:50%;top:50%;width:min(90vw,1100px);aspect-ratio:1;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(232,162,74,.30) 0%,rgba(164,80,26,.12) 35%,rgba(15,13,11,0) 65%);animation:glow 6s ease-in-out infinite}
.layerWord{position:absolute;inset:0;pointer-events:none;z-index:1;will-change:transform}
.word{position:absolute;left:0;right:0;top:50%;transform:translateY(-58%);text-align:center;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(110px,25vw,400px);line-height:.8;letter-spacing:-.01em;color:#efe7da;z-index:1;white-space:nowrap;animation:rise 1.3s cubic-bezier(.2,.8,.2,1) both .15s}
.layerFrame{position:absolute;inset:0;pointer-events:none;z-index:2;will-change:transform}
.frame{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,max(min(76vw,1180px,calc((max(680px,100vh - 72px) - 180px) * 16 / 9)),calc(clamp(110px,25vw,400px) * 2.8)));aspect-ratio:16/9;z-index:2;outline:1px solid rgba(239,231,218,.25);outline-offset:10px;pointer-events:auto;background:#1c1916;box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden;animation:popin 1.2s cubic-bezier(.2,.8,.2,1) both .45s}
.kenburns{position:absolute;inset:0;animation:kenburns 16s ease-in-out infinite alternate}
.layerStroke{position:absolute;inset:0;pointer-events:none;z-index:4;will-change:transform}
.stroke{position:absolute;left:0;right:0;top:50%;transform:translateY(-58%);text-align:center;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(110px,25vw,400px);line-height:.8;letter-spacing:-.01em;color:rgba(239,231,218,.14);-webkit-text-stroke:2px #efe7da;text-shadow:0 6px 40px rgba(0,0,0,.35);z-index:2;white-space:nowrap;pointer-events:none;animation:rise 1.3s cubic-bezier(.2,.8,.2,1) both .15s}
.strokeInner{position:relative;display:inline-block}
.script{position:absolute;right:-0.06em;bottom:-0.5em;font-family:var(--font-delafield),cursive;font-size:.62em;line-height:1;text-transform:none;letter-spacing:0;color:#e8a24a;-webkit-text-stroke:0;text-shadow:0 4px 24px rgba(0,0,0,.5);transform:rotate(-8deg);animation:popin 1s cubic-bezier(.2,.8,.2,1) both 1.2s}
.layerPolaroidL{position:absolute;inset:0;pointer-events:none;z-index:3;will-change:transform}
.polaroidL{position:absolute;left:clamp(12px,6vw,96px);top:9%;width:clamp(120px,15vw,230px);aspect-ratio:3/4;z-index:3;pointer-events:auto;border:7px solid #efe7da;transform:rotate(-6deg);box-shadow:0 18px 40px rgba(0,0,0,.5);background:#1c1916;animation:dropin 1s cubic-bezier(.2,.8,.2,1) both .8s, float 7s ease-in-out 2s infinite}
.layerPolaroidR{position:absolute;inset:0;pointer-events:none;z-index:3;will-change:transform}
.polaroidR{position:absolute;right:clamp(12px,6vw,96px);bottom:12%;width:clamp(150px,19vw,290px);aspect-ratio:16/10;z-index:3;pointer-events:auto;border:7px solid #efe7da;transform:rotate(4deg);box-shadow:0 18px 40px rgba(0,0,0,.5);background:#1c1916;animation:dropin 1s cubic-bezier(.2,.8,.2,1) both 1s, float 8s ease-in-out 2.4s infinite}
```

- [ ] **Step 4: Hero component**

```tsx
// web/components/sections/Hero/Hero.tsx
import {MediaSlot} from '@/components/media/MediaSlot'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Hero.module.css'

export function Hero({hero}: {hero: HomeVM['hero']}) {
  return (
    <section className={styles.section}>
      <div data-depth="0.2" data-scroll="0.1" className={styles.layerGlow}>
        <div className={styles.glow} data-hero-anim="" />
      </div>
      <div data-depth="0.4" data-scroll="0.35" className={styles.layerWord}>
        <div className={styles.word} data-hero-anim="">{hero.word}</div>
      </div>
      <div data-depth="1" data-scroll="-0.12" className={styles.layerFrame}>
        <div className={styles.frame} data-hero-anim="">
          <div className={styles.kenburns} data-motion="loop">
            {hero.mainImage && <SanityImage image={hero.mainImage} sizes="(max-width: 1255px) 94vw, 1180px" priority />}
          </div>
        </div>
      </div>
      <div data-depth="0.4" data-scroll="0.35" className={styles.layerStroke}>
        <div aria-hidden="true" className={styles.stroke} data-hero-anim="">
          <span className={styles.strokeInner}>
            {hero.word}
            <span className={styles.script} data-hero-anim="">{hero.script}</span>
          </span>
        </div>
      </div>
      <div data-depth="2" data-scroll="-0.45" className={styles.layerPolaroidL}>
        <div className={styles.polaroidL} data-hero-anim="">
          <MediaSlot media={hero.polaroidLeft} sizes="(max-width: 800px) 120px, 15vw" />
        </div>
      </div>
      <div data-depth="1.6" data-scroll="-0.25" className={styles.layerPolaroidR}>
        <div className={styles.polaroidR} data-hero-anim="">
          <MediaSlot media={hero.polaroidRight} sizes="(max-width: 800px) 150px, 19vw" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Marquee**

```css
/* web/components/sections/Marquee/Marquee.module.css — markup.html <sc-if value="{{ showMarquee }}"> */
.band{background:#e8a24a;color:#14110e;overflow:hidden;padding:14px 0;border-top:1px solid #14110e;border-bottom:1px solid #14110e}
.track{display:flex;width:max-content;animation:marquee 28s linear infinite;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:28px;letter-spacing:.04em;white-space:nowrap}
.item{display:flex;align-items:center;gap:28px;padding-right:28px}
.amp{font-family:var(--font-delafield),cursive;font-size:44px;text-transform:none;line-height:.6}
```

```tsx
// web/components/sections/Marquee/Marquee.tsx
import styles from './Marquee.module.css'

/** Prototype renders the word list twice; the track translates -50% for a seamless loop. */
export function Marquee({words}: {words: string[]}) {
  if (words.length === 0) return null
  const items = [...words, ...words]
  return (
    <div className={styles.band} aria-hidden="true">
      <div className={styles.track} data-motion="loop">
        {items.map((word, i) => (
          <span key={`${word}-${i}`} className={styles.item}>
            {word}
            <span className={styles.amp}>&amp;</span>
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests, typecheck, verifier for the hero + marquee range**

```bash
cd web && npx vitest run components/sections && npm run typecheck
A=$(grep -n 'data-screen-label="01 Home"' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'background:#efe7da;color:#14110e">$' ../design-reference/markup.html | head -1 | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-1))
```

Expected: PASS / 0 / `✓ … covered` (the `main` line itself is covered by `.pagein` in globals.css).

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/components/sections/Hero web/components/sections/Marquee
git commit -m "feat(web): home hero with parallax layers and marquee band

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Home — Intro, Selected reels rail, Explore, Currently, and the page

**Files:**
- Create: `web/components/sections/Intro/Intro.tsx`, `Intro.module.css`
- Create: `web/components/sections/ReelsRail/ReelsRail.tsx`, `ReelsRail.module.css`
- Create: `web/components/sections/Explore/Explore.tsx`, `Explore.module.css`
- Create: `web/components/sections/Currently/Currently.tsx`, `Currently.module.css`
- Modify: `web/app/page.tsx`
- Test: `web/components/sections/ReelsRail/ReelsRail.test.tsx`, `web/components/sections/Explore/Explore.test.tsx`

**Interfaces:**
- Consumes: `HomeVM`, `ProjectVM`, `homeProjects`, `getHome`, `getSiteSettings`, `getProjects`.
- Produces: `<Intro intro />`, `<ReelsRail reels projects />`, `<Explore explore />`, `<Currently currently />`; route `/`.

- [ ] **Step 1: Write the failing tests**

```tsx
// web/components/sections/ReelsRail/ReelsRail.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {homeProjects} from '@/lib/viewmodel/projects'
import {ReelsRail} from './ReelsRail'

const p = (slug: string, extra: Partial<ProjectVM> = {}): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022', role: 'DOP', roleShort: 'DOP', category: 'dop',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: false, n: '01', seo: {title: null, description: null, image: null}, ...extra,
})

describe('ReelsRail', () => {
  it('links each shown project to its page with title and (format, year)', () => {
    const projects = homeProjects([p('pagal'), p('hidden', {showOnHome: false}), p('credit', {creditOnly: true})])
    render(<ReelsRail reels={{script: 'now showing', heading: 'Selected reels', ctaLabel: 'All work & reels →'}} projects={projects} />)
    const cards = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/work/'))
    expect(cards.map((a) => a.getAttribute('href'))).toEqual(['/work/pagal'])
    expect(cards[0]).toHaveTextContent('PAGAL')
    expect(cards[0]).toHaveTextContent('(music video, 2022)')
    expect(cards[0].getAttribute('data-reveal')).toBe('1')
    expect(screen.getByRole('link', {name: 'All work & reels →'})).toHaveAttribute('href', '/work')
  })
})
```

```tsx
// web/components/sections/Explore/Explore.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Explore} from './Explore'

describe('Explore', () => {
  it('renders one lifting card per entry pointing at its page', () => {
    render(<Explore explore={{script: 'explore', heading: 'The work', cards: [
      {label: 'Work & Reels', sub: 'watch', href: '/work', image: null},
      {label: 'Frames', sub: 'browse', href: '/frames', image: null},
    ]}} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work', '/frames'])
    expect(links[0].className).toContain('hoverLift')
    expect(links[0]).toHaveTextContent('watch →')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npx vitest run ReelsRail Explore`
Expected: FAIL — modules not found.

- [ ] **Step 3: Intro (markup.html `<section style="background:#efe7da;color:#14110e">` after the marquee)**

```css
/* web/components/sections/Intro/Intro.module.css */
.section{background:#efe7da;color:#14110e}
.inner{max-width:1480px;margin:0 auto;padding:clamp(80px,10vw,150px) clamp(16px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:64px clamp(40px,7vw,120px);align-items:center}
.collage{position:relative;width:100%;max-width:640px;aspect-ratio:1/1.1}
.imageA{position:absolute;left:0;top:0;width:68%;aspect-ratio:4/5;background:#d9d0c1}
.imageB{position:absolute;right:0;bottom:0;width:50%;aspect-ratio:4/5;border:8px solid #fff;transform:rotate(4deg);box-shadow:0 20px 50px rgba(0,0,0,.18);background:#d9d0c1}
.text{display:flex;flex-direction:column;gap:20px}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(64px,7vw,104px);line-height:.6;color:#a4501a;margin-bottom:8px}
.heading{margin:0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(64px,8vw,128px);line-height:.88}
.subline{font-family:var(--font-bodoni),serif;font-style:italic;font-size:22px;color:#5e564c}
.body{margin:0;font-size:19px;max-width:520px;text-wrap:pretty}
.cta{all:unset;cursor:pointer;align-self:flex-start;margin-top:8px;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #a4501a;padding-bottom:6px}
```

```tsx
// web/components/sections/Intro/Intro.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Intro.module.css'

export function Intro({intro}: {intro: HomeVM['intro']}) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div data-reveal="1" className={styles.collage}>
          <div className={styles.imageA}>{intro.imageA && <SanityImage image={intro.imageA} sizes="(max-width: 640px) 68vw, 435px" />}</div>
          <div className={styles.imageB}>{intro.imageB && <SanityImage image={intro.imageB} sizes="(max-width: 640px) 50vw, 320px" />}</div>
        </div>
        <div data-reveal="1" className={styles.text}>
          <span className={styles.script}>{intro.script}</span>
          <h2 className={styles.heading}>{intro.heading}</h2>
          <span className={styles.subline}>{intro.subline}</span>
          <p className={styles.body}>{intro.body}</p>
          <Link href="/about" className={`${styles.cta} hoverRust asButton`}>{intro.ctaLabel}</Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: ReelsRail (markup.html `<section style="background:#000;…">`)**

```css
/* web/components/sections/ReelsRail/ReelsRail.module.css */
.section{background:#000;padding:clamp(64px,8vw,120px) 0}
.head{max-width:1480px;margin:0 auto;padding:0 clamp(16px,4vw,48px) 36px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap}
.headText{display:flex;flex-direction:column}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(56px,6vw,88px);line-height:.6;color:#e8a24a}
.heading{margin:12px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(48px,6vw,96px);line-height:.9}
.cta{all:unset;cursor:pointer;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border-bottom:2px solid #e8a24a;padding-bottom:6px}
.sprocketTop{height:16px;background:repeating-linear-gradient(90deg,transparent 0 10px,#efe7da 10px 24px,transparent 24px 34px);opacity:.85;margin:0 0 14px}
.rail{display:flex;gap:14px;overflow-x:auto;padding:0 clamp(16px,4vw,48px);scrollbar-width:none}
.card{all:unset;cursor:pointer;flex:0 0 clamp(280px,40vw,600px);display:flex;flex-direction:column;gap:14px}
.cardImage{position:relative;aspect-ratio:16/9;background:#1c1916}
.cardMeta{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.cardTitle{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:32px;line-height:1}
.cardSub{font-family:var(--font-bodoni),serif;font-style:italic;font-size:17px;color:#b9b0a2}
.sprocketBottom{height:16px;background:repeating-linear-gradient(90deg,transparent 0 10px,#efe7da 10px 24px,transparent 24px 34px);opacity:.85;margin:18px 0 0}
```

```tsx
// web/components/sections/ReelsRail/ReelsRail.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './ReelsRail.module.css'

export function ReelsRail({reels, projects}: {reels: HomeVM['reels']; projects: ProjectVM[]}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.script}>{reels.script}</span>
          <h2 className={styles.heading}>{reels.heading}</h2>
        </div>
        <Link href="/work" className={`${styles.cta} hoverAmber asButton`}>{reels.ctaLabel}</Link>
      </div>
      <div className={styles.sprocketTop} aria-hidden="true" />
      <div className={styles.rail}>
        {projects.map((p) => (
          <Link key={p.id} href={`/work/${p.slug}`} data-reveal="1" className={`${styles.card} asButton`}>
            <div className={styles.cardImage}>
              {p.cover && <SanityImage image={p.cover} sizes="(max-width: 700px) 280px, (max-width: 1500px) 40vw, 600px" />}
            </div>
            <div className={styles.cardMeta}>
              <span className={`${styles.cardTitle} hoverAmber`}>{p.title}</span>
              <span className={styles.cardSub}>({p.formatLower}, {p.year})</span>
            </div>
          </Link>
        ))}
      </div>
      <div className={styles.sprocketBottom} aria-hidden="true" />
    </section>
  )
}
```

- [ ] **Step 5: Explore (markup.html section with `list="{{ explore }}"`)**

```css
/* web/components/sections/Explore/Explore.module.css */
.section{max-width:1480px;margin:0 auto;padding:clamp(80px,10vw,150px) clamp(16px,4vw,48px)}
.head{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:56px}
.script{font-family:var(--font-delafield),cursive;font-size:clamp(64px,7vw,104px);line-height:.6;color:#e8a24a}
.heading{margin:14px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(56px,7vw,112px);line-height:.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:clamp(20px,3vw,40px)}
.card{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:18px;transition:transform .3s}
.cardImage{position:relative;aspect-ratio:3/4;background:#1c1916}
.cardMeta{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(239,231,218,.2);padding-top:14px}
.cardLabel{font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:34px;line-height:1}
.cardSub{font-family:var(--font-bodoni),serif;font-style:italic;font-size:18px;color:#e8a24a}
```

```tsx
// web/components/sections/Explore/Explore.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Explore.module.css'

export function Explore({explore}: {explore: HomeVM['explore']}) {
  return (
    <section className={styles.section}>
      <div data-reveal="1" className={styles.head}>
        <span className={styles.script}>{explore.script}</span>
        <h2 className={styles.heading}>{explore.heading}</h2>
      </div>
      <div className={styles.grid}>
        {explore.cards.map((c, i) => (
          <Link key={`${c.href}-${i}`} href={c.href} data-reveal="1" className={`${styles.card} hoverLift asButton`}>
            <div className={styles.cardImage}>
              {c.image && <SanityImage image={c.image} sizes="(max-width: 700px) 100vw, (max-width: 1500px) 33vw, 460px" />}
            </div>
            <div className={styles.cardMeta}>
              <span className={styles.cardLabel}>{c.label}</span>
              <span className={styles.cardSub}>{c.sub} →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Currently (markup.html section with `id="currently-bg"`)**

```css
/* web/components/sections/Currently/Currently.module.css */
.section{position:relative;min-height:clamp(560px,80vh,860px);background:#1c1916;display:flex;align-items:center;justify-content:flex-end;padding:clamp(24px,5vw,80px)}
.bg{position:absolute;inset:0;overflow:hidden}
.kenburns{position:absolute;inset:0;animation:kenburns 20s ease-in-out infinite alternate}
.card{position:relative;z-index:2;background:#efe7da;color:#14110e;max-width:520px;padding:clamp(28px,4vw,52px);display:flex;flex-direction:column;gap:16px;box-shadow:0 30px 80px rgba(0,0,0,.4)}
.script{font-family:var(--font-delafield),cursive;font-size:76px;line-height:.6;color:#a4501a}
.heading{margin:10px 0 0;font-family:var(--font-anton),sans-serif;text-transform:uppercase;font-size:clamp(34px,3.4vw,48px);line-height:.98}
.body{margin:0;font-size:17px;color:#3d372f;text-wrap:pretty}
.cta{all:unset;cursor:pointer;align-self:flex-start;margin-top:6px;background:#14110e;color:#efe7da;font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;padding:16px 22px}
```

```tsx
// web/components/sections/Currently/Currently.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Currently.module.css'

export function Currently({currently}: {currently: HomeVM['currently']}) {
  return (
    <section className={styles.section}>
      <div className={styles.bg}>
        <div className={styles.kenburns} data-motion="loop">
          {currently.bgImage && <SanityImage image={currently.bgImage} sizes="100vw" />}
        </div>
      </div>
      <div data-reveal="1" className={styles.card}>
        <span className={styles.script}>{currently.script}</span>
        <h3 className={styles.heading}>{currently.heading}</h3>
        <p className={styles.body}>{currently.body}</p>
        <Link href="/contact" className={`${styles.cta} hoverBgRust asButton`}>{currently.ctaLabel}</Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Home page**

```tsx
// web/app/page.tsx
import {Currently} from '@/components/sections/Currently/Currently'
import {Explore} from '@/components/sections/Explore/Explore'
import {Hero} from '@/components/sections/Hero/Hero'
import {Intro} from '@/components/sections/Intro/Intro'
import {Marquee} from '@/components/sections/Marquee/Marquee'
import {ReelsRail} from '@/components/sections/ReelsRail/ReelsRail'
import {getHome, getProjects, getSiteSettings} from '@/lib/data'
import {homeProjects} from '@/lib/viewmodel/projects'

export default async function HomePage() {
  const [home, settings, projects] = await Promise.all([getHome(), getSiteSettings(), getProjects()])
  return (
    <main className="pagein">
      <Hero hero={home.hero} />
      {settings.showMarquee && <Marquee words={settings.marqueeWords} />}
      <Intro intro={home.intro} />
      <ReelsRail reels={home.reels} projects={homeProjects(projects)} />
      <Explore explore={home.explore} />
      <Currently currently={home.currently} />
    </main>
  )
}
```

- [ ] **Step 8: Run tests, typecheck, verifier for the whole Home block, build, visual check**

```bash
cd web && npx vitest run && npm run typecheck
A=$(grep -n 'data-screen-label="01 Home"' ../design-reference/markup.html | cut -d: -f1); B=$(grep -n 'data-screen-label="02 Work' ../design-reference/markup.html | cut -d: -f1)
node tools/verify-styles.mjs --lines $A-$((B-1))
npm run build
```

Expected: PASS / 0 / `✓ … covered` / build OK. Then `npm run dev` and compare `http://localhost:3000` with `design-reference/original.html` opened in the same browser at 1440 px wide: leader → hero rise/popin/dropin sequence, mouse parallax, marquee, cream intro, black reels rail with sprocket strips, explore grid lifting on hover, "currently" card over a Ken Burns background, pre-footer, footer, grain. Fix any mismatch before committing.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/components/sections web/app/page.tsx
git commit -m "feat(web): home page — intro, selected reels rail, explore grid, currently

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Plan 04 adds the Work and Project screens with the video lightbox; Plan 05 adds Frames, About and Contact with the inquiry API; Plan 06 releases.
