import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Hero} from './Hero'

const hero = {word: 'Vazeer', script: 'art', mainImage: null, polaroidLeft: null, polaroidRight: null}

describe('Hero', () => {
  it('renders the six parallax layers with the prototype depth and scroll factors', () => {
    const {container} = render(<Hero hero={hero} />)
    const layers = [...container.querySelectorAll('[data-depth]')].map((el) => [el.getAttribute('data-depth'), el.getAttribute('data-scroll')])
    expect(layers).toEqual([['0.2', '0.1'], ['0.4', '0.35'], ['1', '-0.12'], ['0.4', '0.35'], ['2', '-0.45'], ['1.6', '-0.25']])
  })
  it('marks every entrance animation with data-hero-anim and shows the word twice plus the script', () => {
    const {container} = render(<Hero hero={hero} />)
    expect(container.querySelectorAll('[data-hero-anim]').length).toBeGreaterThanOrEqual(7)
    expect(screen.getAllByText('Vazeer', {exact: false})).toHaveLength(2)
    expect(screen.getByText('art')).toBeInTheDocument()
  })
  it('renders the polaroid frames even when their media is empty', () => {
    const {container} = render(<Hero hero={hero} />)
    const left = container.querySelector('[data-depth="2"] > div')
    const right = container.querySelector('[data-depth="1.6"] > div')
    expect(left).not.toBeNull()
    expect(right).not.toBeNull()
    for (const frame of [left, right]) expect(frame!.childElementCount).toBe(0)
  })
})
