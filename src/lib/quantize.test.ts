import { quantizeDuration } from './quantize'

describe('quantizeDuration', () => {
  const bpm = 120
  const beatMs = 60_000 / bpm // 500ms per quarter note

  it('quantizes a whole note duration', () => {
    expect(quantizeDuration(beatMs * 4, bpm)).toBe('w')
    expect(quantizeDuration(beatMs * 3.8, bpm)).toBe('w')
  })

  it('quantizes a half note duration', () => {
    expect(quantizeDuration(beatMs * 2, bpm)).toBe('h')
    expect(quantizeDuration(beatMs * 1.8, bpm)).toBe('h')
  })

  it('quantizes a quarter note duration', () => {
    expect(quantizeDuration(beatMs * 1, bpm)).toBe('q')
    expect(quantizeDuration(beatMs * 0.9, bpm)).toBe('q')
  })

  it('quantizes an eighth note duration', () => {
    expect(quantizeDuration(beatMs * 0.5, bpm)).toBe('8')
    expect(quantizeDuration(beatMs * 0.45, bpm)).toBe('8')
  })

  it('quantizes a sixteenth note duration', () => {
    expect(quantizeDuration(beatMs * 0.25, bpm)).toBe('16')
    expect(quantizeDuration(beatMs * 0.2, bpm)).toBe('16')
  })

  it('works with different BPMs', () => {
    // At 60 BPM, one beat = 1000ms
    expect(quantizeDuration(1000, 60)).toBe('q')
    expect(quantizeDuration(2000, 60)).toBe('h')
    expect(quantizeDuration(500, 60)).toBe('8')
  })

  it('rounds to nearest grid value', () => {
    // 600ms at 120 BPM (beat=500ms) — closer to q (500) than h (1000)
    expect(quantizeDuration(600, 120)).toBe('q')
    // 800ms — closer to h (1000) than q (500)
    expect(quantizeDuration(800, 120)).toBe('h')
  })

  it('handles very short durations', () => {
    expect(quantizeDuration(50, 120)).toBe('16')
  })

  it('handles very long durations', () => {
    expect(quantizeDuration(5000, 120)).toBe('w')
  })
})
