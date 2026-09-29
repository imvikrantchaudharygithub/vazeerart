import {defineArrayMember, defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact',
  type: 'document',
  icon: EnvelopeIcon,
  groups: [
    {name: 'intro', title: 'Intro', default: true},
    {name: 'form', title: 'Form'},
    {name: 'success', title: 'Sent state'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'script', title: 'Script line', type: 'string', group: 'intro', initialValue: 'get in', validation: (r) => r.required().max(20)}),
    defineField({name: 'heading', title: 'Giant heading', type: 'string', group: 'intro', initialValue: 'Touch', validation: (r) => r.required().max(12)}),
    defineField({name: 'intro', title: 'Italic intro', type: 'text', rows: 2, group: 'intro', validation: (r) => r.required().max(160)}),
    defineField({name: 'photo', title: 'Tilted photo (4:5)', type: 'imageWithAlt', group: 'intro', validation: (r) => r.required()}),
    defineField({
      name: 'form',
      title: 'Form',
      type: 'object',
      group: 'form',
      fields: [
        defineField({name: 'heading', title: 'Form heading', type: 'string', initialValue: 'The brief', validation: (r) => r.required().max(30)}),
        defineField({name: 'typeQuestion', title: 'Type question', type: 'string', initialValue: 'what are we making?', validation: (r) => r.required().max(60)}),
        defineField({name: 'types', title: 'Type chips', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (r) => r.min(1).max(8)}),
        defineField({name: 'nameLabel', title: 'Name label', type: 'string', initialValue: 'your name', validation: (r) => r.required().max(40)}),
        defineField({name: 'contactLabel', title: 'Contact label', type: 'string', initialValue: 'email or phone', validation: (r) => r.required().max(40)}),
        defineField({name: 'datesLabel', title: 'Dates label', type: 'string', initialValue: 'dates & location', validation: (r) => r.required().max(40)}),
        defineField({name: 'briefLabel', title: 'Brief label', type: 'string', initialValue: 'the idea, references, budget', validation: (r) => r.required().max(60)}),
        defineField({name: 'submitLabel', title: 'Submit label', type: 'string', initialValue: 'Send it →', validation: (r) => r.required().max(20)}),
      ],
    }),
    defineField({
      name: 'success',
      title: 'Sent state',
      type: 'object',
      group: 'success',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: 'that’s a wrap', validation: (r) => r.required().max(30)}),
        defineField({name: 'body', title: 'Message', type: 'string', validation: (r) => r.required().max(160)}),
        defineField({name: 'resetLabel', title: 'Reset label', type: 'string', initialValue: 'Send another', validation: (r) => r.required().max(20)}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Contact'})},
})
