import {defineField, defineType} from 'sanity'

export const headingBlock = defineType({
  name: 'headingBlock',
  title: 'Heading',
  type: 'object',
  fields: [
    defineField({
      name: 'script',
      title: 'Script line (handwritten style)',
      type: 'string',
      description: 'The small cursive line above the heading, e.g. "now showing".',
      validation: (r) => r.required().max(40),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (r) => r.required().max(40),
    }),
  ],
  preview: {select: {title: 'heading', subtitle: 'script'}},
})
