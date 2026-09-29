import {defineField, defineType} from 'sanity'
import {validateMediaSlot} from '../../lib/validation'

export const mediaSlot = defineType({
  name: 'mediaSlot',
  title: 'Image or video loop',
  type: 'object',
  description: 'Use a still image or animated GIF, or a short muted MP4/WebM loop.',
  validation: (rule) => rule.custom((value) => validateMediaSlot(value as never)),
  fields: [
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      initialValue: 'image',
      options: {list: [{title: 'Image / GIF', value: 'image'}, {title: 'Video loop', value: 'video'}], layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image or GIF',
      type: 'imageWithAlt',
      hidden: ({parent}) => parent?.kind === 'video',
    }),
    defineField({
      name: 'video',
      title: 'Video loop (MP4 or WebM, muted)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
      hidden: ({parent}) => parent?.kind !== 'video',
    }),
  ],
  preview: {
    select: {kind: 'kind', media: 'image', alt: 'image.alt'},
    prepare({kind, media, alt}) {
      return {title: alt || (kind === 'video' ? 'Video loop' : 'Image'), media}
    },
  },
})
