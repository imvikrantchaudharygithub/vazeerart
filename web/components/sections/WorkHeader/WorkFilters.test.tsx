// web/components/sections/WorkHeader/WorkFilters.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {WorkFilters} from './WorkFilters'

let query = ''
vi.mock('next/navigation', () => ({useSearchParams: () => new URLSearchParams(query)}))

const labels = {all: 'All', cinematography: 'Cinematography', editing: 'Editing'}

describe('WorkFilters', () => {
  it('renders three chips linking to ?filter= and marks the current one active', () => {
    query = 'filter=editing'
    render(<WorkFilters labels={labels} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work?filter=all', '/work?filter=cinematography', '/work?filter=editing'])
    expect(links.map((l) => l.getAttribute('data-active'))).toEqual(['false', 'false', 'true'])
  })
  it('gives every chip the asButton class and marks only the active chip aria-current=page', () => {
    query = 'filter=editing'
    render(<WorkFilters labels={labels} />)
    const links = screen.getAllByRole('link')
    links.forEach((a) => expect(a).toHaveClass('asButton'))
    expect(links.map((l) => l.getAttribute('aria-current'))).toEqual([null, null, 'page'])
  })
  it('treats an unknown filter as all', () => {
    query = 'filter=bogus'
    render(<WorkFilters labels={labels} />)
    expect(screen.getByRole('link', {name: 'All'}).getAttribute('data-active')).toBe('true')
  })
})
