import {defineField, defineType} from 'sanity'
import {EXPLORE_TARGETS} from '../../lib/constants'

export const exploreCard = defineType({
  name: 'exploreCard',
  title: 'Explore card',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(30)}),
    defineField({name: 'sub', title: 'Small italic word (before the arrow)', type: 'string', validation: (r) => r.required().max(20)}),
    defineField({name: 'image', title: 'Image (3:4)', type: 'imageWithAlt', validation: (r) => r.required()}),
    defineField({
      name: 'target',
      title: 'Opens page',
      type: 'string',
      options: {list: EXPLORE_TARGETS.map((t) => ({title: t, value: t}))},
      validation: (r) => r.required(),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'target', media: 'image'}},
})
