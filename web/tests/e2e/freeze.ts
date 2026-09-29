// web/tests/e2e/freeze.ts
import type {Page} from '@playwright/test'

/** Same freeze on both sides so the diff measures layout + type, not motion or photos. */
export const FREEZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  [data-reveal] { opacity: 1 !important; translate: none !important; }
  img, video, image-slot { visibility: hidden !important; }
  /* The prototype's <image-slot> sits in normal flow, so its 3:2 placeholder photo stretches the
     16/9 reel-card box to 3:2 (60 px taller at 1440). The design declares 16/9 and the site pins it
     (next/image fill), so pin the prototype's slot to its box too. The runtime serialises the inline
     style with spaces ("aspect-ratio: 16 / 9"); the selector is inline-style only, so the site is untouched. */
  [style*="aspect-ratio: 16 / 9"] > *, [style*="aspect-ratio:16/9"] > * { position: absolute !important; inset: 0 !important; }
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
    // The prototype rewrites [data-tc] every 40 ms, so a one-shot write races the screenshot.
    // Pin the text and undo any later write (also covers the site's own ticker).
    const TC = '00:00:00:00'
    const pin = () => document.querySelectorAll('[data-tc]').forEach((el) => { if (el.textContent !== TC) el.textContent = TC })
    pin()
    new MutationObserver(pin).observe(document.body, {subtree: true, childList: true, characterData: true})
    document.documentElement.dataset.leader = ''
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}
