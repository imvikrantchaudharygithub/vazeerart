// web/lib/flags.ts
/**
 * Build-time switches for parts of the site that exist but are not shown yet.
 * Flip the constant and redeploy; nothing here is read from the environment or from Sanity.
 */

/**
 * Project detail pages (/work/[slug]).
 * While false nothing on the site links to them. A project's cover, title (Work page), reel card (home) and credit
 * row (About) open its YouTube / Vimeo video in a new tab instead (lib/viewmodel/projects.ts projectLink); a
 * project without a video is static, and the "Watch & view frames" CTA is not rendered. The route itself stays
 * reachable by URL so the pages can still be previewed before they are switched on.
 */
export const projectDetailPages = false
