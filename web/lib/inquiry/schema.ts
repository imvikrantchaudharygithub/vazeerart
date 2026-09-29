// web/lib/inquiry/schema.ts
import {z} from 'zod'

export const inquiryInput = z.object({
  type: z.string().trim().min(1, 'Choose what we are making'),
  name: z.string().trim().min(1, 'Please add your name').max(120, 'Name is too long'),
  contact: z.string().trim().min(3, 'Add an email or phone').max(200, 'Contact is too long'),
  dates: z.string().trim().max(200, 'Keep dates under 200 characters').optional().default(''),
  brief: z.string().trim().max(4000, 'Keep the brief under 4000 characters').optional().default(''),
  /** Honeypot: humans never see it, bots fill it. */
  website: z.string().optional().default(''),
})

export type InquiryInput = z.infer<typeof inquiryInput>
export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>

export function validateInquiry(data: unknown, allowedTypes: string[]): {ok: true; value: InquiryInput} | {ok: false; errors: InquiryErrors} {
  const parsed = inquiryInput.safeParse(data)
  if (!parsed.success) {
    const errors: InquiryErrors = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof InquiryInput | undefined
      if (key && !errors[key]) errors[key] = issue.message
    }
    if (Object.keys(errors).length === 0) errors.name = 'Please check the form'
    return {ok: false, errors}
  }
  if (!allowedTypes.includes(parsed.data.type)) {
    return {ok: false, errors: {type: 'Choose one of the options'}}
  }
  return {ok: true, value: parsed.data}
}
