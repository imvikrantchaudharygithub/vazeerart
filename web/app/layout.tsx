// web/app/layout.tsx
import type {Metadata} from 'next'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import type {ReactNode} from 'react'
import {DisableDraftMode} from '@/components/chrome/DisableDraftMode'
import {Footer} from '@/components/chrome/Footer'
import {Grain} from '@/components/chrome/Grain'
import {Leader} from '@/components/chrome/Leader'
import {LeaderBootScript} from '@/components/chrome/LeaderBootScript'
import {PreFooter} from '@/components/chrome/PreFooter'
import {SiteChrome} from '@/components/chrome/SiteChrome'
import {ParallaxLoop} from '@/components/motion/ParallaxLoop'
import {RevealObserver} from '@/components/motion/RevealObserver'
import {Timecode} from '@/components/motion/Timecode'
import {getSiteSettings} from '@/lib/data'
import {env} from '@/lib/env'
import {fontVariables} from '@/lib/fonts'
import {SanityLive} from '@/lib/sanity/live'
import {buildMetadata} from '@/lib/seo'
import '@/styles/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {metadataBase: new URL(env.siteUrl), ...buildMetadata({seo: settings.seo, fallback: settings.seo, path: '/', siteUrl: env.siteUrl})}
}

export default async function RootLayout({children}: {children: ReactNode}) {
  const settings = await getSiteSettings()
  const {isEnabled: draft} = await draftMode()

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <LeaderBootScript enabled={settings.showIntro} />
      </head>
      <body>
        <div className="site">
          {settings.showIntro && <Leader left={settings.leaderLeft} right={settings.leaderRight} skip={settings.leaderSkip} />}
          <SiteChrome settings={settings} />
          {children}
          <PreFooter pages={settings.pages} />
          <Footer settings={settings} />
          {settings.showGrain && <Grain />}
        </div>
        <ParallaxLoop />
        <RevealObserver />
        <Timecode />
        <SanityLive />
        {draft && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  )
}
