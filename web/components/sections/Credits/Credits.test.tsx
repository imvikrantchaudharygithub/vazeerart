// web/components/sections/Credits/Credits.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {Credits} from './Credits'

const p = (slug: string, creditOnly: boolean): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022', role: 'Editor', roleShort: 'Editor', category: 'editor',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly, n: creditOnly ? '' : '01', seo: {title: null, description: null, image: null},
})
const credits = {script: 'the', heading: 'Credits', imdbLabel: 'Full list on IMDb ↗', imdbUrl: 'https://imdb.com/x'}

describe('Credits', () => {
  it('lists every project; page projects link, credit-only rows do not', () => {
    render(<Credits credits={credits} projects={[p('a', false), p('b', true)]} />)
    expect(screen.getByRole('link', {name: /^2022A/})).toHaveAttribute('href', '/work/a')
    const rows = screen.getAllByTestId('credit-row')
    expect(rows).toHaveLength(2)
    expect(rows[1].tagName).toBe('DIV')
    expect(rows[1]).toHaveTextContent('music video · Editor')
    expect(screen.getByRole('link', {name: 'Full list on IMDb ↗'})).toHaveAttribute('href', 'https://imdb.com/x')
  })
})
