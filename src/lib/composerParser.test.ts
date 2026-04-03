import { parseNoteText, noteDataToText } from './composerParser'

describe('parseNoteText', () => {
  it('parses a single quarter note', () => {
    const result = parseNoteText('C4/q', 'treble')
    expect(result).toEqual([{ keys: ['c/4'], duration: 'q' }])
  })

  it('parses an eighth note', () => {
    const result = parseNoteText('E5/8', 'treble')
    expect(result).toEqual([{ keys: ['e/5'], duration: '8' }])
  })

  it('parses a half note', () => {
    const result = parseNoteText('G3/h', 'bass')
    expect(result).toEqual([{ keys: ['g/3'], duration: 'h' }])
  })

  it('parses a whole note', () => {
    const result = parseNoteText('A4/w', 'treble')
    expect(result).toEqual([{ keys: ['a/4'], duration: 'w' }])
  })

  it('parses a sixteenth note', () => {
    const result = parseNoteText('F4/16', 'treble')
    expect(result).toEqual([{ keys: ['f/4'], duration: '16' }])
  })

  it('parses a dotted quarter', () => {
    const result = parseNoteText('C4/qd', 'treble')
    expect(result).toEqual([{ keys: ['c/4'], duration: 'qd' }])
  })

  it('parses a dotted eighth', () => {
    const result = parseNoteText('D4/8d', 'treble')
    expect(result).toEqual([{ keys: ['d/4'], duration: '8d' }])
  })

  it('parses a sharp note', () => {
    const result = parseNoteText('D#5/8', 'treble')
    expect(result).toEqual([{ keys: ['d#/5'], duration: '8' }])
  })

  it('parses a flat note', () => {
    const result = parseNoteText('Bb3/q', 'treble')
    expect(result).toEqual([{ keys: ['bb/3'], duration: 'q' }])
  })

  it('parses Eb correctly', () => {
    const result = parseNoteText('Eb4/h', 'treble')
    expect(result).toEqual([{ keys: ['eb/4'], duration: 'h' }])
  })

  it('parses treble rest', () => {
    const result = parseNoteText('rest/q', 'treble')
    expect(result).toEqual([{ keys: ['b/4'], duration: 'qr' }])
  })

  it('parses bass rest', () => {
    const result = parseNoteText('rest/8', 'bass')
    expect(result).toEqual([{ keys: ['d/3'], duration: '8r' }])
  })

  it('parses a chord', () => {
    const result = parseNoteText('(C4,E4,G4)/q', 'treble')
    expect(result).toEqual([{ keys: ['c/4', 'e/4', 'g/4'], duration: 'q' }])
  })

  it('parses chord with accidentals', () => {
    const result = parseNoteText('(A2,E3,A3)/qd', 'bass')
    expect(result).toEqual([{ keys: ['a/2', 'e/3', 'a/3'], duration: 'qd' }])
  })

  it('parses multiple notes separated by commas', () => {
    const result = parseNoteText('C4/q, D4/8, E4/8', 'treble')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ keys: ['c/4'], duration: 'q' })
    expect(result[1]).toEqual({ keys: ['d/4'], duration: '8' })
    expect(result[2]).toEqual({ keys: ['e/4'], duration: '8' })
  })

  it('parses multiple notes separated by spaces', () => {
    const result = parseNoteText('E5/8 D#5/8 E5/8', 'treble')
    expect(result).toHaveLength(3)
  })

  it('ignores extra whitespace', () => {
    const result = parseNoteText('  C4/q  ,  E4/8  ', 'treble')
    expect(result).toHaveLength(2)
  })

  it('throws on unknown duration', () => {
    expect(() => parseNoteText('C4/x', 'treble')).toThrow()
  })

  it('throws on invalid pitch', () => {
    expect(() => parseNoteText('Z4/q', 'treble')).toThrow()
  })

  it('throws on missing slash', () => {
    expect(() => parseNoteText('C4q', 'treble')).toThrow()
  })
})

describe('noteDataToText', () => {
  it('converts a single note back to text', () => {
    const result = noteDataToText([{ keys: ['c/4'], duration: 'q' }])
    expect(result).toBe('C4/q')
  })

  it('converts an eighth note', () => {
    const result = noteDataToText([{ keys: ['e/5'], duration: '8' }])
    expect(result).toBe('E5/8')
  })

  it('converts a dotted note', () => {
    const result = noteDataToText([{ keys: ['c/4'], duration: 'qd' }])
    expect(result).toBe('C4/qd')
  })

  it('converts a rest', () => {
    const result = noteDataToText([{ keys: ['b/4'], duration: 'qr' }])
    expect(result).toBe('rest/q')
  })

  it('converts a chord', () => {
    const result = noteDataToText([{ keys: ['c/4', 'e/4', 'g/4'], duration: 'q' }])
    expect(result).toBe('(C4,E4,G4)/q')
  })

  it('converts multiple notes', () => {
    const notes = [
      { keys: ['e/5'], duration: '8' },
      { keys: ['d#/5'], duration: '8' },
      { keys: ['e/5'], duration: '8' },
    ]
    expect(noteDataToText(notes)).toBe('E5/8, D#5/8, E5/8')
  })

  it('round-trips: parse then serialize equals normalized input', () => {
    const input = 'C4/q, E4/8, G4/8'
    const parsed = parseNoteText(input, 'treble')
    const output = noteDataToText(parsed)
    expect(output).toBe(input)
  })
})
