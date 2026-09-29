import {defineField, defineType} from 'sanity'
import {PAGE_KEYS} from '../../lib/constants'

export const pageEntry = defineType({
  name: 'pageEntry',
  title: 'Page',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'Page',
      type: 'string',
      readOnly: true,
      options: {list: PAGE_KEYS.map((k) => ({title: k, value: k}))},
      validation: (r) => r.required(),
    }),
    defineField({name: 'navLabel', title: 'Header label', type: 'string', validation: (r) => r.required().max(20)}),
    defineField({name: 'menuLabel', title: 'Full-screen menu label', type: 'string', validation: (r) => r.required().max(20)}),
    defineField({
      name: 'preFooterScript',
      title: 'Pre-footer script line',
      type: 'string',
      description: 'Cursive line above the pre-footer link, e.g. "learn more". Leave empty for Home.',
      validation: (r) => r.max(20),
    }),
    defineField({
      name: 'preFooterLabel',
      title: 'Pre-footer label',
      type: 'string',
      description: 'e.g. "About me". Leave empty for Home.',
      validation: (r) => r.max(20),
    }),
  ],
  preview: {select: {title: 'navLabel', subtitle: 'key'}},
})
