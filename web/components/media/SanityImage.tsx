import Image from 'next/image'
import {imageSrc, objectPositionFor, sanityImageLoader} from '@/lib/sanity/image'
import type {ImageVM} from '@/lib/viewmodel/types'

type Props = {image: ImageVM; sizes: string; priority?: boolean; className?: string}

/** Fills its positioned parent, like the prototype's <image-slot>. */
export function SanityImage({image, sizes, priority = false, className}: Props) {
  const isGif = image.extension === 'gif'
  return (
    <Image
      src={isGif ? image.url : imageSrc(image)}
      loader={isGif ? undefined : sanityImageLoader}
      unoptimized={isGif}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder={image.lqip ? 'blur' : 'empty'}
      blurDataURL={image.lqip ?? undefined}
      className={className}
      style={{objectFit: 'cover', objectPosition: objectPositionFor(image.hotspot)}}
    />
  )
}
