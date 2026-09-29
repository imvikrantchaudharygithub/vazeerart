// studio/lib/documentPolicies.ts
import type {DocumentActionComponent, NewDocumentOptionsContext, TemplateItem} from 'sanity'
import {SINGLETON_TYPES} from './constants'

const singletons = new Set<string>(SINGLETON_TYPES)
const SINGLETON_ACTIONS = new Set(['publish', 'discardChanges', 'restore'])

export function filterNewDocumentOptions(prev: TemplateItem[], context: NewDocumentOptionsContext): TemplateItem[] {
  if (context.creationContext.type !== 'global') return prev
  return prev.filter((item) => !singletons.has(item.templateId) && item.templateId !== 'inquiry')
}

export function filterDocumentActions(
  prev: DocumentActionComponent[],
  context: {schemaType: string},
): DocumentActionComponent[] {
  if (singletons.has(context.schemaType)) {
    return prev.filter(({action}) => action && SINGLETON_ACTIONS.has(action))
  }
  if (context.schemaType === 'inquiry') {
    return prev.filter(({action}) => action !== 'duplicate')
  }
  return prev
}
