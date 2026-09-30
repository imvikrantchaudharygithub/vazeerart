# Mobile hero reference — "Vazeer Mobile Hero.html", variant 3a (Round 3 · Split → Lens)

Claude Design export received 2026-09-30. The site plays variant 3a in reverse on phones: the lens state (the
canvas's 2c) is the first screen and a small scroll morphs it into the amber split (2a).

- `original.html` — the export as received (self-unpacking bundle).
- `markup.html` — the unpacked template markup, styles stripped; 3a is the first `<section>` (the `stageRef` div).
- `design-source.jsx` — the component script: `setup()` measures the pieces, `apply(t)` is the whole morph
  (t = 0 split, t = 1 lens).
- `keyframes.css` — the export's own keyframes, verbatim (the site uses `kb` for the lens photo's Ken Burns).

Port: `web/lib/motion/lensSplit.ts` (pure maths, golden-tested against the measured `apply(t)` values),
`web/components/sections/MobileHero/` (lens drawn in CSS + scroll controller). Unpack command (from the repo root):

```bash
F="Vazeer Mobile Hero.html"; sed -n '382p' "$F" > /tmp/tpl.json   # template (markup + x-dc script + styles)
node -e 'const t=JSON.parse(require("fs").readFileSync("/tmp/tpl.json","utf8"));console.log(t.length)'
```
