// web/components/sections/Credits/Credits.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {Credits} from './Credits'

const p = (slug: string, creditOnly: boolean): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022', role: 'Editor', roleShort: 'Editor', category: 'editor',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly, n: creditOnly ? '' : '01', seo: {title: null, description: null, image: null},
})
const credits = {script: 'the', heading: 'Credits'}

describe('Credits', () => {
  it('lists every project; page projects link, credit-only rows do not', () => {
    render(<Credits credits={credits} projects={[p('a', false), p('b', true)]} linkToDetail />)
    expect(screen.getByRole('heading', {level: 2})).toHaveTextContent('Credits')
    expect(screen.getByRole('link', {name: /^2022A/})).toHaveAttribute('href', '/work/a')
    const rows = screen.getAllByTestId('credit-row')
    expect(rows).toHaveLength(2)
    expect(rows[1].tagName).toBe('DIV')
    expect(rows[1]).toHaveTextContent('music video · Editor')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
  it('renders every row static, with no links at all, while project pages are hidden', () => {
    render(<Credits credits={credits} projects={[p('a', false), p('b', true)]} linkToDetail={false} />)
    const rows = screen.getAllByTestId('credit-row')
    expect(rows.map((r) => r.tagName)).toEqual(['DIV', 'DIV'])
    expect(rows[0]).toHaveTextContent('2022A')
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
  it('opens the video in a new tab from a row while project pages are hidden; credit-only rows never link', () => {
    const video = {...p('a', false), videoUrl: 'https://vimeo.com/123456789/abcdef1234'}
    render(<Credits credits={credits} projects={[video, {...p('b', true), videoUrl: 'https://youtu.be/itc0Zko4PC0'}]} linkToDetail={false} />)
    const rows = screen.getAllByTestId('credit-row')
    expect(rows[0].tagName).toBe('A')
    expect(rows[0]).toHaveAttribute('href', 'https://vimeo.com/123456789/abcdef1234')
    expect(rows[0]).toHaveAttribute('target', '_blank')
    expect(rows[1].tagName).toBe('DIV')
  })
})
