'use client'
// next.config.ts images.loaderFile — every next/image goes to the Sanity CDN (spec §8).
import {sanityImageLoader} from './image'
export default sanityImageLoader
