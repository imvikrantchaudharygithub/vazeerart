import {defineField, defineType} from 'sanity'

export const skill = defineType({
  name: 'skill',
  title: 'Skill tile',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required().max(30)}),
    defineField({name: 'media', title: 'Tile (square)', type: 'mediaSlot', validation: (r) => r.required()}),
    defineField({
      name: 'tilt',
      title: 'Tilt (degrees)',
      type: 'number',
      description: 'Negative tilts left, positive tilts right. Prototype uses -3, 2, -2, 3.',
      initialValue: 0,
      validation: (r) => r.required().min(-15).max(15),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'tilt', media: 'media.image'}},
})
