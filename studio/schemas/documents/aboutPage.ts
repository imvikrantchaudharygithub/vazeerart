import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'statement', title: 'Statement'},
    {name: 'credits', title: 'Credits'},
    {name: 'finale', title: 'Finale'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: "hey, i'm", validation: (r) => r.required().max(30)}),
        defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Vazeer Art', validation: (r) => r.required().max(30)}),
        defineField({name: 'body', title: 'Paragraph', type: 'text', rows: 5, validation: (r) => r.required().max(600)}),
        defineField({name: 'ctaLabel', title: 'Button label', type: 'string', initialValue: 'Get in touch →', validation: (r) => r.required().max(40)}),
        defineField({name: 'portrait', title: 'Portrait (4:5)', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({name: 'polaroid', title: 'Tilted polaroid (3:4) — GIF or loop', type: 'mediaSlot', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'statement',
      title: 'Statement',
      type: 'object',
      group: 'statement',
      fields: [
        defineField({name: 'headingPlain', title: 'Heading (plain part)', type: 'string', validation: (r) => r.required().max(120)}),
        defineField({name: 'headingAccent', title: 'Heading (rust accent part)', type: 'string', validation: (r) => r.required().max(40)}),
        defineField({name: 'paragraphs', title: 'Paragraphs', type: 'array', of: [defineArrayMember({type: 'text', rows: 4})], validation: (r) => r.min(1).max(6)}),
        defineField({name: 'aside', title: 'Italic aside', type: 'string', validation: (r) => r.required().max(80)}),
      ],
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'object',
      group: 'credits',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'imdbLabel', title: 'IMDb link label', type: 'string', initialValue: 'Full list on IMDb ↗', validation: (r) => r.required().max(40)}),
        defineField({name: 'imdbUrl', title: 'IMDb URL', type: 'url', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'finale',
      title: 'Finale',
      type: 'object',
      group: 'finale',
      fields: [
        defineField({name: 'script', title: 'Giant script line', type: 'string', initialValue: 'find the frame', validation: (r) => r.required().max(30)}),
        defineField({name: 'sub', title: 'Italic subline', type: 'string', validation: (r) => r.required().max(60)}),
        defineField({name: 'bgImage', title: 'Full-bleed background', type: 'imageWithAlt', validation: (r) => r.required()}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'About'})},
})
