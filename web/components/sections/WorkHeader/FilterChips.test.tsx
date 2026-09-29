// web/components/sections/WorkHeader/FilterChips.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {FilterChips} from './FilterChips'

const labels = {all: 'All', cinematography: 'Cinematography', editing: 'Editing'}

describe('FilterChips', () => {
  it('renders three chips linking to ?filter= and marks the current one active', () => {
    render(<FilterChips labels={labels} active="editing" />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work?filter=all', '/work?filter=cinematography', '/work?filter=editing'])
    expect(links.map((l) => l.getAttribute('data-active'))).toEqual(['false', 'false', 'true'])
  })
  it('gives every chip the asButton class and marks only the active chip aria-current=page', () => {
    render(<FilterChips labels={labels} active="editing" />)
    const links = screen.getAllByRole('link')
    links.forEach((a) => expect(a).toHaveClass('asButton'))
    expect(links.map((l) => l.getAttribute('aria-current'))).toEqual([null, null, 'page'])
  })
  it('marks All active for the static (pre-hydration) render', () => {
    render(<FilterChips labels={labels} active="all" />)
    expect(screen.getAllByRole('link').map((l) => l.getAttribute('data-active'))).toEqual(['true', 'false', 'false'])
  })
})
