// web/app/api/inquiry/route.ts
import {stegaClean} from 'next-sanity'
import {NextResponse} from 'next/server'
import {validateInquiry} from '@/lib/inquiry/schema'
import {client} from '@/lib/sanity/client'
import {CONTACT_TYPES_QUERY} from '@/lib/sanity/queries'
import {writeClient} from '@/lib/sanity/writeClient'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ok: false, errors: {name: 'Invalid request'}}, {status: 400})
  }

  // Clean stega from the submitted strings: in Presentation/draft mode the form's type chips render stega-encoded text (this route's own types fetch below is not a draft fetch, so it needs no cleaning).
  const clean = Object.fromEntries(Object.entries((body ?? {}) as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? stegaClean(v) : v]))

  const types = ((await client.fetch(CONTACT_TYPES_QUERY)) ?? []).filter((t): t is string => typeof t === 'string')
  const result = validateInquiry(clean, types)
  if (!result.ok) return NextResponse.json({ok: false, errors: result.errors}, {status: 400})

  // Honeypot filled → pretend success, store nothing.
  if (result.value.website) return NextResponse.json({ok: true})

  const {type, name, contact, dates, brief} = result.value
  await writeClient.create({_type: 'inquiry', type, name, contact, dates, brief, receivedAt: new Date().toISOString(), read: false})
  return NextResponse.json({ok: true})
}
