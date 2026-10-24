// web/components/sections/ContactIntro/ContactIntro.tsx
import type {ReactNode} from 'react'
import {SanityImage} from '@/components/media/SanityImage'
import type {ContactVM} from '@/lib/viewmodel/pagesContent'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import styles from './ContactIntro.module.css'

type Props = {contact: ContactVM; settings: Pick<SiteSettingsVM, 'management' | 'dm' | 'phone'>; children: ReactNode}

/** Web links open in a new tab; tel: and mailto: hand over to the device in the same tab. */
const external = (url: string) => /^https?:/i.test(url)

/** The Contact <main>: left column here, the form as children on the right. */
export function ContactIntro({contact, settings, children}: Props) {
  const rows = [settings.management, settings.dm, ...(settings.phone ? [settings.phone] : [])]
  return (
    <main className={styles.main}>
      <div className={styles.left}>
        <div className={styles.titleWrap}>
          <span className={styles.script}>{contact.script}</span>
          <h1 className={styles.heading}>{contact.heading}</h1>
        </div>
        <p className={styles.intro}>{contact.intro}</p>
        <div className={styles.photo}>{contact.photo && <SanityImage image={contact.photo} sizes="300px" />}</div>
        <div className={styles.links}>
          {rows.map((r) => (
            <a key={r.label} href={r.url} {...(external(r.url) ? {target: '_blank', rel: 'noreferrer'} : {})} className={styles.linkRow}>
              <span className={styles.linkLabel}>{r.label}</span>
              <span className={styles.linkHandle}>{r.handle}</span>
            </a>
          ))}
        </div>
      </div>
      {children}
    </main>
  )
}
