'use client'

import {useSearchParams} from 'next/navigation'
import {parseWorkFilter, type WorkFilter} from '@/lib/viewmodel/projects'
import {FilterChips} from './FilterChips'

export function WorkFilters({labels}: {labels: Record<WorkFilter, string>}) {
  const active = parseWorkFilter(useSearchParams().get('filter'))
  return <FilterChips labels={labels} active={active} />
}
