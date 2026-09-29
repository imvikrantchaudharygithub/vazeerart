import type {SchemaTypeDefinition} from 'sanity'
import {imageWithAlt} from './objects/imageWithAlt'
import {seo} from './objects/seo'
import {link} from './objects/link'
import {headingBlock} from './objects/headingBlock'
import {mediaSlot} from './objects/mediaSlot'
import {exploreCard} from './objects/exploreCard'
import {skill} from './objects/skill'
import {pageEntry} from './objects/pageEntry'

export const objectTypes: SchemaTypeDefinition[] = [
  imageWithAlt,
  seo,
  link,
  headingBlock,
  mediaSlot,
  exploreCard,
  skill,
  pageEntry,
]

export const documentTypes: SchemaTypeDefinition[] = []

export const schemaTypes: SchemaTypeDefinition[] = [...objectTypes, ...documentTypes]
