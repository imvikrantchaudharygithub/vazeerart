// web/app/api/revalidate/route.test.ts
import {NextRequest} from 'next/server'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({revalidatePath}))
let valid: boolean | null = true
let payload: {_type: string} | null = {_type: 'project'}
const parseBody = vi.fn(async () => ({isValidSignature: valid, body: payload}))
vi.mock('next-sanity/webhook', () => ({parseBody}))

describe('POST /api/revalidate', () => {
  beforeEach(() => { revalidatePath.mockClear(); parseBody.mockClear(); payload = {_type: 'project'}; process.env.SANITY_REVALIDATE_SECRET = 's' })

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
  it('rejects a request with no signature header (parseBody reports isValidSignature null)', async () => {
    valid = null
    payload = null
    const {POST} = await import('./route')
    const res = await POST(new NextRequest('http://localhost/api/revalidate', {method: 'POST', body: '{}'}))
    expect(res.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
  it('answers a fixed 500 and logs server-side when parseBody throws, never echoing the error text', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const boom = new Error('Unexpected token \'n\', "nope" is not valid JSON')
    parseBody.mockRejectedValueOnce(boom)
    const {POST} = await import('./route')
    const res = await POST(new NextRequest('http://localhost/api/revalidate', {method: 'POST', body: 'nope'}))
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('Internal error')
    expect(error).toHaveBeenCalledWith('[revalidate]', boom)
    expect(revalidatePath).not.toHaveBeenCalled()
    error.mockRestore()
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
