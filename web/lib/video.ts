// web/lib/video.ts
export type VideoEmbed = {provider: 'youtube' | 'vimeo'; id: string; hash?: string; embedUrl: string}

const YT_ID = '([\\w-]{6,})'
const PATTERNS: {provider: VideoEmbed['provider']; re: RegExp}[] = [
  {provider: 'youtube', re: new RegExp(`^https?://(?:www\\.|m\\.)?youtube\\.com/watch\\?(?:.*&)?v=${YT_ID}`, 'i')},
  {provider: 'youtube', re: new RegExp(`^https?://youtu\\.be/${YT_ID}`, 'i')},
  {provider: 'youtube', re: new RegExp(`^https?://(?:www\\.|m\\.)?youtube\\.com/shorts/${YT_ID}`, 'i')},
  {provider: 'youtube', re: new RegExp(`^https?://(?:www\\.|m\\.)?youtube(?:-nocookie)?\\.com/embed/${YT_ID}`, 'i')},
  {provider: 'vimeo', re: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d{6,})(?:\/([0-9a-z]+))?/i},
  {provider: 'vimeo', re: /^https?:\/\/player\.vimeo\.com\/video\/(\d{6,})(?:\?(?:[^#]*&)?h=([0-9a-z]+))?/i},
]

/** Same acceptance rules as studio/lib/validation.ts — keep in sync. */
export function parseVideoUrl(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null
  for (const {provider, re} of PATTERNS) {
    const m = re.exec(url.trim())
    if (!m) continue
    const id = m[1]
    const hash = provider === 'vimeo' && m[2] ? m[2] : undefined
    const embedUrl =
      provider === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
        : `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ''}autoplay=1`
    return {provider, id, ...(hash ? {hash} : {}), embedUrl}
  }
  return null
}
