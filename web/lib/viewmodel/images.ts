import type {ImageVM, MediaVM, SeoVM} from './types'

type RawAsset = {_id: string; url: string | null; extension: string | null; width: number | null; height: number | null; lqip: string | null} | null
type RawImage = {alt: string | null; hotspot: {x: number; y: number; width: number; height: number; _type?: string} | null; crop: {top: number; bottom: number; left: number; right: number; _type?: string} | null; asset: RawAsset} | null
type RawMedia = {kind: string | null; image: RawImage; videoUrl: string | null} | null
type RawSeo = {title: string | null; description: string | null; image: RawImage} | null

export function toImageVM(raw: RawImage | undefined): ImageVM | null {
  const asset = raw?.asset
  if (!raw || !asset?._id || !asset.url) return null
  const url = asset.url
  return {
    assetId: asset._id,
    url,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    extension: asset.extension ?? 'jpg',
    lqip: asset.lqip ?? null,
    alt: raw.alt ?? '',
    hotspot: raw.hotspot ? {x: raw.hotspot.x, y: raw.hotspot.y, width: raw.hotspot.width, height: raw.hotspot.height} : null,
    crop: raw.crop ? {top: raw.crop.top, bottom: raw.crop.bottom, left: raw.crop.left, right: raw.crop.right} : null,
  }
}

export function toMediaVM(raw: RawMedia | undefined): MediaVM | null {
  if (!raw) return null
  if (raw.kind === 'video') return raw.videoUrl ? {kind: 'video', url: raw.videoUrl} : null
  const image = toImageVM(raw.image)
  return image ? {kind: 'image', image} : null
}

export function toSeoVM(raw: RawSeo | undefined): SeoVM {
  return {title: raw?.title ?? null, description: raw?.description ?? null, image: toImageVM(raw?.image)}
}

export const str = (v: string | null | undefined, fallback = ''): string => v ?? fallback
export const bool = (v: boolean | null | undefined, fallback: boolean): boolean => (v === null || v === undefined ? fallback : v)
