import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Explore} from './Explore'

describe('Explore', () => {
  it('renders one lifting card per entry pointing at its page', () => {
    render(<Explore explore={{script: 'explore', heading: 'The work', cards: [
      {label: 'Work & Reels', sub: 'watch', href: '/work', image: null},
      {label: 'Frames', sub: 'browse', href: '/frames', image: null},
    ]}} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work', '/frames'])
    expect(links[0].className).toContain('hoverLift')
    expect(links[0]).toHaveTextContent('watch →')
  })
})
