import { render, screen } from '@testing-library/react'
import { PracticeScreen } from './PracticeScreen'
import { FUR_ELISE } from '../lib/demoScore'

// Mock audio dependencies
vi.mock('../lib/audioEngine', () => ({
  initAudio: vi.fn(),
  playNote: vi.fn(),
  releaseNote: vi.fn(),
  playErrorSound: vi.fn(),
  playHitSound: vi.fn(),
  playScheduledNote: vi.fn(),
  playMetronomeTick: vi.fn(),
  isAudioReady: vi.fn(() => false),
}))

vi.mock('tone', () => ({
  getTransport: vi.fn(() => ({
    bpm: { value: 72 },
    scheduleRepeat: vi.fn(() => 0),
    schedule: vi.fn(() => 0),
    start: vi.fn(),
    stop: vi.fn(),
    clear: vi.fn(),
    position: 0,
  })),
  getDraw: vi.fn(() => ({ schedule: vi.fn() })),
  start: vi.fn(),
  loaded: vi.fn(() => Promise.resolve()),
  Frequency: vi.fn(() => ({ toNote: vi.fn(() => 'C4') })),
  Sampler: vi.fn(() => ({ toDestination: vi.fn().mockReturnThis(), triggerAttack: vi.fn(), triggerRelease: vi.fn(), triggerAttackRelease: vi.fn() })),
  PolySynth: vi.fn(() => ({ toDestination: vi.fn().mockReturnThis(), triggerAttackRelease: vi.fn(), dispose: vi.fn() })),
  Synth: vi.fn(() => ({ toDestination: vi.fn().mockReturnThis(), triggerAttackRelease: vi.fn(), dispose: vi.fn() })),
  getContext: vi.fn(() => ({ lookAhead: 0 })),
}))

const defaultProps = {
  score: FUR_ELISE,
  bpm: 72,
  pressedNotes: new Set<number>(),
  lastNoteOn: null,
  onFinish: vi.fn(),
  onBack: vi.fn(),
}

describe('PracticeScreen', () => {
  it('renders the score (ScoreRenderer is in the DOM)', () => {
    render(<PracticeScreen {...defaultProps} />)
    expect(document.querySelector('.score-renderer')).toBeInTheDocument()
  })

  it('renders the Debussy logo', () => {
    render(<PracticeScreen {...defaultProps} />)
    expect(screen.getByText('Debussy')).toBeInTheDocument()
  })

  it('renders the song title', () => {
    render(<PracticeScreen {...defaultProps} />)
    expect(screen.getByText('Für Elise')).toBeInTheDocument()
  })

  it('renders composer name', () => {
    render(<PracticeScreen {...defaultProps} />)
    expect(screen.getByText('Ludwig van Beethoven')).toBeInTheDocument()
  })

  it('renders BPM badge', () => {
    render(<PracticeScreen {...defaultProps} />)
    expect(screen.getByText('72 BPM')).toBeInTheDocument()
  })

  it('renders play button', () => {
    render(<PracticeScreen {...defaultProps} />)
    // Play button has no label text, but the PracticeControls renders it
    expect(document.querySelector('.practice-play-btn')).toBeInTheDocument()
  })

  it('renders the piano keyboard', () => {
    render(<PracticeScreen {...defaultProps} />)
    expect(document.querySelector('.practice-keyboard')).toBeInTheDocument()
  })

  it('has exactly top section + keyboard — no intermediate section', () => {
    const { container } = render(<PracticeScreen {...defaultProps} />)
    const layout = container.querySelector('.practice-layout')
    expect(layout).toBeInTheDocument()
    // Direct children: top-section and keyboard only
    const children = layout ? Array.from(layout.children) : []
    const classNames = children.map(el => el.className)
    expect(classNames.some(c => c.includes('practice-top-section'))).toBe(true)
    expect(classNames.some(c => c.includes('practice-keyboard'))).toBe(true)
    expect(children).toHaveLength(2)
  })
})
