// web/app/api/revalidate/route.test.ts
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({revalidatePath}))
let valid = true
const parseBody = vi.fn(async () => ({isValidSignature: valid, body: {_type: 'project'}}))
vi.mock('next-sanity/webhook', () => ({parseBody}))

describe('POST /api/revalidate', () => {
  beforeEach(() => { revalidatePath.mockClear(); parseBody.mockClear(); process.env.SANITY_REVALIDATE_SECRET = 's' })

  it('revalidates the whole layout on a valid signature', async () => {
    valid = true
    const {POST} = await import('./route')
    const res = await POST(new NextRequest('http://localhost/api/revalidate', {method: 'POST', body: '{}'}))
    expect(res.status).toBe(200)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
  it('rejects an invalid signature', async () => {
    valid = false
    const {POST} = await import('./route')
    const res = await POST(new NextRequest('http://localhost/api/revalidate', {method: 'POST', body: '{}'}))
    expect(res.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
  it('returns 503 before reading the body when the secret is unset', async () => {
    valid = true
    process.env.SANITY_REVALIDATE_SECRET = ''
    const {POST} = await import('./route')
    const res = await POST(new NextRequest('http://localhost/api/revalidate', {method: 'POST', body: '{}'}))
    expect(res.status).toBe(503)
    expect(await res.text()).toBe('SANITY_REVALIDATE_SECRET is not set')
    expect(parseBody).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
