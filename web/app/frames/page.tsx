import {FramesGrid} from '@/components/sections/FramesGrid/FramesGrid'
import {getFrames, getFramesPage} from '@/lib/data'

export default async function FramesPage() {
  const [page, frames] = await Promise.all([getFramesPage(), getFrames()])
  return <FramesGrid page={page} frames={frames} />
}
