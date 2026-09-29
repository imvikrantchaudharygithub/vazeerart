// web/components/sections/FrameGrabs/FrameGrabs.test.tsx
import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {FrameGrabs} from './FrameGrabs'

describe('FrameGrabs', () => {
  it('renders nothing when there are no grabs', () => {
    const {container} = render(<FrameGrabs grabs={[]} script="frame" heading="Grabs" title="Pagal" />)
    expect(container.innerHTML).toBe('')
  })
})
