import {describe, expect, it} from 'vitest'
import {documentTypes} from '../index'
import {SINGLETON_TYPES} from '../../lib/constants'

const byName = (name: string) => documentTypes.find((t) => t.name === name) as any

describe('singleton documents', () => {
  it('registers every singleton type', () => {
    for (const name of SINGLETON_TYPES) expect(byName(name), name).toBeDefined()
  })
  it('siteSettings has the five page entries validation and four toggles', () => {
    const fields = byName('siteSettings').fields.map((f: any) => f.name)
    expect(fields).toEqual(
      expect.arrayContaining(['brandWord', 'brandScript', 'copyright', 'socials', 'management', 'dm', 'marqueeWords', 'pages', 'leaderLeft', 'leaderRight', 'leaderSkip', 'menuScript', 'menuClose', 'menuSocialsLabel', 'menuPhoto', 'showIntro', 'showMarquee', 'showGrain', 'showRec', 'seo']),
    )
  })
  it('workPage carries the project-page labels group', () => {
    const projectPage = byName('workPage').fields.find((f: any) => f.name === 'projectPage')
    expect(projectPage.fields.map((f: any) => f.name)).toEqual([
      'backLabel', 'reelPrefix', 'roleLabel', 'formatLabel', 'yearLabel', 'aspectLabel', 'grabsScript', 'grabsHeading', 'upNextScript',
    ])
  })
})
