import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'mobileHero', title: 'Phone hero'},
    {name: 'intro', title: 'Intro'},
    {name: 'reels', title: 'Selected reels'},
    {name: 'explore', title: 'Explore'},
    {name: 'currently', title: 'Currently'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      description: 'The banner on computers and tablets. Phones show the Phone hero tab, which uses these values for any field left empty there.',
      fields: [
        defineField({name: 'word', title: 'Giant word', type: 'string', initialValue: 'Vazeer', validation: (r) => r.required().max(12)}),
        defineField({name: 'script', title: 'Cursive word (bottom-right of giant word)', type: 'string', initialValue: 'art', validation: (r) => r.required().max(10)}),
        defineField({name: 'mainImage', title: 'Main 16:9 frame', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({name: 'polaroidLeft', title: 'Left polaroid (3:4) — GIF or loop', type: 'mediaSlot', validation: (r) => r.required()}),
        defineField({name: 'polaroidRight', title: 'Right polaroid (16:10) — film still', type: 'mediaSlot', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'mobileHero',
      title: 'Phone hero',
      type: 'object',
      group: 'mobileHero',
      description: 'The banner phones see first: a round lens photo over the stacked name. A small scroll turns it into the amber split. Every field is optional; an empty field uses the Hero tab value.',
      fields: [
        defineField({
          name: 'word', title: 'Giant word (phones)', type: 'string', validation: (r) => r.max(12),
          description: 'Stacked in three pieces on the lens screen, e.g. Vazeer → VA / ZE / ER, then set in one line on the amber. Empty: the Hero giant word.',
        }),
        defineField({
          name: 'script', title: 'Cursive word (phones)', type: 'string', validation: (r) => r.max(10),
          description: 'The amber script word beside the last piece. Empty: the Hero cursive word.',
        }),
        defineField({
          name: 'image', title: 'Lens photo', type: 'imageWithAlt',
          description: 'Round lens on the first screen, then the full-width photo above the amber. A landscape photo works best; set the hotspot on the subject. Empty: the Hero main frame.',
        }),
        defineField({
          name: 'thumb', title: 'Small photo', type: 'mediaSlot',
          description: 'Tossed out of the lens onto the left edge after the scroll. Image, GIF or muted loop. Empty: the Hero left polaroid.',
        }),
      ],
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      group: 'intro',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: "hey, i'm", validation: (r) => r.required().max(30)}),
        defineField({name: 'heading', title: 'Heading', type: 'string', initialValue: 'Vazeer Art', validation: (r) => r.required().max(30)}),
        defineField({name: 'subline', title: 'Italic subline', type: 'string', validation: (r) => r.required().max(80)}),
        defineField({name: 'body', title: 'Paragraph', type: 'text', rows: 5, validation: (r) => r.required().max(600)}),
        defineField({name: 'ctaLabel', title: 'Button label', type: 'string', initialValue: 'More about me →', validation: (r) => r.required().max(40)}),
        defineField({name: 'imageA', title: 'Large image (4:5)', type: 'imageWithAlt', validation: (r) => r.required()}),
        defineField({name: 'imageB', title: 'Small tilted image (4:5)', type: 'imageWithAlt', validation: (r) => r.required()}),
      ],
    }),
    defineField({
      name: 'reels',
      title: 'Selected reels',
      type: 'object',
      group: 'reels',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'ctaLabel', title: 'Link label', type: 'string', initialValue: 'All work & reels →', validation: (r) => r.required().max(40)}),
      ],
    }),
    defineField({
      name: 'explore',
      title: 'Explore',
      type: 'object',
      group: 'explore',
      fields: [
        defineField({name: 'headingBlock', title: 'Heading', type: 'headingBlock', validation: (r) => r.required()}),
        defineField({name: 'cards', title: 'Cards', type: 'array', of: [defineArrayMember({type: 'exploreCard'})], validation: (r) => r.min(1).max(6)}),
      ],
    }),
    defineField({
      name: 'currently',
      title: 'Currently',
      type: 'object',
      group: 'currently',
      fields: [
        defineField({name: 'script', title: 'Script line', type: 'string', initialValue: 'currently', validation: (r) => r.required().max(30)}),
        defineField({name: 'heading', title: 'Heading', type: 'string', validation: (r) => r.required().max(80)}),
        defineField({name: 'body', title: 'Paragraph', type: 'text', rows: 4, validation: (r) => r.required().max(400)}),
        defineField({name: 'ctaLabel', title: 'Button label', type: 'string', initialValue: 'Start a project →', validation: (r) => r.required().max(40)}),
        defineField({name: 'bgImage', title: 'Full-bleed background', type: 'imageWithAlt', validation: (r) => r.required()}),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Home'})},
})
