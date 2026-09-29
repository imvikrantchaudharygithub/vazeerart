import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'vazeer',
  title: 'Vazeer Art',
  projectId: 'iq6do512',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
