// web/components/ui/ProjectAnchor.tsx
import Link from 'next/link'
import type {AnchorHTMLAttributes, ReactNode} from 'react'
import type {ProjectLink} from '@/lib/viewmodel/projects'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & {link: ProjectLink; children: ReactNode}

/** A project page goes through next/link; a video opens on its own site in a new tab. */
export function ProjectAnchor({link, children, ...rest}: Props) {
  return link.external ? (
    <a href={link.href} target="_blank" rel="noreferrer" {...rest}>{children}</a>
  ) : (
    <Link href={link.href} {...rest}>{children}</Link>
  )
}
