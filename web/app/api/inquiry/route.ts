// web/app/api/inquiry/route.ts
import {stegaClean} from 'next-sanity'
import {NextResponse} from 'next/server'
import {env} from '@/lib/env'
import {allow} from '@/lib/inquiry/rateLimit'
import {validateInquiry} from '@/lib/inquiry/schema'
import {client} from '@/lib/sanity/client'
import {CONTACT_TYPES_QUERY} from '@/lib/sanity/queries'
import {writeClient} from '@/lib/sanity/writeClient'

/** A present Origin must match the site's own origin; an unparsable one (e.g. the opaque "null") never does. A missing Origin is allowed by the caller. */
function isSameOrigin(origin: string): boolean {
  try {
    return new URL(origin).origin === new URL(env.siteUrl).origin
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  // Abuse controls come first, before the body is read: same-origin only (a missing Origin is allowed — older same-origin fetches omit it), then a per-IP token bucket.
  const origin = request.headers.get('origin')
  if (origin !== null && !isSameOrigin(origin)) return NextResponse.json({ok: false, errors: {name: 'Forbidden'}}, {status: 403})
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!allow(ip)) return NextResponse.json({ok: false, errors: {name: 'Too many requests — please try again in a minute.'}}, {status: 429, headers: {'Retry-After': '60'}})

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ok: false, errors: {name: 'Invalid request'}}, {status: 400})
  }

  // Clean stega from the submitted strings: in Presentation/draft mode the form's type chips render stega-encoded text (this route's own types fetch below is not a draft fetch, so it needs no cleaning).
  const clean = Object.fromEntries(Object.entries((body ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? stegaClean(v) : v]))

  // Honeypot filled → pretend success, store nothing — checked before any fetch/validation so bots cost nothing.
  if (typeof clean.website === 'string' && clean.website) return NextResponse.json({ok: true})

  // Bypass the CDN so a newly published type chip is accepted at once.
  const types = ((await client.withConfig({useCdn: false}).fetch(CONTACT_TYPES_QUERY)) ?? []).filter((t): t is string => typeof t === 'string')
  const result = validateInquiry(clean, types)
  if (!result.ok) return NextResponse.json({ok: false, errors: result.errors}, {status: 400})

  const {type, name, contact, dates, brief} = result.value
  await writeClient.create({_type: 'inquiry', type, name, contact, dates, brief, receivedAt: new Date().toISOString(), read: false})
  return NextResponse.json({ok: true})
}
