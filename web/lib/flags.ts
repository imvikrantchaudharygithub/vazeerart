// web/lib/flags.ts
/**
 * Build-time switches for parts of the site that exist but are not shown yet.
 * Flip the constant and redeploy; nothing here is read from the environment or from Sanity.
 */

/**
 * Project detail pages (/work/[slug]).
 * While false nothing on the site links to them: the /work covers and the "Watch & view frames"
 * CTA, the home reel cards and the About credit rows render as static elements. The route itself
 * stays reachable by URL so the pages can still be previewed before they are switched on.
 */
export const projectDetailPages = false
