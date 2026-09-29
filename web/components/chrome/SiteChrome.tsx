// web/components/chrome/SiteChrome.tsx
'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useRef, useState} from 'react'
import {SanityImage} from '@/components/media/SanityImage'
import {navEntries} from '@/lib/viewmodel/pages'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import header from './Header.module.css'
import menu from './MenuOverlay.module.css'

export function SiteChrome({settings}: {settings: SiteSettingsVM}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); burgerRef.current?.focus() }
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
                <Link key={n.key} href={n.href} className={`${header.link} hoverAmber asButton`} data-active={n.active ? 'true' : 'false'}>
                  {n.navLabel}
                </Link>
              ))}
            </div>
            <button type="button" ref={burgerRef} className={header.burger} aria-label="Open menu" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
              <span className={header.bar1} />
              <span className={header.bar2} />
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div ref={dialogRef} id="site-menu" className={menu.overlay} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={menu.top}>
            <span className={menu.script}>{settings.menuScript}</span>
            <button type="button" ref={closeRef} className={menu.close} onClick={() => setOpen(false)}>{settings.menuClose}</button>
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
