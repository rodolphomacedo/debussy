import { midiToToneNote } from './audioEngine'

describe('midiToToneNote', () => {
  it('converts middle C (60) to C4', () => {
    expect(midiToToneNote(60)).toBe('C4')
  })

  it('converts A4 (69) to A4', () => {
    expect(midiToToneNote(69)).toBe('A4')
  })

  it('converts C#4 (61) to C#4', () => {
    expect(midiToToneNote(61)).toBe('C#4')
  })

  it('converts Bb3 — MIDI 58 to Bb3', () => {
    const note = midiToToneNote(58)
    // Tone.js may return Bb3 or A#3 depending on implementation
    expect(['Bb3', 'A#3']).toContain(note)
  })

  it('converts lowest piano key A0 (21)', () => {
    expect(midiToToneNote(21)).toBe('A0')
  })

  it('converts highest piano key C8 (108)', () => {
    expect(midiToToneNote(108)).toBe('C8')
  })

  it('converts all MIDI values 0-127 without throwing', () => {
    for (let i = 0; i <= 127; i++) {
      expect(() => midiToToneNote(i)).not.toThrow()
    }
  })
})
