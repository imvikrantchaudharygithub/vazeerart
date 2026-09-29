import {FramesGrid} from '@/components/sections/FramesGrid/FramesGrid'
import {getFrames, getFramesPage, getSiteSettings} from '@/lib/data'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'

export async function generateMetadata() {
  const [page, settings] = await Promise.all([getFramesPage(), getSiteSettings()])
  return buildMetadata({seo: page.seo, fallback: settings.seo, path: '/frames', siteUrl: env.siteUrl, title: page.heading})
}

export default async function FramesPage() {
  const [page, frames] = await Promise.all([getFramesPage(), getFrames()])
  return <FramesGrid page={page} frames={frames} />
}
