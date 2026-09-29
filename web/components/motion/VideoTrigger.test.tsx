// web/components/motion/VideoTrigger.test.tsx
import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {VideoTrigger} from './VideoTrigger'

const embed = {provider: 'youtube' as const, id: 'dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1'}

describe('VideoTrigger', () => {
  it('marks the play button as a looping motion element', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    expect(screen.getByRole('button', {name: 'Play Showreel'})).toHaveAttribute('data-motion', 'loop')
  })

  it('opens a lightbox with the embed, locks scroll, and closes on Escape restoring focus', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    const play = screen.getByRole('button', {name: 'Play Showreel'})
    fireEvent.click(play)
    const dialog = screen.getByRole('dialog', {name: 'Showreel'})
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(embed.embedUrl)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Close'}))
    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.querySelector('iframe')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(play)
  })

  it('restores the previous body overflow instead of clearing it', () => {
    document.body.style.overflow = 'auto'
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(window, {key: 'Escape'})
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })

  it('portals the dialog to <body> and the dialog contains its Close button', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    const dialog = screen.getByRole('dialog', {name: 'Showreel'})
    expect(dialog.parentElement).toBe(document.body)
    expect(dialog).toContainElement(screen.getByRole('button', {name: 'Close'}))
  })

  it('closes on backdrop click but not on clicks inside the player', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    fireEvent.click(screen.getByTestId('lightbox-player'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('lightbox-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes from the Close button', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    fireEvent.click(screen.getByRole('button', {name: 'Close'}))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps Tab inside the dialog, including when focus has left it', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    const closeButton = screen.getByRole('button', {name: 'Close'})
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    expect(document.activeElement).toBe(closeButton)
    fireEvent.keyDown(window, {key: 'Tab'})
    expect(document.activeElement).toBe(iframe)
    fireEvent.keyDown(window, {key: 'Tab'})
    expect(document.activeElement).toBe(closeButton)
    ;(document.activeElement as HTMLElement).blur()
    expect(document.activeElement).toBe(document.body)
    fireEvent.keyDown(window, {key: 'Tab'})
    expect(document.activeElement).toBe(closeButton)
  })

  it('wraps Shift+Tab from the first control to the last', () => {
    render(<VideoTrigger embed={embed} title="Showreel" />)
    fireEvent.click(screen.getByRole('button', {name: 'Play Showreel'}))
    const closeButton = screen.getByRole('button', {name: 'Close'})
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    iframe.focus()
    expect(document.activeElement).toBe(iframe)
    fireEvent.keyDown(window, {key: 'Tab', shiftKey: true})
    expect(document.activeElement).toBe(closeButton)
    fireEvent.keyDown(window, {key: 'Tab', shiftKey: true})
    expect(document.activeElement).toBe(iframe)
  })
})
