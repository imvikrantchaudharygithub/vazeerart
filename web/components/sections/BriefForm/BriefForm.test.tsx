// web/components/sections/BriefForm/BriefForm.test.tsx
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {BriefForm} from './BriefForm'

const form = {heading: 'The brief', typeQuestion: 'what are we making?', types: ['Music video', 'Commercial'], nameLabel: 'your name', contactLabel: 'email or phone', datesLabel: 'dates & location', briefLabel: 'the idea, references, budget', submitLabel: 'Send it →'}
const success = {script: 'that’s a wrap', body: 'Thanks — soon.', resetLabel: 'Send another'}

afterEach(() => vi.unstubAllGlobals())

function fill() {
  fireEvent.change(screen.getByLabelText('your name'), {target: {value: 'Asha'}})
  fireEvent.change(screen.getByLabelText('email or phone'), {target: {value: 'asha@example.com'}})
}

describe('BriefForm', () => {
  it('selects the first type by default, posts JSON, and shows the wrap state; reset returns to the form', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ok: true}), {status: 200}))
    vi.stubGlobal('fetch', fetchMock)
    render(<BriefForm form={form} success={success} />)
    expect(screen.getByRole('button', {name: 'Music video'}).getAttribute('data-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', {name: 'Commercial'}))
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    await waitFor(() => expect(screen.getByText('that’s a wrap')).toBeInTheDocument())
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toMatchObject({type: 'Commercial', name: 'Asha', contact: 'asha@example.com', website: ''})
    fireEvent.click(screen.getByRole('button', {name: 'Send another'}))
    expect(screen.getByRole('button', {name: 'Send it →'})).toBeInTheDocument()
  })

  it('shows server field errors inline', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ok: false, errors: {contact: 'Add an email or phone'}}), {status: 400})))
    render(<BriefForm form={form} success={success} />)
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    await waitFor(() => expect(screen.getByText('Add an email or phone')).toBeInTheDocument())
  })

  it('keeps the text and shows a retry message when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    render(<BriefForm form={form} success={success} />)
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument())
    expect((screen.getByLabelText('your name') as HTMLInputElement).value).toBe('Asha')
  })

  it('shows a type error under the chips', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ok: false, errors: {type: 'Choose one of the options'}}), {status: 400})))
    render(<BriefForm form={form} success={success} />)
    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Choose one of the options')
    const group = screen.getByRole('group', {name: form.typeQuestion})
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['Music video', 'Commercial'])
    expect(group.nextElementSibling).toBe(alert)
  })

  it('marks a field invalid and announces success', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => new Response(JSON.stringify({ok: false, errors: {name: 'Please add your name'}}), {status: 400}))
      .mockImplementationOnce(async () => new Response(JSON.stringify({ok: true}), {status: 200}))
    vi.stubGlobal('fetch', fetchMock)
    render(<BriefForm form={form} success={success} />)
    expect(screen.getByLabelText('your name')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText('your name')).not.toHaveAttribute('aria-describedby')
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Please add your name')
    const input = screen.getByLabelText('your name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(alert.id).not.toBe('')
    expect(input.getAttribute('aria-describedby')).toBe(alert.id)
    expect(screen.getByLabelText('email or phone')).not.toHaveAttribute('aria-invalid')

    fill()
    fireEvent.click(screen.getByRole('button', {name: 'Send it →'}))
    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(success.body)
    expect(document.activeElement).toBe(screen.getByRole('button', {name: success.resetLabel}))
  })

  it('exposes the selected chip', () => {
    render(<BriefForm form={form} success={success} />)
    const group = screen.getByRole('group', {name: form.typeQuestion})
    const [first, second] = within(group).getAllByRole('button')
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(second).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(second).toHaveAttribute('aria-pressed', 'true')
  })
})
