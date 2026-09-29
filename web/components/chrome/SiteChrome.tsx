// web/components/chrome/SiteChrome.tsx
'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'
import {SanityImage} from '@/components/media/SanityImage'
import {navEntries} from '@/lib/viewmodel/pages'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import header from './Header.module.css'
import menu from './MenuOverlay.module.css'

export function SiteChrome({settings}: {settings: SiteSettingsVM}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const nav = navEntries(settings.pages, pathname)

  return (
    <>
      <header className={header.header}>
        <div className={header.inner}>
          <Link href="/" className={`${header.brand} asButton`} aria-label={`${settings.brandWord} ${settings.brandScript} — home`}>
            <span className={header.brandWord}>{settings.brandWord}</span>
            <span className={header.brandScript}>{settings.brandScript}</span>
          </Link>
          <nav className={header.nav}>
            <div className={header.links}>
              {nav.map((n) => (
                <Link key={n.key} href={n.href} className={`${header.link} hoverAmber`} data-active={n.active ? 'true' : 'false'}>
                  {n.navLabel}
                </Link>
              ))}
            </div>
            <button type="button" className={header.burger} aria-label="Open menu" onClick={() => setOpen(true)}>
              <span className={header.bar1} />
              <span className={header.bar2} />
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div className={menu.overlay} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={menu.top}>
            <span className={menu.script}>{settings.menuScript}</span>
            <button type="button" className={menu.close} onClick={() => setOpen(false)}>{settings.menuClose}</button>
          </div>
          <div className={menu.grid}>
            <div className={menu.list}>
              {settings.pages.map((p, i) => (
                <Link key={p.key} href={p.href} className={`${menu.item} hoverRust asButton`} onClick={() => setOpen(false)}>
                  <span className={menu.itemNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={menu.itemLabel}>{p.menuLabel}</span>
                </Link>
              ))}
            </div>
            <div className={menu.aside}>
              <div className={menu.photo}>
                {settings.menuPhoto && <SanityImage image={settings.menuPhoto} sizes="320px" />}
              </div>
              <span className={menu.socialsLabel}>{settings.menuSocialsLabel}</span>
              <div className={menu.socials}>
                {settings.socials.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
