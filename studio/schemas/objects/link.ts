import {defineField, defineType} from 'sanity'

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(40)}),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (r) => r.required().uri({scheme: ['http', 'https', 'mailto', 'tel']}),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'url'}},
})
