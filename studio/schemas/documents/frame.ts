import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {FRAME_RATIOS} from '../../lib/constants'

export const frame = defineType({
  name: 'frame',
  title: 'Frame',
  type: 'document',
  icon: ImageIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'frame'}),
    defineField({name: 'image', title: 'Image', type: 'imageWithAlt', validation: (r) => r.required()}),
    defineField({
      name: 'ratio',
      title: 'Aspect ratio',
      type: 'string',
      initialValue: '4/5',
      options: {list: FRAME_RATIOS.map((v) => ({title: v.replace('/', ':'), value: v})), layout: 'radio', direction: 'horizontal'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'instagramUrl', title: 'Instagram post URL (optional)', type: 'url'}),
  ],
  preview: {
    select: {media: 'image', alt: 'image.alt', ratio: 'ratio'},
    prepare({media, alt, ratio}) {
      return {title: alt || 'Frame', subtitle: ratio, media}
    },
  },
})
