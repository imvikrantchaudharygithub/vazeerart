// web/playwright.config.ts
import {defineConfig} from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {toHaveScreenshot: {maxDiffPixelRatio: 0.01, animations: 'disabled'}},
  use: {colorScheme: 'dark', deviceScaleFactor: 1},
  // The prototype baselines are captured without a running site.
  webServer:
    process.env.VISUAL_SOURCE === 'site'
      ? {command: 'npm run build && npm run start', url: 'http://localhost:3000', reuseExistingServer: false, timeout: 180_000}
      : undefined,
})
