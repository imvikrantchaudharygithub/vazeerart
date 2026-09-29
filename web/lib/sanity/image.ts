import {createImageUrlBuilder} from '@sanity/image-url'
import {env} from '@/lib/env'
import type {Hotspot, ImageVM} from '@/lib/viewmodel/types'

const builder = createImageUrlBuilder({projectId: env.projectId, dataset: env.dataset})

/** CDN url for the asset with the editor's crop applied (no size params — the loader adds them). */
export function imageSrc(image: ImageVM): string {
  return builder
    .image({
      _type: 'image',
      asset: {_type: 'reference', _ref: image.assetId},
      crop: image.crop ?? undefined,
      hotspot: image.hotspot ?? undefined,
    })
    .url()
}

/** CDN url cropped to an exact box; the builder turns the editor's hotspot into a `rect` only when both dimensions are set. */
export function croppedImageSrc(image: ImageVM, width: number, height: number): string {
  return builder
    .image({
      _type: 'image',
      asset: {_type: 'reference', _ref: image.assetId},
      crop: image.crop ?? undefined,
      hotspot: image.hotspot ?? undefined,
    })
    .width(width)
    .height(height)
    .fit('crop')
    .auto('format')
    .url()
}

/** next/image loader: Sanity CDN does the resizing, Vercel's optimizer is never used (spec §8). */
export function sanityImageLoader({src, width, quality}: {src: string; width: number; quality?: number}): string {
  const url = new URL(src)
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality ?? 65))
  url.searchParams.set('auto', 'format')
  url.searchParams.set('fit', 'max')
  return url.toString()
}

export function objectPositionFor(hotspot: Hotspot | null | undefined): string {
  if (!hotspot) return '50% 50%'
  return `${(hotspot.x * 100).toFixed(2)}% ${(hotspot.y * 100).toFixed(2)}%`
}
