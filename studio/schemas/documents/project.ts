import {defineArrayMember, defineField, defineType} from 'sanity'
import {VideoIcon} from '@sanity/icons'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {PROJECT_CATEGORIES} from '../../lib/constants'
import {isVideoUrl} from '../../lib/validation'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: VideoIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'project'}),
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required().max(40)}),
    defineField({name: 'slug', title: 'URL slug', type: 'slug', options: {source: 'title', maxLength: 60}, validation: (r) => r.required()}),
    defineField({name: 'format', title: 'Format', type: 'string', description: 'e.g. Music Video, TV Mini Series, Short Film', validation: (r) => r.required().max(30)}),
    defineField({name: 'year', title: 'Year', type: 'string', validation: (r) => r.required().regex(/^\d{4}$/, {name: 'four digits'})}),
    defineField({name: 'role', title: 'Role (full)', type: 'string', description: 'e.g. Director of Photography', validation: (r) => r.required().max(40)}),
    defineField({
      name: 'category',
      title: 'Category (drives the Work filter)',
      type: 'string',
      options: {list: PROJECT_CATEGORIES.map((c) => ({title: c.title, value: c.value})), layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'cover', title: 'Cover frame (16:9, shown 2.39:1 on the project page)', type: 'imageWithAlt', validation: (r) => r.required()}),
    defineField({name: 'frameGrabs', title: 'Frame grabs (16:9)', type: 'array', of: [defineArrayMember({type: 'imageWithAlt'})], validation: (r) => r.max(12)}),
    defineField({
      name: 'videoUrl',
      title: 'YouTube or Vimeo URL',
      type: 'url',
      description: 'Adds a play button on the project cover. Leave empty if there is no video yet.',
      validation: (r) => r.custom((v) => (!v || isVideoUrl(v) ? true : 'Enter a YouTube or Vimeo link')),
    }),
    defineField({name: 'showOnHome', title: 'Show in the home "Selected reels" rail', type: 'boolean', initialValue: true}),
    defineField({
      name: 'creditOnly',
      title: 'Credit only (no project page)',
      type: 'boolean',
      description: 'On: appears in the About credits list only. Off: full project page and listing.',
      initialValue: false,
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {
    select: {title: 'title', format: 'format', year: 'year', media: 'cover', creditOnly: 'creditOnly'},
    prepare({title, format, year, media, creditOnly}) {
      return {title, subtitle: `${format ?? ''}, ${year ?? ''}${creditOnly ? ' · credit only' : ''}`, media}
    },
  },
})
