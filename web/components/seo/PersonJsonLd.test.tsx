// web/components/seo/PersonJsonLd.test.tsx
import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it} from 'vitest'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import {PersonJsonLd} from './PersonJsonLd'

const settings = {socials: [{label: 'Instagram', url: 'https://instagram.com/vazeer'}]} as SiteSettingsVM

describe('PersonJsonLd', () => {
  it('renders a Person ld+json script that parses back', () => {
    const html = renderToStaticMarkup(<PersonJsonLd settings={settings} name="Vazeer Art" jobTitle="Cinematographer" />)
    expect(html).toContain('type="application/ld+json"')
    const json = /<script[^>]*>([\s\S]*)<\/script>/.exec(html)![1]
    expect(JSON.parse(json)).toMatchObject({'@type': 'Person', name: 'Vazeer Art', jobTitle: 'Cinematographer', sameAs: ['https://instagram.com/vazeer']})
    // Nothing in the CMS supplies an address, so none may be asserted.
    expect(JSON.parse(json)).not.toHaveProperty('address')
  })
  it('escapes "<" so a CMS string cannot end the script element', () => {
    const html = renderToStaticMarkup(<PersonJsonLd settings={settings} name="x</script><b>" jobTitle="DOP" />)
    expect(html).not.toMatch(/<\/script><b>/)
    expect(html).toContain('\\u003c/script')
    expect(html.match(/<\/script>/g)).toHaveLength(1)
    const json = /<script[^>]*>([\s\S]*)<\/script>/.exec(html)![1]
    expect(JSON.parse(json).name).toBe('x</script><b>')
  })
})
