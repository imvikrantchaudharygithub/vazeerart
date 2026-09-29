// web/app/contact/page.tsx
import {BriefForm} from '@/components/sections/BriefForm/BriefForm'
import {ContactIntro} from '@/components/sections/ContactIntro/ContactIntro'
import {getContact, getSiteSettings} from '@/lib/data'

export default async function ContactPage() {
  const [contact, settings] = await Promise.all([getContact(), getSiteSettings()])
  return (
    <ContactIntro contact={contact} settings={settings}>
      <BriefForm form={contact.form} success={contact.success} />
    </ContactIntro>
  )
}
