import Image, {getImageProps} from 'next/image'
import {preload} from 'react-dom'
import {imageSrc, objectPositionFor, sanityImageLoader} from '@/lib/sanity/image'
import type {ImageVM} from '@/lib/viewmodel/types'

type Props = {
  image: ImageVM
  sizes: string
  priority?: boolean
  /** Preload with high priority only where this media query matches; the <img> stays lazy elsewhere (e.g. hidden). */
  preloadMedia?: string
  className?: string
}

/** Fills its positioned parent, like the prototype's <image-slot>. */
export function SanityImage({image, sizes, priority = false, preloadMedia, className}: Props) {
  const isGif = image.extension === 'gif'
  const src = isGif ? image.url : imageSrc(image)
  if (preloadMedia && !isGif) {
    // Same props as the <Image> below, so the preload's srcset matches the one the browser picks from.
    // The loader file is a client module; the same function is passed directly so this also runs on the server.
    const {props} = getImageProps({src, alt: '', fill: true, sizes, loader: sanityImageLoader})
    preload(props.src, {as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'high', media: preloadMedia})
  }
  return (
    <Image
      src={src}
      unoptimized={isGif}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      fetchPriority={preloadMedia ? 'high' : undefined}
      placeholder={image.lqip ? 'blur' : 'empty'}
      blurDataURL={image.lqip ?? undefined}
      className={className}
      style={{objectFit: 'cover', objectPosition: objectPositionFor(image.hotspot)}}
    />
  )
}
