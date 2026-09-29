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

// TODO (deferred - needs a seeded Sanity dataset): Step 4b motion parity pass.
// With `npm run dev` running and design-reference/original.html open in a second tab at 1440 px,
// walk spec section 3.3 row by row and tick each one in a comment on the commit or in
// docs/superpowers/plans/motion-parity-2026-09-29.md:
//  1. Leader: 3 -> 2 -> 1 at 0.7 s steps, fade at 2.1 s, gone at 2.7 s, ring spinning; not repeated on reload in the same tab.
//  2. Hero: word `rise` clip reveal, frame `popin`, script `popin` late, polaroids `dropin` then float; hero starts as the leader fades.
//  3. Parallax: move the mouse across the hero; layers drift with the same depth ordering; scroll down 600 px and the layers shift as in the prototype.
//  4. Ken Burns on hero, currently, showreel, project cover, about finale (16/20/22/18/22 s).
//  5. Marquee speed and seamless wrap.
//  6. Reveal: below-fold blocks rise 56 px with the three-step stagger; above-fold blocks never flash.
//  7. Page enter on every navigation.
//  8. Project HUD: REC blink at 1 s steps, timecode counting 25 fps.
//  9. Grain flicker; play button pulse; hover colours (amber on dark, rust on cream); explore cards lift 8 px.
// Also record a 20-second GIF of the home page load and hero interaction.

for (const screen of SCREENS) {
  for (const {w, h} of WIDTHS) {
    test(`${screen.name} @ ${w}`, async ({page}) => {
      await page.setViewportSize({width: w, height: h})
      // Never write a real inquiry from the contact "sent" state.
      await page.route('**/api/inquiry', (route) =>
        route.request().method() === 'POST'
          ? route.fulfill({status: 200, contentType: 'application/json', body: '{"ok":true}'})
          : route.continue(),
      )
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
