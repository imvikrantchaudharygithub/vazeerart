import type {MediaVM} from '@/lib/viewmodel/types'
import {SanityImage} from './SanityImage'
import styles from './MediaSlot.module.css'

type Props = {media: MediaVM | null; sizes: string; priority?: boolean}

export function MediaSlot({media, sizes, priority}: Props) {
  if (!media) return null
  if (media.kind === 'video') {
    return <video className={styles.video} src={media.url} autoPlay muted loop playsInline aria-hidden="true" />
  }
  return <SanityImage image={media.image} sizes={sizes} priority={priority} />
}
