// web/components/chrome/Footer.tsx
import Link from 'next/link'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import styles from './Footer.module.css'

export function Footer({settings}: {settings: SiteSettingsVM}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Link href="/" className={`${styles.brand} asButton`} aria-label={`${settings.brandWord} ${settings.brandScript} — home`}>
            <span className={styles.brandWord}>{settings.brandWord}</span>
            <span className={styles.brandScript}>{settings.brandScript}</span>
          </Link>
          <div className={styles.nav}>
            {settings.pages.map((p) => (
              <Link key={p.key} href={p.href} className={`${styles.navItem} hoverAmber asButton`}>{p.menuLabel}</Link>
            ))}
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.socials}>
            {settings.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
            ))}
          </div>
          <span>{settings.copyright}</span>
        </div>
      </div>
    </footer>
  )
}
