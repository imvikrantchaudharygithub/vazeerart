// web/app/layout.tsx
import type {ReactNode} from 'react'
import {fontVariables} from '@/lib/fonts'
import '@/styles/globals.css'

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <div className="site">{children}</div>
      </body>
    </html>
  )
}
