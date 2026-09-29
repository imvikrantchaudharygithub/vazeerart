// web/app/contact/page.tsx
import {BriefForm} from '@/components/sections/BriefForm/BriefForm'
import {ContactIntro} from '@/components/sections/ContactIntro/ContactIntro'
import {getContact, getSiteSettings} from '@/lib/data'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'

export async function generateMetadata() {
  const [contact, settings] = await Promise.all([getContact(), getSiteSettings()])
  return buildMetadata({seo: contact.seo, fallback: settings.seo, path: '/contact', siteUrl: env.siteUrl, title: `${contact.script} ${contact.heading}`, imageFallback: contact.photo})
}

export default async function ContactPage() {
  const [contact, settings] = await Promise.all([getContact(), getSiteSettings()])
  return (
    <ContactIntro contact={contact} settings={settings}>
      <BriefForm form={contact.form} success={contact.success} />
    </ContactIntro>
  )
}
