import type {SchemaTypeDefinition} from 'sanity'
import {imageWithAlt} from './objects/imageWithAlt'
import {seo} from './objects/seo'
import {link} from './objects/link'
import {headingBlock} from './objects/headingBlock'
import {mediaSlot} from './objects/mediaSlot'
import {exploreCard} from './objects/exploreCard'
import {skill} from './objects/skill'
import {pageEntry} from './objects/pageEntry'
import {siteSettings} from './documents/siteSettings'
import {homePage} from './documents/homePage'
import {workPage} from './documents/workPage'
import {framesPage} from './documents/framesPage'
import {aboutPage} from './documents/aboutPage'
import {contactPage} from './documents/contactPage'

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

export const documentTypes: SchemaTypeDefinition[] = [
  siteSettings,
  homePage,
  workPage,
  framesPage,
  aboutPage,
  contactPage,
]

export const schemaTypes: SchemaTypeDefinition[] = [...objectTypes, ...documentTypes]
