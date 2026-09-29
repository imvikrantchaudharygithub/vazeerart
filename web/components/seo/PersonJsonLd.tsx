// web/components/seo/PersonJsonLd.tsx
import {stegaClean} from 'next-sanity'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'

export function PersonJsonLd({settings, name, jobTitle}: {settings: SiteSettingsVM; name: string; jobTitle: string}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle,
    sameAs: settings.socials.map((s) => s.url),
  }
  // Draft / Presentation mode stega-encodes CMS strings; the JSON-LD must carry none of it.
  // `<` is escaped so a CMS string containing `</script>` cannot end the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(stegaClean<unknown>(data)).replace(/</g, '\\u003c')}} />
}
