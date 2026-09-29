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
