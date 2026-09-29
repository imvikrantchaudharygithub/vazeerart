// web/app/api/revalidate/route.ts
import {revalidatePath} from 'next/cache'
import {parseBody} from 'next-sanity/webhook'
import {NextResponse, type NextRequest} from 'next/server'

type Payload = {_type?: string}

/** Fallback for the Live Content API (spec §4.2): any publish refreshes every route. */
export async function POST(request: NextRequest) {
  // Never read the body without a secret to verify it against.
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) return new NextResponse('SANITY_REVALIDATE_SECRET is not set', {status: 503})
  try {
    const {isValidSignature, body} = await parseBody<Payload>(request, secret, true)
    if (!isValidSignature) return new NextResponse('Invalid signature', {status: 401})
    revalidatePath('/', 'layout')
    return NextResponse.json({revalidated: true, type: body?._type ?? null, now: Date.now()})
  } catch (err) {
    // Never echo err.message: for unsigned requests it can quote the sender's body.
    console.error('[revalidate]', err)
    return new NextResponse('Internal error', {status: 500})
  }
}
