// web/lib/seo.ts
import type {Metadata} from 'next'
import {stegaClean} from 'next-sanity'
import {croppedImageSrc} from '@/lib/sanity/image'
import type {ImageVM, SeoVM} from '@/lib/viewmodel/types'

export function ogImageUrl(image: ImageVM): string {
  return croppedImageSrc(image, 1200, 630)
}

type Input = {seo: SeoVM; fallback: SeoVM; path: string; siteUrl: string; title?: string; imageFallback?: ImageVM | null}

export function buildMetadata({seo, fallback, path, siteUrl, title, imageFallback}: Input): Metadata {
  const resolvedTitle = seo.title ?? title ?? fallback.title ?? 'Vazeer Art'
  const description = seo.description ?? fallback.description ?? undefined
  const image = seo.image ?? imageFallback ?? fallback.image
  const canonical = new URL(path, siteUrl).toString()
  const metadata: Metadata = {
    title: resolvedTitle,
    description,
    alternates: {canonical},
    openGraph: {
      type: 'website',
      url: canonical,
      title: resolvedTitle,
      description,
      siteName: fallback.title ?? 'Vazeer Art',
      ...(image ? {images: [{url: ogImageUrl(image), width: 1200, height: 630, alt: image.alt}]} : {}),
    },
    twitter: {card: image ? 'summary_large_image' : 'summary', title: resolvedTitle, description},
  }
  // The loaders stega-encode strings in draft / Presentation mode. Nothing invisible may reach <head>:
  // this is the single place every emitted string is cleaned.
  return stegaClean<unknown>(metadata) as Metadata
}
