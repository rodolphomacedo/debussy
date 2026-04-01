/**
 * Für Elise — first 8 bars in 3/8 time.
 *
 * The famous opening section uses 3/8 (not 3/4) with eighth-note pulse.
 * Treble: melody (right hand). Bass: arpeggiated accompaniment (left hand).
 *
 * Each note has:
 * - keys: VexFlow pitch notation (e.g. "e/5")
 * - duration: VexFlow duration string ("8" = eighth, "q" = quarter, "16" = sixteenth)
 */

export interface NoteData {
  keys: string[]
  duration: string
}

export interface MeasureData {
  treble: NoteData[]
  bass: NoteData[]
}

export interface ScoreData {
  title: string
  composer: string
  timeSignature: string
  numBeats: number
  beatValue: number
  bpm: number
  measures: MeasureData[]
}

/**
 * Für Elise — 8 bars.
 *
 * Bars 1-2: The iconic E5-D#5-E5-D#5-E5-B4-D5-C5 motif
 * Bars 3-4: A minor resolution, then repeat
 * Bars 5-8: Repeat of bars 1-4
 *
 * Bass uses simple arpeggiated A minor / E major patterns.
 */
export const FUR_ELISE: ScoreData = {
  title: 'Für Elise',
  composer: 'Ludwig van Beethoven',
  timeSignature: '3/8',
  numBeats: 3,
  beatValue: 8,
  bpm: 72,
  measures: [
    // Bar 1: E5 D#5 E5 (three eighth notes — the pickup/opening)
    {
      treble: [
        { keys: ['e/5'], duration: '8' },
        { keys: ['d#/5'], duration: '8' },
        { keys: ['e/5'], duration: '8' },
      ],
      bass: [
        { keys: ['a/2', 'e/3', 'a/3'], duration: '4d' },
      ],
    },
    // Bar 2: D#5 E5 B4
    {
      treble: [
        { keys: ['d#/5'], duration: '8' },
        { keys: ['e/5'], duration: '8' },
        { keys: ['b/4'], duration: '8' },
      ],
      bass: [
        { keys: ['e/2', 'g#/3', 'b/3'], duration: '4d' },
      ],
    },
    // Bar 3: D5 C5 A4
    {
      treble: [
        { keys: ['d/5'], duration: '8' },
        { keys: ['c/5'], duration: '8' },
        { keys: ['a/4'], duration: '8' },
      ],
      bass: [
        { keys: ['a/2', 'e/3', 'a/3'], duration: '4d' },
      ],
    },
    // Bar 4: B4 rest rest (quarter + eighth rest, simplified as quarter + eighth)
    {
      treble: [
        { keys: ['c/4'], duration: '8r' },
        { keys: ['e/4'], duration: '8' },
        { keys: ['a/4'], duration: '8' },
      ],
      bass: [
        { keys: ['e/2', 'g#/3', 'b/3'], duration: '4d' },
      ],
    },
    // Bar 5: B4 rest E4 (resolution, then restart)
    {
      treble: [
        { keys: ['b/4'], duration: '8' },
        { keys: ['c/4'], duration: '8r' },
        { keys: ['e/5'], duration: '8' },
      ],
      bass: [
        { keys: ['a/2', 'e/3', 'a/3'], duration: '4d' },
      ],
    },
    // Bar 6: E5 D#5 E5 (repeat of motif)
    {
      treble: [
        { keys: ['e/5'], duration: '8' },
        { keys: ['d#/5'], duration: '8' },
        { keys: ['e/5'], duration: '8' },
      ],
      bass: [
        { keys: ['e/2', 'g#/3', 'b/3'], duration: '4d' },
      ],
    },
    // Bar 7: D#5 E5 B4
    {
      treble: [
        { keys: ['d#/5'], duration: '8' },
        { keys: ['e/5'], duration: '8' },
        { keys: ['b/4'], duration: '8' },
      ],
      bass: [
        { keys: ['a/2', 'e/3', 'a/3'], duration: '4d' },
      ],
    },
    // Bar 8: D5 C5 A4 (ending the phrase)
    {
      treble: [
        { keys: ['d/5'], duration: '8' },
        { keys: ['c/5'], duration: '8' },
        { keys: ['a/4'], duration: '8' },
      ],
      bass: [
        { keys: ['a/2', 'e/3', 'a/3'], duration: '4d' },
      ],
    },
  ],
}
