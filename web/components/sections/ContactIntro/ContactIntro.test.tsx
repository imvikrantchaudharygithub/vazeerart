// web/components/sections/ContactIntro/ContactIntro.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ContactVM} from '@/lib/viewmodel/pagesContent'
import {ContactIntro} from './ContactIntro'

const contact = {script: 'get in', heading: 'Touch', intro: 'Say hi.', photo: null} as ContactVM
const management = {label: 'management', handle: '@m ↗', url: 'https://instagram.com/m'}
const dm = {label: 'dm me', handle: '@d ↗', url: 'https://instagram.com/d'}
const phone = {label: 'call', handle: '+91 95208 87694', url: 'tel:+919520887694'}

describe('ContactIntro', () => {
  it('shows management and DM rows only when there is no phone', () => {
    render(<ContactIntro contact={contact} settings={{management, dm, phone: null}}><form /></ContactIntro>)
    const links = screen.getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://instagram.com/m', 'https://instagram.com/d'])
    links.forEach((a) => expect(a).toHaveAttribute('target', '_blank'))
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Touch')
  })
  it('adds the phone as a third row that dials in the same tab', () => {
    render(<ContactIntro contact={contact} settings={{management, dm, phone}}><form /></ContactIntro>)
    const call = screen.getByRole('link', {name: /call/})
    expect(call).toHaveAttribute('href', 'tel:+919520887694')
    expect(call).toHaveTextContent('+91 95208 87694')
    expect(call).not.toHaveAttribute('target')
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })
})
