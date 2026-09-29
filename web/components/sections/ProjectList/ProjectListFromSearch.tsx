'use client'

import {useSearchParams} from 'next/navigation'
import {parseWorkFilter, type ProjectVM} from '@/lib/viewmodel/projects'
import {ProjectList} from './ProjectList'

type Props = {projects: ProjectVM[]; numberPrefix: string; cta: string}

/** Reads ?filter= on the client so /work stays a static page (spec §5.1). */
export function ProjectListFromSearch(props: Props) {
  const filter = parseWorkFilter(useSearchParams().get('filter'))
  return <ProjectList {...props} filter={filter} />
}
