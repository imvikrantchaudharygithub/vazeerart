// web/components/chrome/LeaderBootScript.tsx
import {leaderBootSource} from '@/lib/motion/leaderBoot'

export function LeaderBootScript({enabled}: {enabled: boolean}) {
  return <script dangerouslySetInnerHTML={{__html: leaderBootSource(enabled)}} />
}
