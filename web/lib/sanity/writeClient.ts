import 'server-only'
import {createClient} from 'next-sanity'
import {env} from '@/lib/env'

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) console.warn('SANITY_API_WRITE_TOKEN is not set — the contact form cannot store inquiries')

export const writeClient = createClient({
  projectId: env.projectId,
  dataset: env.dataset,
  apiVersion: env.apiVersion,
  useCdn: false,
  token,
})
