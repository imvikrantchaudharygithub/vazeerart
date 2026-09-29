// studio/presentation/resolve.ts
import {defineDocuments, defineLocations, type PresentationPluginOptions} from 'sanity/presentation'
import {PAGE_ROUTES} from '../lib/constants'

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    {route: PAGE_ROUTES.home, type: 'homePage'},
    {route: PAGE_ROUTES.work, type: 'workPage'},
    {route: '/work/:slug', filter: `_type == "project" && slug.current == $slug`},
    {route: PAGE_ROUTES.frames, type: 'framesPage'},
    {route: PAGE_ROUTES.about, type: 'aboutPage'},
    {route: PAGE_ROUTES.contact, type: 'contactPage'},
  ]),
  locations: {
    siteSettings: defineLocations({message: 'Header, footer, menu and intro — used on every page', tone: 'caution'}),
    homePage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Home', href: PAGE_ROUTES.home}]})}),
    workPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Work & Reels', href: PAGE_ROUTES.work}]})}),
    framesPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Frames', href: PAGE_ROUTES.frames}]})}),
    aboutPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'About', href: PAGE_ROUTES.about}]})}),
    contactPage: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Contact', href: PAGE_ROUTES.contact}]})}),
    project: defineLocations({
      select: {title: 'title', slug: 'slug.current', creditOnly: 'creditOnly'},
      resolve: (doc) => ({
        locations: [
          ...(doc?.creditOnly ? [] : [{title: doc?.title || 'Untitled', href: `/work/${doc?.slug}`}]),
          {title: 'Work & Reels', href: PAGE_ROUTES.work},
          {title: 'Home (selected reels)', href: PAGE_ROUTES.home},
          {title: 'About (credits)', href: PAGE_ROUTES.about},
        ],
      }),
    }),
    frame: defineLocations({select: {}, resolve: () => ({locations: [{title: 'Frames', href: PAGE_ROUTES.frames}]})}),
  },
}
