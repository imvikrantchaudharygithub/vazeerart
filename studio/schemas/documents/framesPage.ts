import {defineField, defineType} from 'sanity'
import {ImagesIcon} from '@sanity/icons/Images'

export const framesPage = defineType({
  name: 'framesPage',
  title: 'Frames page',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({name: 'script', title: 'Script line', type: 'string', initialValue: 'straight from the grid', validation: (r) => r.required().max(40)}),
    defineField({name: 'heading', title: 'Giant heading', type: 'string', initialValue: 'Frames', validation: (r) => r.required().max(12)}),
    defineField({name: 'linkLabel', title: 'Link label', type: 'string', initialValue: '(follow along @vazeerart ↗)', validation: (r) => r.required().max(60)}),
    defineField({name: 'linkUrl', title: 'Link URL', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'reelLabel', title: 'Placeholder label for 9:16 frames', type: 'string', initialValue: 'Reel cover', validation: (r) => r.required().max(30)}),
    defineField({name: 'postLabel', title: 'Placeholder label for other frames', type: 'string', initialValue: 'Instagram post', validation: (r) => r.required().max(30)}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Frames page'})},
})
