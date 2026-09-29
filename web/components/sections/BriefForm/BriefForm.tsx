// web/components/sections/BriefForm/BriefForm.tsx
'use client'

import {useId, useState, type FormEvent} from 'react'
import type {InquiryErrors} from '@/lib/inquiry/schema'
import type {ContactVM} from '@/lib/viewmodel/pagesContent'
import styles from './BriefForm.module.css'

type Props = {form: ContactVM['form']; success: ContactVM['success']}
type Status = 'idle' | 'sending' | 'sent' | 'failed'

export function BriefForm({form, success}: Props) {
  const ids = {name: useId(), contact: useId(), dates: useId(), brief: useId()}
  const [type, setType] = useState(form.types[0] ?? '')
  const [values, setValues] = useState({name: '', contact: '', dates: '', brief: '', website: ''})
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [status, setStatus] = useState<Status>('idle')

  const set = (key: keyof typeof values) => (e: {target: {value: string}}) => setValues((v) => ({...v, [key]: e.target.value}))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrors({})
    try {
      const res = await fetch('/api/inquiry', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({type, ...values})})
      const json = (await res.json()) as {ok: boolean; errors?: InquiryErrors}
      if (!res.ok || !json.ok) {
        setErrors(json.errors ?? {name: 'Please check the form'})
        setStatus('idle')
        return
      }
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div className={styles.sent}>
        <span className={styles.sentScript}>{success.script}</span>
        <p className={styles.sentBody}>{success.body}</p>
        <button type="button" className={styles.reset} onClick={() => { setValues({name: '', contact: '', dates: '', brief: '', website: ''}); setStatus('idle') }}>
          {success.resetLabel}
        </button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <span className={styles.heading}>{form.heading}</span>
      <div className={styles.group}>
        <span className={styles.fieldLabel}>{form.typeQuestion}</span>
        <div className={styles.chips}>
          {form.types.map((t) => (
            <button key={t} type="button" className={styles.chip} data-active={t === type ? 'true' : 'false'} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        {errors.type && <span className={styles.error} role="alert">{errors.type}</span>}
      </div>
      <label className={styles.label} htmlFor={ids.name}>
        <span className={styles.fieldLabel}>{form.nameLabel}</span>
        <input id={ids.name} className={styles.input} required value={values.name} onChange={set('name')} autoComplete="name" />
        {errors.name && <span className={styles.error} role="alert">{errors.name}</span>}
      </label>
      <label className={styles.label} htmlFor={ids.contact}>
        <span className={styles.fieldLabel}>{form.contactLabel}</span>
        <input id={ids.contact} className={styles.input} required value={values.contact} onChange={set('contact')} autoComplete="email" />
        {errors.contact && <span className={styles.error} role="alert">{errors.contact}</span>}
      </label>
      <label className={styles.label} htmlFor={ids.dates}>
        <span className={styles.fieldLabel}>{form.datesLabel}</span>
        <input id={ids.dates} className={styles.input} value={values.dates} onChange={set('dates')} />
        {errors.dates && <span className={styles.error} role="alert">{errors.dates}</span>}
      </label>
      <label className={styles.label} htmlFor={ids.brief}>
        <span className={styles.fieldLabel}>{form.briefLabel}</span>
        <textarea id={ids.brief} className={styles.textarea} rows={4} value={values.brief} onChange={set('brief')} />
        {errors.brief && <span className={styles.error} role="alert">{errors.brief}</span>}
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        website <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </label>
      {status === 'failed' && <span className={styles.error} role="alert">Could not send — please try again.</span>}
      <button type="submit" className={`${styles.submit} hoverBgRust`} disabled={status === 'sending'}>{form.submitLabel}</button>
    </form>
  )
}
