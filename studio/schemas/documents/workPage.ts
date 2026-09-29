import {defineArrayMember, defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons/Play'
import {isVideoUrl} from '../../lib/validation'

export const workPage = defineType({
  name: 'workPage',
  title: 'Work & Reels',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'header', title: 'Header', default: true},
    {name: 'showreel', title: 'Showreel'},
    {name: 'list', title: 'Project list'},
    {name: 'skills', title: 'Special skills'},
    {name: 'projectPage', title: 'Project page labels'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'title', title: 'Giant title', type: 'string', group: 'header', initialValue: 'Work', validation: (r) => r.required().max(12)}),
    defineField({name: 'script', title: 'Cursive word overlapping the title', type: 'string', group: 'header', initialValue: '& reels', validation: (r) => r.required().max(16)}),
    defineField({name: 'intro', title: 'Italic intro line', type: 'string', group: 'header', validation: (r) => r.required().max(120)}),
    defineField({name: 'filterAll', title: 'Filter label: all', type: 'string', group: 'header', initialValue: 'All', validation: (r) => r.required().max(20)}),
    defineField({name: 'filterDop', title: 'Filter label: cinematography', type: 'string', group: 'header', initialValue: 'Cinematography', validation: (r) => r.required().max(20)}),
    defineField({name: 'filterEditor', title: 'Filter label: editing', type: 'string', group: 'header', initialValue: 'Editing', validation: (r) => r.required().max(20)}),
    defineField({
      name: 'showreel',
      title: 'Showreel',
      type: 'object',
      group: 'showreel',
      fields: [
        defineField({name: 'poster', title: 'Poster frame (16:9)', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({
          name: 'videoUrl',
          title: 'YouTube or Vimeo URL',
          type: 'url',
          description: 'Leave empty to hide the play button.',
          validation: (r) => r.custom((v) => (!v || isVideoUrl(v) ? true : 'Enter a YouTube or Vimeo link')),
        }),
        defineField({name: 'label', title: 'Label', type: 'string', initialValue: 'Showreel', validation: (r) => r.required().max(20)}),
        defineField({name: 'orderNotePrefix', title: 'Order note prefix', type: 'string', initialValue: 'in order of appearance:', validation: (r) => r.required().max(40)}),
        defineField({name: 'orderNoteOverride', title: 'Order note override (optional)', type: 'string', description: 'If set, replaces the automatic list of project titles.', validation: (r) => r.max(200)}),
      ],
    }),
    defineField({name: 'numberPrefix', title: 'Number prefix in list', type: 'string', group: 'list', initialValue: 'no.', validation: (r) => r.required().max(10)}),
    defineField({name: 'projectCta', title: 'Project link label', type: 'string', group: 'list', initialValue: 'Watch & view frames →', validation: (r) => r.required().max(40)}),
    defineField({
      name: 'skills',
      title: 'Special skills',
      type: 'object',
      group: 'skills',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'items', title: 'Tiles', type: 'array', of: [defineArrayMember({type: 'skill'})], validation: (r) => r.min(1).max(8)}),
      ],
    }),
    defineField({
      name: 'projectPage',
      title: 'Project page labels',
      type: 'object',
      group: 'projectPage',
      fields: [
        defineField({name: 'backLabel', title: 'Back link', type: 'string', initialValue: '← Work & reels', validation: (r) => r.required().max(30)}),
        defineField({name: 'reelPrefix', title: 'Script prefix before the number', type: 'string', initialValue: 'reel no.', validation: (r) => r.required().max(20)}),
        defineField({name: 'roleLabel', title: 'Role label', type: 'string', initialValue: 'role', validation: (r) => r.required().max(20)}),
        defineField({name: 'formatLabel', title: 'Format label', type: 'string', initialValue: 'format', validation: (r) => r.required().max(20)}),
        defineField({name: 'yearLabel', title: 'Year label', type: 'string', initialValue: 'year', validation: (r) => r.required().max(20)}),
        defineField({name: 'aspectLabel', title: 'Aspect ratio HUD label', type: 'string', initialValue: '2.39 : 1', validation: (r) => r.required().max(20)}),
        defineField({name: 'grabsScript', title: 'Frame grabs script line', type: 'string', initialValue: 'frame', validation: (r) => r.required().max(20)}),
        defineField({name: 'grabsHeading', title: 'Frame grabs heading', type: 'string', initialValue: 'Grabs', validation: (r) => r.required().max(20)}),
        defineField({name: 'upNextScript', title: 'Up next script line', type: 'string', initialValue: 'up next', validation: (r) => r.required().max(20)}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Work & Reels'})},
})
