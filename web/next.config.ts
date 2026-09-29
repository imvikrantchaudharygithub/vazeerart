// web/next.config.ts
import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Spec §8: every next/image URL is built by the Sanity CDN loader; Vercel's optimizer is never reachable.
  images: {loader: 'custom', loaderFile: './lib/sanity/image-loader.ts'},
}

export default nextConfig
