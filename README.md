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

## Environment variables

Two places read environment variables: the web app (`web/`, locally from `web/.env.local`, in production from the Vercel project) and the Studio (`studio/`, from `studio/.env.local` or `studio/.env.production` at build/deploy time). Copy `web/.env.example` to `web/.env.local` and `studio/.env.example` to `studio/.env.local` for local work. `.env*` files are gitignored (only the `.env.example` files are committed). Never paste a token anywhere except `web/.env.local` and the Vercel environment-variable form.

| Name | Set in | Role / token type | Required? |
|---|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `web/.env.local`, Vercel Production, Vercel Preview | Public project id: `iq6do512` | Yes. The app throws at start-up without it |
| `NEXT_PUBLIC_SANITY_DATASET` | `web/.env.local`, Vercel Production, Vercel Preview | Public dataset name: `production` | Yes. The app throws at start-up without it |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `web/.env.local`, Vercel Production, Vercel Preview | Public API version date: `2026-09-29` | No (defaults to `2026-09-29`); set it anyway so it is explicit |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | `web/.env.local` (`http://localhost:3333`), Vercel Production, Vercel Preview (`https://vazeerart.sanity.studio`) | Public URL of the Studio, used for edit links | Set in production. Defaults to `http://localhost:3333`, which is wrong on the live site |
| `NEXT_PUBLIC_SITE_URL` | `web/.env.local` (`http://localhost:3000`), Vercel Production, Vercel Preview | Public origin the site is served from. Canonical, Open Graph and sitemap URLs and the inquiry API's same-origin check all derive from it | **Mandatory in production and preview.** Must equal the served origin exactly (scheme, apex vs `www`, no trailing slash). Unset, the app logs `[env] NEXT_PUBLIC_SITE_URL is not set` and falls back to `http://localhost:3000` |
| `SANITY_API_READ_TOKEN` | `web/.env.local`, Vercel Production, Vercel Preview | **Viewer** token (`web-read`). Server token for draft mode / Presentation and the browser token for Sanity Live. Keep it Viewer: it reaches the browser | Yes in production. Without it `/api/draft-mode/enable` returns 503 and Presentation cannot load drafts |
| `SANITY_API_WRITE_TOKEN` | `web/.env.local`, Vercel Production, Vercel Preview | **Editor** token (`web-inquiries`). Used only by `POST /api/inquiry`, server-side. Never expose it to the browser | Yes. Without it every contact-form submission fails with the retry message |
| `SANITY_REVALIDATE_SECRET` | `web/.env.local`, Vercel Production, Vercel Preview | Random string (`openssl rand -hex 24`), shared with the optional Sanity webhook that calls `/api/revalidate` | Only if the webhook is used. `POST /api/revalidate` returns 503 while it is unset |
| `SANITY_STUDIO_PREVIEW_URL` | `studio/.env.local` (dev), `studio/.env.production` (deploy) | Not a secret. The site URL the Presentation tool loads. Baked in when the Studio is built | Set it for the hosted Studio, then run `npm run deploy` again. Defaults to `http://localhost:3000` |

Notes:

- `NEXT_PUBLIC_*` values are inlined at build time. After changing one on Vercel, trigger a redeploy (Deployments → the latest → Redeploy). Changing a server-only variable also needs a redeploy to take effect.
- The `production` dataset must be public: the site reads published content without a token, so a private dataset breaks the build.
- Tokens are created at https://www.sanity.io/manage/project/iq6do512/api#tokens (Add API token): `web-read` with the **Viewer** role and `web-inquiries` with the **Editor** role. Sanity shows a token value once; copy it straight into `web/.env.local` / Vercel.
- On a Vercel preview deployment that is served from a different origin than `NEXT_PUBLIC_SITE_URL`, the contact form answers 403 by design (see "Abuse controls"). Test inquiries on production.

## Deployment

Order matters: the site fetches its content from Sanity while it builds, so the content must be seeded and the tokens must exist before the first Vercel deploy. Steps marked *(browser)* are done in a web UI; everything else is a terminal command. In every shell: `source ~/.nvm/nvm.sh && nvm use` (Node 22).

### 1. Sign in to Sanity and create the API tokens

```bash
npx sanity@latest login --provider google      # or --provider github / --provider sanity
```

*(browser)* At https://www.sanity.io/manage/project/iq6do512/api#tokens create two tokens and keep the values for step 5 (and for `web/.env.local` if you run the site locally):

- `web-read` with role **Viewer** goes into `SANITY_API_READ_TOKEN`
- `web-inquiries` with role **Editor** goes into `SANITY_API_WRITE_TOKEN`

Generate the webhook secret now too: `openssl rand -hex 24` goes into `SANITY_REVALIDATE_SECRET`.

### 2. Seed the content

```bash
cd studio && npm run seed
npx sanity documents query '{"projects": count(*[_type == "project"]), "frames": count(*[_type == "frame"])}' --project-id iq6do512 --dataset production
```

Safe on the first run. Re-running overwrites every seeded document (`createOrReplace`), so never run it again once Vazeer has started editing.

Expected line: `{"projects":5,"frames":12}` (JSON key order may differ). The seeded pictures are stock placeholders that the editor replaces later.

### 3. Deploy the Studio

```bash
cd studio && npm run deploy                    # hostname is fixed to `vazeerart` in sanity.cli.ts
```

Result: https://vazeerart.sanity.studio. Step 7 redeploys it with the production preview URL.

### 4. Push the repository

Create an empty GitHub repository (in Vazeer's account or yours), then from the repo root. The local branch is `master`; use it as is, or rename it (`git branch -M main`) and push `main` instead, but keep the Vercel production branch in step 5 in sync.

```bash
git remote add origin git@github.com:<owner>/vazeer-web.git
git push -u origin master
```

### 5. Create the Vercel project *(browser)*

vercel.com → Add New → Project → import the repository, then:

1. **Root Directory: `web`**. Framework preset: Next.js (detected).
2. Settings → General → Node.js Version: **22.x**.
3. Settings → Git → Production Branch: the branch you pushed in step 4 (`master` unless you renamed it).
4. Environment Variables: add every `web` variable from the table above to **both Production and Preview**. Mark the two tokens and the secret as Sensitive. Values:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | `iq6do512` |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `NEXT_PUBLIC_SANITY_API_VERSION` | `2026-09-29` |
   | `NEXT_PUBLIC_SANITY_STUDIO_URL` | `https://vazeerart.sanity.studio` |
   | `NEXT_PUBLIC_SITE_URL` | the production origin, e.g. `https://vazeerart.com`. Use the `https://<project>.vercel.app` URL until the domain is attached, then see "When the custom domain is attached" below |
   | `SANITY_API_READ_TOKEN` | the `web-read` Viewer token |
   | `SANITY_API_WRITE_TOKEN` | the `web-inquiries` Editor token |
   | `SANITY_REVALIDATE_SECRET` | the `openssl rand -hex 24` output |

5. Deploy. Expected: the build succeeds and the `*.vercel.app` URL renders the home page with the seeded content. If the `*.vercel.app` URL is not what you set in `NEXT_PUBLIC_SITE_URL`, fix the variable and redeploy.

### 6. Allow the origins in Sanity CORS

Each origin the site is served from (and local dev) must be allowed, with credentials, for the draft-mode and Live requests to work. Add the exact origins, apex and `www` separately if both are used:

```bash
cd studio
npx sanity cors add http://localhost:3000 --credentials --project-id iq6do512
npx sanity cors add https://<production-domain> --credentials --project-id iq6do512
npx sanity cors add https://<project>.vercel.app --credentials --project-id iq6do512
```

### 7. Point the Studio's preview at production

```bash
cd studio
echo "SANITY_STUDIO_PREVIEW_URL=https://<production-domain>" > .env.production
npm run deploy
```

Open https://vazeerart.sanity.studio → **Presentation**. Expected: the live site loads inside the pane; clicking the intro heading opens the Home document at `intro.heading`; editing it shows the change in the preview as a draft; **Publish** makes it visible on the production URL within seconds (reload if not).

### 8. Optional: revalidate webhook

Only needed if Sanity Live does not refresh the site reliably (the webhook is the fallback that revalidates every route). *(browser)* At https://www.sanity.io/manage/project/iq6do512/api#webhooks → Create webhook:

| Field | Value |
|---|---|
| URL | `https://<production-domain>/api/revalidate` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["siteSettings","homePage","workPage","framesPage","aboutPage","contactPage","project","frame"]` |
| HTTP method | `POST` |
| Secret | the same value as `SANITY_REVALIDATE_SECRET` on Vercel |

Then use **Send test** and open the webhook's attempts log: expect HTTP 200 with `{"revalidated":true,...}`. A 401 means the secret differs from the Vercel value; a 503 means `SANITY_REVALIDATE_SECRET` is not set on Vercel (set it and redeploy).

### When the custom domain is attached

Vercel → Settings → Domains → add the domain. Then, in this order:

1. Set `NEXT_PUBLIC_SITE_URL` on Vercel (Production and Preview) to the exact new origin, and redeploy.
2. Add the new origin to CORS (step 6).
3. Set `SANITY_STUDIO_PREVIEW_URL` in `studio/.env.production` and run `npm run deploy` in `studio/` (step 7).
4. Update the webhook URL if step 8 was done.

## Abuse controls on the inquiry form

`POST /api/inquiry` is the only write path from the public site:

- **Same-origin only.** A request whose `Origin` header does not match `NEXT_PUBLIC_SITE_URL` gets 403. That is why `NEXT_PUBLIC_SITE_URL` must equal the served origin exactly. A request with no `Origin` header at all is allowed (older same-origin fetches omit it); only a mismatching `Origin` is answered with 403.
- **Rate limit: 5 submissions per minute per IP, per server instance** (a burst of 5, refilling at 5 per minute); beyond that the API answers 429. The counter lives in memory per serverless instance, so it is a speed bump, not a hard global cap. **Vercel WAF rate limiting** (Firewall → a rate-limit rule on `POST /api/inquiry`) is the upgrade path if spam appears.
- **Honeypot.** The hidden form field is named `website`. When it is filled the API answers `200 {"ok":true}` and stores nothing, so bots see success.
- The Editor token is used only by this route, on the server, and never reaches the browser.

## Release verification checklist

Run after the seed and again against production once it is deployed.

Automated:

- [ ] `cd web && npm run build` prerenders every route. The route table shows `○` for `/`, `/work`, `/frames`, `/about`, `/contact`; `●` for `/work/<slug>` (`generateStaticParams`, the five seeded slugs); `ƒ` for the API routes.
- [ ] `cd web && npm run e2e` builds and serves the current code on `localhost:3000` (needs `web/.env.local` with real values) and compares screenshots at 1440 / 1024 / 390. The baselines are already committed (macOS; they carry the `-darwin` suffix). Run `npx playwright install chromium` once first, and stop anything already serving port 3000 (the run starts its own server, never reuses an existing one, and fails if the port is taken). The 1440 and 1024 baselines come from the prototype; the 390 baselines come from the site, because the site deliberately departs from the prototype on narrow and portrait screens (header links hidden below 768 px, the phone-only mobile hero; `home-split @ 390` captures its end state after the scroll morph and a companion test asserts the morph causes no layout shift). To regenerate: `npm run e2e:baseline` (prototype, 1440 and 1024 only) then `npm run e2e:baseline:mobile` (site, 390). Do not regenerate baselines just to make a failing run pass.
- [ ] `cd web && npm run build && npm run start`, then in another shell `npm run perf` (locally), or `LH_URL=https://<production-domain> npm run perf` (production; the URL comes from `LH_URL`, not from an argument): mobile performance is at least 90 on `/`, `/work` and one project, and `/contact` accessibility is 100. `LH_PROJECT_SLUG` (default `pagal`) picks the project. `npm run perf` downloads Lighthouse through `npx --yes` on first use and needs a local Chrome. `npm run perf` uses Lighthouse's simulated throttling (the PageSpeed Insights model), which on localhost counts every script and prefetch that finishes before the hero image arrives from the Sanity CDN against the image-LCP routes; `LH_THROTTLING=devtools npm run perf` applies real throttling instead and is closer to a device. Treat PageSpeed Insights against the production URL as the acceptance number.

Browser smoke (production, also on a phone):

- [ ] Intro countdown ("leader") plays once per tab, not on every navigation.
- [ ] Hero entrances, parallax, marquee and scroll reveals run.
- [ ] Menu opens, focus stays inside, Escape closes it; header is sticky.
- [ ] Showreel lightbox opens; Escape and the backdrop close it; focus returns to the trigger.
- [ ] Work filter chips filter; `/work?filter=bogus` falls back to all projects.
- [ ] Project page: HUD timecode and REC indicator; frame grabs render.
- [ ] Frames page: masonry keeps the ratios.
- [ ] About: credit links go where they should; credit-only entries have no project page.
- [ ] Contact: submit a test inquiry, see it in the Studio under **Inquiries** with the "● name" unread dot, then delete it there. A submission with the honeypot filled returns 200 and creates nothing.
- [ ] Presentation: clicking text or a photo opens the right field; edits preview as a draft; Publish updates the site.
- [ ] `/nope` shows the styled 404.
- [ ] `/work/<credit-only-slug>` (e.g. a project with "Credit only" on) returns HTTP 404 with the styled page. This is the real `notFound()` path; `/nope` alone only covers unknown URLs.
- [ ] `/sitemap.xml` lists production-origin URLs and `/robots.txt` points at that sitemap; the page source has the production canonical URL. The Vercel logs do not show `[env] NEXT_PUBLIC_SITE_URL is not set`.

## Editing the site (for Vazeer)

1. Open https://vazeerart.sanity.studio and sign in.
2. Left sidebar:
   - **Site settings, Home, Work & Reels, Frames page, About, Contact** hold every text and picture on those screens.
   - **Projects** and **Frames** are lists. Use "+" to add and drag the handle to reorder.
   - **Inquiries** collects messages from the Contact form.
3. Click **Presentation** (top bar) to see the live site and click any text or photo to jump to its field.
4. Every change is a draft until you press **Publish**. Published changes show on the site on the next page load, usually within seconds. A tab you already have open picks the change up when you reload it or move to another page. If a change is still missing a minute after publishing, tell the developer.
5. **Projects**: each has a cover, frame grabs, format, year, role and a category (this drives the filter on the Work page).
   - **YouTube or Vimeo URL**: paste the link and the play button appears automatically. Unlisted videos work. Leave it empty if there is no video yet. The showreel link is set the same way on the Work & Reels page.
   - **Show in the home "Selected reels" rail**: controls whether the project appears on the home page.
   - **Credit only (no project page)**: when on, the project appears only in the credits list on About and has no page of its own.
6. **Frames**: each frame is one picture with an **Aspect ratio** (this decides its shape in the grid) and an optional Instagram link.
7. **Every image needs alt text** (a short description of the picture); the Studio will not let you publish without it.
8. **Inquiries** arrive with a "●" dot in front of the name while unread. Open one, read it, and tick **Read** when handled. Delete an inquiry from the "..." menu once it is dealt with.
9. Under Site settings → Toggles you can switch the intro countdown, the marquee band, the film grain and the REC overlay on or off.
10. **Home → Phone hero** is the banner phones see first: the round lens photo over the stacked name, which turns into the amber split on a small scroll. It has its own word, cursive word, lens photo and small photo. Leave a field empty to reuse the Home → Hero value; fill it to show something different on phones only.
11. The pictures now in the Studio are stand-ins. Replace them with your own work (drag a new image onto the field).

**Please do not change:** API tokens, CORS or webhook settings, or anything in the project settings at sanity.io/manage, and anything in Vercel. If the site or the Studio looks broken, contact the developer instead.
