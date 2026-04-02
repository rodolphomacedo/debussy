import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'
import type { Screen } from '../store/useAppStore'

// Mock heavy child components that rely on canvas/audio
vi.mock('./PianoKeyboard', () => ({
  PianoKeyboard: () => <div data-testid="piano-keyboard" />,
}))

vi.mock('./NavBar', () => ({
  NavBar: () => <nav data-testid="navbar" />,
}))

vi.mock('./OrnateFrame', () => ({
  OrnateFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const defaultProps = {
  onNavigate: vi.fn(),
  isConnected: false,
  deviceName: null,
  pressedNotes: new Set<number>(),
}

describe('HomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all three mode cards', () => {
    render(<HomeScreen {...defaultProps} />)

    expect(screen.getByText('Practice Sheet Music')).toBeInTheDocument()
    expect(screen.getByText('Play by Ear')).toBeInTheDocument()
    expect(screen.getByText('Capture Notes')).toBeInTheDocument()
  })

  it('renders correct call-to-action labels', () => {
    render(<HomeScreen {...defaultProps} />)

    expect(screen.getByText('OPEN LIBRARY')).toBeInTheDocument()
    expect(screen.getByText('START LISTENING')).toBeInTheDocument()
    expect(screen.getByText('START RECORDING')).toBeInTheDocument()
  })

  it('navigates to practice selection on Practice card click', async () => {
    const user = userEvent.setup()
    render(<HomeScreen {...defaultProps} />)

    await user.click(screen.getByText('Practice Sheet Music'))
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('practice' as Screen)
  })

  it('navigates to ear-training on Play by Ear card click', async () => {
    const user = userEvent.setup()
    render(<HomeScreen {...defaultProps} />)

    await user.click(screen.getByText('Play by Ear'))
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('ear-training' as Screen)
  })

  it('navigates to capture on Capture Notes card click', async () => {
    const user = userEvent.setup()
    render(<HomeScreen {...defaultProps} />)

    await user.click(screen.getByText('Capture Notes'))
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('capture' as Screen)
  })

  it('renders card descriptions', () => {
    render(<HomeScreen {...defaultProps} />)

    expect(screen.getByText('Browse library or continue learning.')).toBeInTheDocument()
    expect(screen.getByText('Listen, learn, and reproduce melodies by ear.')).toBeInTheDocument()
    expect(screen.getByText('Record and transcribe your playing.')).toBeInTheDocument()
  })
})
