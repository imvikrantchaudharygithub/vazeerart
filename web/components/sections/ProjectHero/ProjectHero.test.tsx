// web/components/sections/ProjectHero/ProjectHero.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import type {ImageVM} from '@/lib/viewmodel/types'
import {ProjectHero} from './ProjectHero'

const labels = {backLabel: '← Work & reels', reelPrefix: 'reel no.', roleLabel: 'role', formatLabel: 'format', yearLabel: 'year', aspectLabel: '2.39 : 1', grabsScript: 'frame', grabsHeading: 'Grabs', upNextScript: 'up next'}
const project: ProjectVM = {
  id: 'p', slug: 'pagal', title: 'Pagal', format: 'Music Video', formatLower: 'music video', year: '2022', role: 'Director of Photography', roleShort: 'DOP', category: 'dop',
  cover: null, frameGrabs: [], videoUrl: 'https://youtu.be/dQw4w9WgXcQ', showOnHome: true, creditOnly: false, n: '01', seo: {title: null, description: null, image: null},
}

const cover: ImageVM = {
  assetId: 'image-abc123-1400x900-jpg', url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg',
  width: 1400, height: 900, extension: 'jpg', lqip: null, alt: '', hotspot: null, crop: null,
}

describe('ProjectHero', () => {
  it('shows the numbered title, HUD with a live timecode, meta row, and a play button', () => {
    render(<ProjectHero project={project} labels={labels} showRec />)
    expect(screen.getByText('reel no. 01')).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Pagal')
    expect(screen.getByText('(music video, 2022)')).toBeInTheDocument()
    expect(document.querySelector('[data-tc]')?.textContent).toBe('00:00:00:00')
    expect(screen.getByText('2.39 : 1')).toBeInTheDocument()
    expect(screen.getByText('Director of Photography')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Play Pagal'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: '← Work & reels'})).toHaveAttribute('href', '/work')
  })
  it('hides the REC group when showRec is false and the play button without a video', () => {
    render(<ProjectHero project={{...project, videoUrl: null}} labels={labels} showRec={false} />)
    expect(document.querySelector('[data-tc]')).toBeNull()
    expect(screen.queryByRole('button', {name: /Play/})).toBeNull()
  })
  it('falls back to a generated alt when the cover has none, and keeps an editor-written alt', () => {
    const {unmount} = render(<ProjectHero project={{...project, cover}} labels={labels} showRec />)
    expect(screen.getByRole('img', {name: 'Key frame from Pagal'})).toBeInTheDocument()
    expect(document.querySelector('img[alt="Key frame from Pagal"]')).not.toBeNull()
    unmount()
    render(<ProjectHero project={{...project, cover: {...cover, alt: 'Riverbank at dusk'}}} labels={labels} showRec />)
    expect(screen.getByRole('img', {name: 'Riverbank at dusk'})).toBeInTheDocument()
    expect(screen.queryByRole('img', {name: 'Key frame from Pagal'})).toBeNull()
  })
  it('tags the Ken Burns wrapper and the REC dot as looping motion', () => {
    const {unmount} = render(<ProjectHero project={{...project, videoUrl: null}} labels={labels} showRec />)
    expect(document.querySelectorAll('[data-motion="loop"]').length).toBeGreaterThanOrEqual(2)
    expect(document.querySelectorAll('[data-motion="loop"]')).toHaveLength(2)
    unmount()
    render(<ProjectHero project={{...project, videoUrl: null}} labels={labels} showRec={false} />)
    expect(document.querySelectorAll('[data-motion="loop"]')).toHaveLength(1)
  })
})
