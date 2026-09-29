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
