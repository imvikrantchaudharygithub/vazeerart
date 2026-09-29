// web/app/api/draft-mode/enable/route.ts
import {defineEnableDraftMode} from 'next-sanity/draft-mode'
import {client} from '@/lib/sanity/client'

const token = process.env.SANITY_API_READ_TOKEN

export const GET = token
  ? defineEnableDraftMode({client: client.withConfig({token})}).GET
  : async () => new Response('SANITY_API_READ_TOKEN is not set', {status: 503})
