// web/tools/lighthouse.mjs — Lighthouse mobile gate. Run against `npm run start` (a production build).
//   / , /work , /work/<slug>  -> mobile performance >= 90 each
//   /contact                  -> accessibility = 100
// Env: LH_URL (default http://localhost:3000), LH_PROJECT_SLUG (default pagal),
//      LH_CHROME_FLAGS (default --headless=new; add --no-sandbox in containers),
//      LH_THROTTLING (simulate = PageSpeed Insights model, default; devtools = applied throttling).
import {execFileSync} from 'node:child_process'
import {readFileSync, rmSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

const PERF_MIN = 90
const A11Y_MIN = 100

const base = (process.env.LH_URL || 'http://localhost:3000').replace(/\/+$/, '')
const slug = process.env.LH_PROJECT_SLUG || 'pagal'
const chromeFlags = process.env.LH_CHROME_FLAGS || '--headless=new'
// simulate = PageSpeed Insights' Lantern model (default); devtools = applied throttling, closer to a real device.
const throttling = process.env.LH_THROTTLING === 'devtools' ? 'devtools' : 'simulate'
const outPath = fileURLToPath(new URL('../lighthouse.json', import.meta.url))

const targets = [
  {path: '/', category: 'performance', min: PERF_MIN},
  {path: '/work', category: 'performance', min: PERF_MIN},
  {path: `/work/${encodeURIComponent(slug)}`, category: 'performance', min: PERF_MIN},
  {path: '/contact', category: 'accessibility', min: A11Y_MIN},
]

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Lighthouse mobile gate (web/tools/lighthouse.mjs)

Usage: npm run perf [-- --help]
Run against a production server (npm run build && npm run start).

Env:
  LH_URL           base URL            (default http://localhost:3000)
  LH_PROJECT_SLUG  project for /work/<slug>  (default pagal)
  LH_CHROME_FLAGS  Chrome flags        (default --headless=new)
  LH_THROTTLING    simulate | devtools (default simulate; devtools applies real throttling)

Audits (mobile form factor, simulated throttling), base ${base}:`)
  for (const t of targets) {
    console.log(`  ${t.path.padEnd(16)} ${t.category.padEnd(14)} ${t.category === 'accessibility' ? '=' : '>='} ${t.min}`)
  }
  console.log('\nExits non-zero if any audit misses its threshold (failing and errored audit ids are printed for accessibility).')
  process.exit(0)
}

function audit({path, category}) {
  // A CLI that exits 0 without writing must not let us read the previous run's report.
  rmSync(outPath, {force: true})
  execFileSync(
    'npx',
    [
      '--yes',
      'lighthouse@12',
      `${base}${path}`,
      `--only-categories=${category}`,
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      `--throttling-method=${throttling}`,
      '--output=json',
      `--output-path=${outPath}`,
      `--chrome-flags=${chromeFlags}`,
      '--quiet',
    ],
    {stdio: 'inherit'},
  )
  return JSON.parse(readFileSync(outPath, 'utf8'))
}

function failingAuditIds(report, category) {
  const cat = report.categories[category]
  return cat.auditRefs
    .filter((ref) => ref.weight > 0)
    .flatMap((ref) => {
      const a = report.audits[ref.id]
      // An errored audit has score null and scoreDisplayMode "error"; other null scores (notApplicable, manual) are not failures.
      if (a.scoreDisplayMode === 'error') return [`${ref.id} (errored)`]
      return a.score !== null && a.score < 1 ? [ref.id] : []
    })
}

let failed = false
for (const target of targets) {
  const label = `${target.path} (${target.category})`
  let report
  try {
    report = audit(target)
  } catch (err) {
    console.error(`✗ ${label}: Lighthouse run failed: ${err.message}`)
    failed = true
    continue
  }
  const raw = report.categories[target.category].score
  const score = raw === null ? null : Math.round(raw * 100)
  const detail =
    target.category === 'performance'
      ? ` · LCP ${report.audits['largest-contentful-paint'].displayValue ?? 'n/a'} · CLS ${report.audits['cumulative-layout-shift'].displayValue ?? 'n/a'}`
      : ''
  const ok = score !== null && score >= target.min
  console.log(`${ok ? '✓' : '✗'} ${label}: ${target.category} ${score}${detail} (need ${target.category === 'accessibility' ? '=' : '>='} ${target.min})`)
  if (!ok) {
    failed = true
    if (target.category === 'accessibility') {
      console.error(`  failing audits: ${failingAuditIds(report, 'accessibility').join(', ') || '(none listed)'}`)
    }
  }
}

if (failed) {
  console.error('✗ Lighthouse gate failed')
  process.exit(1)
}
console.log('✓ Lighthouse gate passed')
