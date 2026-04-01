import { midiToVexFlow, vexFlowToMidi, midiToNoteName } from './midiToNote'

describe('midiToVexFlow', () => {
  it('converts middle C (60) to c/4', () => {
    expect(midiToVexFlow(60)).toBe('c/4')
  })

  it('converts C#4 (61) to c#/4', () => {
    expect(midiToVexFlow(61)).toBe('c#/4')
  })

  it('converts D4 (62) to d/4', () => {
    expect(midiToVexFlow(62)).toBe('d/4')
  })

  it('converts B4 (71) to b/4', () => {
    expect(midiToVexFlow(71)).toBe('b/4')
  })

  it('converts C5 (72) to c/5', () => {
    expect(midiToVexFlow(72)).toBe('c/5')
  })

  it('converts A0 (21) — lowest piano key', () => {
    expect(midiToVexFlow(21)).toBe('a/0')
  })

  it('converts C8 (108) — highest piano key', () => {
    expect(midiToVexFlow(108)).toBe('c/8')
  })

  it('converts MIDI 0 to c/-1', () => {
    expect(midiToVexFlow(0)).toBe('c/-1')
  })

  it('converts MIDI 127 to g/9', () => {
    expect(midiToVexFlow(127)).toBe('g/9')
  })

  it('converts all sharps correctly', () => {
    // C#4=61, D#4=63, F#4=66, G#4=68, A#4=70
    expect(midiToVexFlow(63)).toBe('d#/4')
    expect(midiToVexFlow(66)).toBe('f#/4')
    expect(midiToVexFlow(68)).toBe('g#/4')
    expect(midiToVexFlow(70)).toBe('a#/4')
  })

  it('throws for out-of-range MIDI numbers', () => {
    expect(() => midiToVexFlow(-1)).toThrow()
    expect(() => midiToVexFlow(128)).toThrow()
  })
})

describe('vexFlowToMidi', () => {
  it('converts c/4 to 60', () => {
    expect(vexFlowToMidi('c/4')).toBe(60)
  })

  it('converts c#/4 to 61', () => {
    expect(vexFlowToMidi('c#/4')).toBe(61)
  })

  it('converts a/0 to 21', () => {
    expect(vexFlowToMidi('a/0')).toBe(21)
  })

  it('converts c/8 to 108', () => {
    expect(vexFlowToMidi('c/8')).toBe(108)
  })

  it('handles negative octave c/-1 to 0', () => {
    expect(vexFlowToMidi('c/-1')).toBe(0)
  })

  it('is the inverse of midiToVexFlow for all valid MIDI numbers', () => {
    for (let midi = 0; midi <= 127; midi++) {
      expect(vexFlowToMidi(midiToVexFlow(midi))).toBe(midi)
    }
  })
})

describe('midiToNoteName', () => {
  it('returns human-readable note name', () => {
    expect(midiToNoteName(60)).toBe('C4')
    expect(midiToNoteName(61)).toBe('C#4')
    expect(midiToNoteName(69)).toBe('A4')
    expect(midiToNoteName(21)).toBe('A0')
  })
})
