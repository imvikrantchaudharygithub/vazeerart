// web/components/motion/VideoTrigger.test.tsx
import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {VideoTrigger} from './VideoTrigger'

const embed = {provider: 'youtube' as const, id: 'dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1'}

describe('VideoTrigger', () => {
  it('opens a lightbox with the embed, locks scroll, and closes on Escape restoring focus', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    const play = screen.getByRole('button', {name: 'Play Showreel'})
    fireEvent.click(play)
    const dialog = screen.getByRole('dialog', {name: 'Showreel'})
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(embed.embedUrl)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Close ✕'}))
    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(play)
  })

  it('closes on backdrop click but not on clicks inside the player', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    fireEvent.click(screen.getByTestId('lightbox-player'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('lightbox-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
