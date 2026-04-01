import { StaveNote, Dot } from 'vexflow'
import type { NoteData } from './demoScore'

/**
 * VexFlow resolution: a quarter note = 4096 ticks.
 */
const QUARTER_TICKS = 4096

const BASE_TICKS: Record<string, number> = {
  'w': QUARTER_TICKS * 4,   // whole
  '1': QUARTER_TICKS * 4,
  'h': QUARTER_TICKS * 2,   // half
  '2': QUARTER_TICKS * 2,
  'q': QUARTER_TICKS,       // quarter
  '4': QUARTER_TICKS,
  '8': QUARTER_TICKS / 2,   // eighth
  '16': QUARTER_TICKS / 4,  // sixteenth
  '32': QUARTER_TICKS / 8,  // thirty-second
}

/**
 * Calculate the tick count for a given VexFlow duration string.
 * Handles dotted ("qd", "hd") and rest ("8r", "qr") suffixes.
 */
export function getDurationTicks(duration: string): number {
  const isDotted = duration.endsWith('d')
  const isRest = duration.endsWith('r')

  let baseDur = duration
  if (isDotted || isRest) {
    baseDur = duration.slice(0, -1)
  }

  const ticks = BASE_TICKS[baseDur]
  if (ticks === undefined) {
    throw new Error(`Unknown duration: "${duration}" (base: "${baseDur}")`)
  }

  return isDotted ? ticks + ticks / 2 : ticks
}

/**
 * Parse a duration string into VexFlow-compatible components.
 * Returns the base duration string and whether it's dotted/rest.
 */
function parseDuration(duration: string): {
  vexDuration: string
  isDotted: boolean
} {
  const isDotted = duration.endsWith('d')
  const isRest = duration.endsWith('r')

  let baseDur = duration
  if (isDotted || isRest) {
    baseDur = duration.slice(0, -1)
  }

  // Map letter durations to VexFlow numeric ones
  const letterToNum: Record<string, string> = {
    'w': '1', 'h': '2', 'q': '4',
  }
  const numDur = letterToNum[baseDur] ?? baseDur

  const vexDuration = isRest ? `${numDur}r` : numDur
  return { vexDuration, isDotted }
}

/**
 * Build an array of VexFlow StaveNote objects from a NoteData array.
 */
export function buildMeasureNotes(
  notes: NoteData[],
  clef: 'treble' | 'bass',
): StaveNote[] {
  return notes.map(note => {
    const { vexDuration, isDotted } = parseDuration(note.duration)

    // For rests, VexFlow needs specific rest keys per clef
    const isRest = vexDuration.endsWith('r')
    const keys = isRest
      ? [clef === 'treble' ? 'b/4' : 'd/3']
      : note.keys

    const staveNote = new StaveNote({
      keys,
      duration: vexDuration,
      clef,
    })

    if (isDotted) {
      Dot.buildAndAttach([staveNote], { all: true })
    }

    return staveNote
  })
}
