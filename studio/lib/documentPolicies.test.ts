// studio/lib/documentPolicies.test.ts
import {describe, expect, it} from 'vitest'
import {filterDocumentActions, filterNewDocumentOptions} from './documentPolicies'

const actions = ['publish', 'unpublish', 'discardChanges', 'duplicate', 'delete', 'restore'].map(
  (action) => ({action}) as any,
)

describe('filterDocumentActions', () => {
  it('leaves only publish, discardChanges and restore for singletons', () => {
    const out = filterDocumentActions(actions, {schemaType: 'homePage'} as any).map((a: any) => a.action)
    expect(out).toEqual(['publish', 'discardChanges', 'restore'])
  })
  it('removes duplicate for inquiries but keeps delete', () => {
    const out = filterDocumentActions(actions, {schemaType: 'inquiry'} as any).map((a: any) => a.action)
    expect(out).toEqual(['publish', 'unpublish', 'discardChanges', 'delete', 'restore'])
  })
  it('leaves projects untouched', () => {
    expect(filterDocumentActions(actions, {schemaType: 'project'} as any)).toEqual(actions)
  })
})

describe('filterNewDocumentOptions', () => {
  const templates = ['siteSettings', 'homePage', 'project', 'frame', 'inquiry'].map((templateId) => ({templateId}) as any)
  it('hides singletons and inquiries from the global create menu', () => {
    const out = filterNewDocumentOptions(templates, {creationContext: {type: 'global'}} as any).map((t: any) => t.templateId)
    expect(out).toEqual(['project', 'frame'])
  })
  it('does not touch non-global contexts', () => {
    expect(filterNewDocumentOptions(templates, {creationContext: {type: 'document'}} as any)).toEqual(templates)
  })
})
