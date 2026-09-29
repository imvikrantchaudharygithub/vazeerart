// web/components/sections/BriefForm/BriefForm.tsx
'use client'

import {useEffect, useId, useRef, useState, type FormEvent} from 'react'
import type {InquiryErrors} from '@/lib/inquiry/schema'
import type {ContactVM} from '@/lib/viewmodel/pagesContent'
import styles from './BriefForm.module.css'

type Props = {form: ContactVM['form']; success: ContactVM['success']}
type Status = 'idle' | 'sending' | 'sent' | 'failed'

export function BriefForm({form, success}: Props) {
  const ids = {name: useId(), contact: useId(), dates: useId(), brief: useId()}
  const typeId = useId()
  const resetRef = useRef<HTMLButtonElement>(null)
  const [type, setType] = useState(form.types[0] ?? '')
  const [values, setValues] = useState({name: '', contact: '', dates: '', brief: '', website: ''})
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (status === 'sent') resetRef.current?.focus()
  }, [status])

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
      <div className={styles.sent} role="status">
        <span className={styles.sentScript}>{success.script}</span>
        <p className={styles.sentBody}>{success.body}</p>
        <button ref={resetRef} type="button" className={styles.reset} onClick={() => { setValues({name: '', contact: '', dates: '', brief: '', website: ''}); setStatus('idle') }}>
          {success.resetLabel}
        </button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <span className={styles.heading}>{form.heading}</span>
      <div className={styles.group}>
        <span id={typeId} className={styles.fieldLabel}>{form.typeQuestion}</span>
        <div className={styles.chips} role="group" aria-labelledby={typeId}>
          {form.types.map((t) => (
            <button key={t} type="button" className={styles.chip} data-active={t === type ? 'true' : 'false'} aria-pressed={t === type} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        {errors.type && <span className={styles.error} role="alert">{errors.type}</span>}
      </div>
      <label className={styles.label} htmlFor={ids.name}>
        <span className={styles.fieldLabel}>{form.nameLabel}</span>
        <input id={ids.name} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? `${ids.name}-error` : undefined} className={styles.input} required value={values.name} onChange={set('name')} autoComplete="name" />
      </label>
      {errors.name && <span id={`${ids.name}-error`} className={styles.error} role="alert">{errors.name}</span>}
      <label className={styles.label} htmlFor={ids.contact}>
        <span className={styles.fieldLabel}>{form.contactLabel}</span>
        <input id={ids.contact} aria-invalid={errors.contact ? true : undefined} aria-describedby={errors.contact ? `${ids.contact}-error` : undefined} className={styles.input} required value={values.contact} onChange={set('contact')} autoComplete="email" />
      </label>
      {errors.contact && <span id={`${ids.contact}-error`} className={styles.error} role="alert">{errors.contact}</span>}
      <label className={styles.label} htmlFor={ids.dates}>
        <span className={styles.fieldLabel}>{form.datesLabel}</span>
        <input id={ids.dates} aria-invalid={errors.dates ? true : undefined} aria-describedby={errors.dates ? `${ids.dates}-error` : undefined} className={styles.input} value={values.dates} onChange={set('dates')} />
      </label>
      {errors.dates && <span id={`${ids.dates}-error`} className={styles.error} role="alert">{errors.dates}</span>}
      <label className={styles.label} htmlFor={ids.brief}>
        <span className={styles.fieldLabel}>{form.briefLabel}</span>
        <textarea id={ids.brief} aria-invalid={errors.brief ? true : undefined} aria-describedby={errors.brief ? `${ids.brief}-error` : undefined} className={styles.textarea} rows={4} value={values.brief} onChange={set('brief')} />
      </label>
      {errors.brief && <span id={`${ids.brief}-error`} className={styles.error} role="alert">{errors.brief}</span>}
      <label className={styles.honeypot} aria-hidden="true">
        website <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </label>
      {status === 'failed' && <span className={styles.error} role="alert">Could not send — please try again.</span>}
      <button type="submit" className={`${styles.submit} hoverBgRust`} disabled={status === 'sending'}>{form.submitLabel}</button>
    </form>
  )
}
