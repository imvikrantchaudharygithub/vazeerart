import {createClient} from 'next-sanity'
import {env} from '@/lib/env'

export const client = createClient({
  projectId: env.projectId,
  dataset: env.dataset,
  apiVersion: env.apiVersion,
  useCdn: true,
  stega: {studioUrl: env.studioUrl},
})
