import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons'
import {PAGE_KEYS} from '../../lib/constants'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'brand', title: 'Brand', default: true},
    {name: 'nav', title: 'Navigation'},
    {name: 'menu', title: 'Menu overlay'},
    {name: 'leader', title: 'Intro countdown'},
    {name: 'toggles', title: 'Toggles'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'brandWord', title: 'Brand word', type: 'string', group: 'brand', description: 'Header and footer, bold. Prototype: "Vazeer".', validation: (r) => r.required().max(20)}),
    defineField({name: 'brandScript', title: 'Brand script word', type: 'string', group: 'brand', description: 'Cursive amber word after the brand. Prototype: "art.".', validation: (r) => r.required().max(12)}),
    defineField({name: 'copyright', title: 'Footer copyright line', type: 'string', group: 'brand', validation: (r) => r.required().max(80)}),
    defineField({name: 'socials', title: 'Social links', type: 'array', group: 'brand', of: [defineArrayMember({type: 'link'})], validation: (r) => r.min(1)}),
    defineField({
      name: 'management',
      title: 'Management contact (contact page)',
      type: 'object',
      group: 'brand',
      fields: [
        defineField({name: 'label', title: 'Italic label', type: 'string', initialValue: 'management', validation: (r) => r.required()}),
        defineField({name: 'handle', title: 'Handle shown', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'dm',
      title: 'Direct message contact (contact page)',
      type: 'object',
      group: 'brand',
      fields: [
        defineField({name: 'label', title: 'Italic label', type: 'string', initialValue: 'dm me', validation: (r) => r.required()}),
        defineField({name: 'handle', title: 'Handle shown', type: 'string', validation: (r) => r.required()}),
        defineField({name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'marqueeWords',
      title: 'Marquee words',
      type: 'array',
      group: 'brand',
      of: [defineArrayMember({type: 'string'})],
      description: 'Scrolling amber band under the hero. Repeats automatically.',
      validation: (r) => r.min(2),
    }),
    defineField({
      name: 'pages',
      title: 'Pages (labels only — the pages themselves are fixed)',
      type: 'array',
      group: 'nav',
      of: [defineArrayMember({type: 'pageEntry'})],
      validation: (r) =>
        r.required().custom((value) => {
          const keys = ((value as {key?: string}[] | undefined) ?? []).map((p) => p.key)
          const expected = [...PAGE_KEYS]
          return keys.length === expected.length && keys.every((k, i) => k === expected[i])
            ? true
            : `Must contain exactly these pages in this order: ${expected.join(', ')}`
        }),
    }),
    defineField({name: 'menuScript', title: 'Menu script word', type: 'string', group: 'menu', initialValue: 'menu', validation: (r) => r.required().max(20)}),
    defineField({name: 'menuClose', title: 'Close label', type: 'string', group: 'menu', initialValue: 'Close ✕', validation: (r) => r.required().max(20)}),
    defineField({name: 'menuSocialsLabel', title: 'Socials label', type: 'string', group: 'menu', initialValue: 'follow on socials /', validation: (r) => r.required().max(40)}),
    defineField({name: 'menuPhoto', title: 'Menu photo (4:5, tilted polaroid)', type: 'imageWithAlt', group: 'menu', validation: (r) => r.required()}),
    defineField({name: 'leaderLeft', title: 'Countdown left caption', type: 'string', group: 'leader', initialValue: 'Vazeer Art', validation: (r) => r.required().max(30)}),
    defineField({name: 'leaderRight', title: 'Countdown right caption', type: 'string', group: 'leader', initialValue: 'Showreel 2026', validation: (r) => r.required().max(30)}),
    defineField({name: 'leaderSkip', title: 'Skip label', type: 'string', group: 'leader', initialValue: 'Skip →', validation: (r) => r.required().max(20)}),
    defineField({name: 'showIntro', title: 'Show 3-2-1 intro (once per visit)', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'showMarquee', title: 'Show marquee band', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'showGrain', title: 'Show film grain overlay', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'showRec', title: 'Show REC dot + timecode on project covers', type: 'boolean', group: 'toggles', initialValue: true}),
    defineField({name: 'seo', title: 'Default SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
