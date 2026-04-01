const NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'] as const

const NOTE_NAMES_UPPER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/**
 * Convert a MIDI number (0–127) to VexFlow pitch notation (e.g. "c/4", "f#/5").
 */
export function midiToVexFlow(midi: number): string {
  if (midi < 0 || midi > 127) {
    throw new RangeError(`MIDI number must be 0–127, got ${midi}`)
  }
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}/${octave}`
}

/**
 * Convert VexFlow pitch notation (e.g. "c/4") back to a MIDI number.
 */
export function vexFlowToMidi(vexNote: string): number {
  const [noteName, octaveStr] = vexNote.split('/')
  const noteIndex = NOTE_NAMES.indexOf(noteName as typeof NOTE_NAMES[number])
  if (noteIndex === -1) {
    throw new Error(`Unknown note name: "${noteName}"`)
  }
  const octave = parseInt(octaveStr, 10)
  return (octave + 1) * 12 + noteIndex
}

/**
 * Convert a MIDI number to a human-readable note name (e.g. 60 → "C4").
 */
export function midiToNoteName(midi: number): string {
  if (midi < 0 || midi > 127) {
    throw new RangeError(`MIDI number must be 0–127, got ${midi}`)
  }
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES_UPPER[noteIndex]}${octave}`
}
