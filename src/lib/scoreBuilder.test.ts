import { buildMeasureNotes, getDurationTicks } from './scoreBuilder'
import type { NoteData } from './demoScore'

describe('getDurationTicks', () => {
  it('returns correct ticks for standard durations', () => {
    expect(getDurationTicks('w')).toBe(4096 * 4)
    expect(getDurationTicks('h')).toBe(4096 * 2)
    expect(getDurationTicks('q')).toBe(4096)
    expect(getDurationTicks('8')).toBe(2048)
    expect(getDurationTicks('16')).toBe(1024)
  })

  it('returns correct ticks for dotted durations', () => {
    // dotted quarter = quarter + eighth = 4096 + 2048 = 6144
    expect(getDurationTicks('qd')).toBe(6144)
    // dotted half = half + quarter = 8192 + 4096 = 12288
    expect(getDurationTicks('hd')).toBe(12288)
  })

  it('returns correct ticks for rests (same as note durations)', () => {
    expect(getDurationTicks('8r')).toBe(2048)
    expect(getDurationTicks('qr')).toBe(4096)
  })

  it('handles VexFlow numeric durations', () => {
    expect(getDurationTicks('4')).toBe(4096)
    expect(getDurationTicks('4d')).toBe(6144)
    expect(getDurationTicks('2')).toBe(8192)
    expect(getDurationTicks('1')).toBe(16384)
  })
})

describe('buildMeasureNotes', () => {
  it('builds notes from NoteData array', () => {
    const notes: NoteData[] = [
      { keys: ['c/4'], duration: '8' },
      { keys: ['d/4'], duration: '8' },
      { keys: ['e/4'], duration: '8' },
    ]

    const staveNotes = buildMeasureNotes(notes, 'treble')
    expect(staveNotes).toHaveLength(3)
  })

  it('builds chord notes (multiple keys)', () => {
    const notes: NoteData[] = [
      { keys: ['a/2', 'e/3', 'a/3'], duration: '4d' },
    ]

    const staveNotes = buildMeasureNotes(notes, 'bass')
    expect(staveNotes).toHaveLength(1)
  })

  it('builds rests correctly', () => {
    const notes: NoteData[] = [
      { keys: ['c/4'], duration: '8r' },
    ]

    const staveNotes = buildMeasureNotes(notes, 'treble')
    expect(staveNotes).toHaveLength(1)
  })
})
