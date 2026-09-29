// web/playwright.config.ts
import {defineConfig} from '@playwright/test'

const PORT = process.env.E2E_PORT ?? '3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {toHaveScreenshot: {maxDiffPixelRatio: 0.01, animations: 'disabled'}},
  use: {colorScheme: 'dark', deviceScaleFactor: 1},
  // The prototype baselines are captured without a running site. E2E_PORT lets the site comparison
  // run beside another local server on 3000 (the port must still be free: nothing is ever reused).
  webServer:
    process.env.VISUAL_SOURCE === 'site'
      ? {command: `npm run build && npm run start -- -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: false, timeout: 180_000}
      : undefined,
})
