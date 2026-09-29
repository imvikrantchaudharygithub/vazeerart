// studio/sanity.config.ts
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './structure'
import {resolve} from './presentation/resolve'
import {filterDocumentActions, filterNewDocumentOptions} from './lib/documentPolicies'
import {SINGLETON_TYPES} from './lib/constants'

const singletons = new Set<string>(SINGLETON_TYPES)
const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'

export default defineConfig({
  name: 'vazeer',
  title: 'Vazeer Art',
  projectId: 'iq6do512',
  dataset: 'production',
  plugins: [
    structureTool({structure}),
    presentationTool({
      previewUrl: {initial: previewUrl, previewMode: {enable: '/api/draft-mode/enable'}},
      resolve,
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((t) => !singletons.has(t.schemaType) && t.schemaType !== 'inquiry'),
  },
  document: {
    newDocumentOptions: filterNewDocumentOptions,
    actions: (prev, context) => filterDocumentActions(prev, context),
  },
})
