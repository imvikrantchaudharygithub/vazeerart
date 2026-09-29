// web/lib/env.ts
type Source = Record<string, string | undefined>

export function readEnv(source: Source) {
  const projectId = source.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = source.NEXT_PUBLIC_SANITY_DATASET
  if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  if (!dataset) throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET')
  return {
    projectId,
    dataset,
    apiVersion: source.NEXT_PUBLIC_SANITY_API_VERSION || '2026-09-29',
    studioUrl: source.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
    siteUrl: source.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  }
}

// Next.js inlines NEXT_PUBLIC_* only when accessed as literal property paths.
export const env = readEnv({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  NEXT_PUBLIC_SANITY_STUDIO_URL: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
})
