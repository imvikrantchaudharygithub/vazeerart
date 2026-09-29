// web/components/sections/WorkHeader/WorkFilters.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {WorkFilters} from './WorkFilters'

let query = ''
vi.mock('next/navigation', () => ({useSearchParams: () => new URLSearchParams(query)}))

const labels = {all: 'All', cinematography: 'Cinematography', editing: 'Editing'}

describe('WorkFilters', () => {
  it('marks the chip named by ?filter= active', () => {
    query = 'filter=editing'
    render(<WorkFilters labels={labels} />)
    expect(screen.getAllByRole('link').map((l) => l.getAttribute('data-active'))).toEqual(['false', 'false', 'true'])
  })
  it('treats an unknown filter as all', () => {
    query = 'filter=bogus'
    render(<WorkFilters labels={labels} />)
    expect(screen.getByRole('link', {name: 'All'}).getAttribute('data-active')).toBe('true')
  })
})
