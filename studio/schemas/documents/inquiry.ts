import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons/Comment'

export const inquiry = defineType({
  name: 'inquiry',
  title: 'Inquiry',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({name: 'type', title: 'Type', type: 'string', readOnly: true}),
    defineField({name: 'name', title: 'Name', type: 'string', readOnly: true}),
    defineField({name: 'contact', title: 'Email or phone', type: 'string', readOnly: true}),
    defineField({name: 'dates', title: 'Dates & location', type: 'string', readOnly: true}),
    defineField({name: 'brief', title: 'Brief', type: 'text', rows: 6, readOnly: true}),
    defineField({name: 'receivedAt', title: 'Received', type: 'datetime', readOnly: true}),
    defineField({name: 'read', title: 'Read', type: 'boolean', initialValue: false}),
  ],
  orderings: [{title: 'Newest first', name: 'receivedDesc', by: [{field: 'receivedAt', direction: 'desc'}]}],
  preview: {
    select: {name: 'name', type: 'type', receivedAt: 'receivedAt', read: 'read'},
    prepare({name, type, receivedAt, read}) {
      const when = receivedAt ? new Date(receivedAt).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : ''
      return {title: `${read ? '' : '● '}${name ?? 'Unnamed'}`, subtitle: `${type ?? ''} · ${when}`}
    },
  },
})
