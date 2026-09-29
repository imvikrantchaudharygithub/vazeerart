// web/app/api/inquiry/route.test.ts
import {stegaEncodeSourceMap, type ContentSourceMap} from '@sanity/client/stega'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const create = vi.fn(async () => ({_id: 'inq'}))
const fetchTypes = vi.fn(async (..._args: unknown[]): Promise<string[]> => ['Music video', 'Commercial'])
const withConfig = vi.fn((_config: unknown) => ({fetch: fetchTypes}))
vi.mock('@/lib/sanity/writeClient', () => ({writeClient: {create}}))
vi.mock('@/lib/sanity/client', () => ({client: {withConfig}}))

// Every helper request gets a fresh client IP so the module-scoped per-IP bucket never bleeds between tests.
let nextIp = 0
const freshIp = () => `10.0.0.${++nextIp}`
const post = async (body: unknown, headers: Record<string, string> = {}) => {
  const {POST} = await import('./route')
  return POST(new Request('http://localhost/api/inquiry', {method: 'POST', body: JSON.stringify(body), headers: {'content-type': 'application/json', 'x-forwarded-for': freshIp(), ...headers}}))
}
const good = {type: 'Music video', name: 'Asha', contact: 'asha@example.com', dates: '', brief: 'hi', website: ''}

describe('POST /api/inquiry', () => {
  beforeEach(() => {
    create.mockClear()
    fetchTypes.mockClear()
    withConfig.mockClear()
    fetchTypes.mockImplementation(async () => ['Music video', 'Commercial'])
  })

  it('stores a valid inquiry', async () => {
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({_type: 'inquiry', name: 'Asha', type: 'Music video', read: false}))
  })
  it('silently accepts honeypot submissions without writing', async () => {
    const res = await post({...good, website: 'http://spam'})
    expect(res.status).toBe(200)
    expect(create).not.toHaveBeenCalled()
  })
  it('returns 400 with field errors for invalid input', async () => {
    const res = await post({...good, name: ''})
    expect(res.status).toBe(400)
    expect((await res.json()).errors.name).toBeDefined()
    expect(create).not.toHaveBeenCalled()
  })
  it('accepts a stega-encoded type chip (Presentation/draft mode) and stores the cleaned value', async () => {
    const csm: ContentSourceMap = {
      documents: [{_id: 'contactPage', _type: 'contactPage'}],
      paths: ["$['type']"],
      mappings: {"$['type']": {source: {document: 0, path: 0, type: 'documentValue'}, type: 'value'}},
    }
    const encoded = stegaEncodeSourceMap({type: 'Music video'}, csm, {enabled: true, studioUrl: 'https://vazeerart.sanity.studio', filter: () => true}).type
    expect(encoded).not.toBe('Music video')
    const res = await post({...good, type: encoded})
    expect(res.status).toBe(200)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({type: 'Music video'}))
  })
  it('rejects an unknown type with 400 and no write', async () => {
    fetchTypes.mockImplementation(async () => ['Music video'])
    const res = await post({...good, type: 'Wedding'})
    expect(res.status).toBe(400)
    expect((await res.json()).errors.type).toBeDefined()
    expect(create).not.toHaveBeenCalled()
  })
  it('honeypot short-circuits before validation', async () => {
    const res = await post({...good, name: '', website: 'x'})
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ok: true})
    expect(create).not.toHaveBeenCalled()
    expect(fetchTypes).not.toHaveBeenCalled()
  })
  it('reads the allowed types with the CDN bypassed so a newly published chip is accepted at once', async () => {
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(withConfig).toHaveBeenCalledWith({useCdn: false})
    expect(fetchTypes).toHaveBeenCalledTimes(1)
  })
  it('returns 400 for a non-JSON body', async () => {
    const {POST} = await import('./route')
    const res = await POST(new Request('http://localhost/api/inquiry', {method: 'POST', body: 'nope', headers: {'x-forwarded-for': freshIp()}}))
    expect(res.status).toBe(400)
  })

  describe('abuse controls', () => {
    it('accepts a same-origin Origin header', async () => {
      const res = await post(good, {origin: 'http://localhost:3000'})
      expect(res.status).toBe(200)
      expect(create).toHaveBeenCalledTimes(1)
    })
    it('accepts a request with no Origin header', async () => {
      const res = await post(good)
      expect(res.status).toBe(200)
      expect(create).toHaveBeenCalledTimes(1)
    })
    it('rejects a cross-site Origin with 403 before any fetch or write', async () => {
      const res = await post(good, {origin: 'https://evil.example'})
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ok: false, errors: {name: 'Forbidden'}})
      expect(fetchTypes).not.toHaveBeenCalled()
      expect(create).not.toHaveBeenCalled()
    })
    it('rejects an opaque Origin ("null") with 403', async () => {
      const res = await post(good, {origin: 'null'})
      expect(res.status).toBe(403)
      expect(create).not.toHaveBeenCalled()
    })
    it('rate-limits the 6th request from one IP with 429 and no fetch or write', async () => {
      const ip = {'x-forwarded-for': '203.0.113.9, 10.1.1.1'}
      for (let i = 0; i < 5; i++) expect((await post(good, ip)).status).toBe(200)
      create.mockClear()
      fetchTypes.mockClear()
      const res = await post(good, ip)
      expect(res.status).toBe(429)
      expect(await res.json()).toEqual({ok: false, errors: {name: 'Too many requests \u2014 please try again in a minute.'}})
      expect(fetchTypes).not.toHaveBeenCalled()
      expect(create).not.toHaveBeenCalled()
      // A different client is unaffected.
      expect((await post(good)).status).toBe(200)
    })
    it('rate-limits before parsing the body', async () => {
      const ip = {'x-forwarded-for': '203.0.113.10'}
      for (let i = 0; i < 5; i++) await post(good, ip)
      const {POST} = await import('./route')
      const res = await POST(new Request('http://localhost/api/inquiry', {method: 'POST', body: 'nope', headers: ip}))
      expect(res.status).toBe(429)
    })
  })
})
