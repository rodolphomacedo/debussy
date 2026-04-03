import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { LoadingScreen } from './LoadingScreen'

// Mock audioEngine so tests don't hit real audio/CDN
vi.mock('../lib/audioEngine', () => ({
  initAudio: vi.fn(),
}))

import { initAudio } from '../lib/audioEngine'
const mockInitAudio = vi.mocked(initAudio)

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockInitAudio.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows progress bar advancing to 100%', () => {
    render(<LoadingScreen onComplete={vi.fn()} />)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows Start Playing button when progress reaches 100%', () => {
    render(<LoadingScreen onComplete={vi.fn()} />)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('button', { name: /start playing/i })).toBeInTheDocument()
  })

  it('calls onComplete when audio loads successfully', async () => {
    mockInitAudio.mockResolvedValue(undefined)
    const onComplete = vi.fn()
    render(<LoadingScreen onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(5000) })
    const btn = screen.getByRole('button', { name: /start playing/i })

    await act(async () => { fireEvent.click(btn) })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete even when audio loading fails (network error)', async () => {
    mockInitAudio.mockRejectedValue(new Error('CDN timeout'))
    const onComplete = vi.fn()
    render(<LoadingScreen onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(5000) })
    const btn = screen.getByRole('button', { name: /start playing/i })

    await act(async () => { fireEvent.click(btn) })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete even when audio loading times out', async () => {
    // initAudio never resolves — simulates hang/slow CDN
    mockInitAudio.mockReturnValue(new Promise(() => {}))
    const onComplete = vi.fn()
    render(<LoadingScreen onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(5000) })
    const btn = screen.getByRole('button', { name: /start playing/i })

    fireEvent.click(btn)

    // After 8 seconds timeout, onComplete should be called anyway
    await act(async () => { vi.advanceTimersByTime(8000) })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('shows loading state while audio is loading', async () => {
    let resolveAudio!: () => void
    mockInitAudio.mockReturnValue(new Promise<void>(res => { resolveAudio = res }))
    render(<LoadingScreen onComplete={vi.fn()} />)

    act(() => { vi.advanceTimersByTime(5000) })
    const btn = screen.getByRole('button', { name: /start playing/i })

    fireEvent.click(btn)
    expect(screen.getByText(/loading sounds/i)).toBeInTheDocument()

    await act(async () => { resolveAudio() })
  })
})
