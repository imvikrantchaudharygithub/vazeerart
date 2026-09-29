import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Browser / share title', type: 'string', validation: (r) => r.max(70)}),
    defineField({name: 'description', title: 'Share description', type: 'text', rows: 3, validation: (r) => r.max(160)}),
    defineField({name: 'image', title: 'Share image (1200×630)', type: 'imageWithAlt'}),
  ],
})
