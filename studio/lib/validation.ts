/** Same rules as web/lib/video.ts — keep in sync. */
const VIDEO_URL_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?(.*&)?v=[\w-]{6,}/i,
  /^https?:\/\/youtu\.be\/[\w-]{6,}/i,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{6,}/i,
  /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[\w-]{6,}/i,
  /^https?:\/\/(www\.)?vimeo\.com\/\d{6,}/i,
  /^https?:\/\/player\.vimeo\.com\/video\/\d{6,}/i,
]

export function isVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false
  return VIDEO_URL_PATTERNS.some((re) => re.test(url))
}

type MediaSlotValue = {
  kind?: 'image' | 'video'
  image?: {asset?: {_ref?: string}}
  video?: {asset?: {_ref?: string}}
}

export function validateMediaSlot(value: MediaSlotValue | undefined): true | string {
  if (!value) return true
  if (value.kind === 'video') {
    return value.video?.asset?._ref ? true : 'Upload an MP4 or WebM loop'
  }
  return value.image?.asset?._ref ? true : 'Choose an image'
}
