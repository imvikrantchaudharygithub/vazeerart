import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {Marquee} from './Marquee'

describe('Marquee', () => {
  it('repeats the word list twice for a seamless loop', () => {
    render(<Marquee words={['Films', 'Colour']} />)
    expect(screen.getAllByText('Films', {exact: false})).toHaveLength(2)
    expect(screen.getAllByText('&')).toHaveLength(4)
  })
  it('renders nothing for an empty list', () => {
    const {container} = render(<Marquee words={[]} />)
    expect(container.innerHTML).toBe('')
  })
})
