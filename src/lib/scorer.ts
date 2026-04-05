import { vexFlowToMidi } from './midiToNote'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface PlayedNote {
  pitch: number      // MIDI number
  timestamp: number  // ms from start
}

export interface ExpectedNote {
  pitch: string      // VexFlow notation (e.g. "e/5")
  beat: number       // beat index
  beatMs: number     // ms from start when the beat occurs
  duration?: string  // VexFlow duration string (e.g. "q", "8"), used for listen mode playback
}

export interface ScoreResult {
  hits: number
  misses: number
  extras: number
  timingErrors: number[]
  percentScore: number
  grade: Grade
}

const PERFECT_WINDOW_MS = 150
const MAX_WINDOW_MS = 300
const EXTRA_PENALTY = 0.1

/**
 * Convert a VexFlow note name to MIDI number.
 * Re-exports vexFlowToMidi for convenience.
 */
export function noteNameToMidi(pitch: string): number {
  return vexFlowToMidi(pitch)
}

/**
 * Convert a percentage score to a letter grade.
 */
export function pctToGrade(pct: number): Grade {
  if (pct >= 90) return 'A'
  if (pct >= 75) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 45) return 'D'
  return 'F'
}

/**
 * Evaluate a performance by comparing expected notes with played notes.
 *
 * Scoring rules:
 * - Correct pitch within ±150ms → perfect hit (weight 1.0)
 * - Correct pitch within ±300ms → partial hit (weight 0.5)
 * - Expected note not matched → miss (weight 0.0)
 * - Played note not matched → extra (penalty -0.1)
 */
export function evaluatePerformance(
  expected: ExpectedNote[],
  played: PlayedNote[],
): ScoreResult {
  const totalWeight = expected.length
  let earnedWeight = 0
  const matched = new Set<number>()
  const timingErrors: number[] = []

  for (const exp of expected) {
    const expMidi = noteNameToMidi(exp.pitch)

    const matchIdx = played.findIndex((p, i) =>
      !matched.has(i) &&
      p.pitch === expMidi &&
      Math.abs(p.timestamp - exp.beatMs) < MAX_WINDOW_MS,
    )

    if (matchIdx >= 0) {
      const timingErr = Math.abs(played[matchIdx].timestamp - exp.beatMs)
      timingErrors.push(timingErr)
      earnedWeight += timingErr <= PERFECT_WINDOW_MS ? 1.0 : 0.5
      matched.add(matchIdx)
    }
  }

  const extras = played.length - matched.size
  earnedWeight = Math.max(0, earnedWeight - extras * EXTRA_PENALTY)

  const pct = totalWeight > 0
    ? Math.round((earnedWeight / totalWeight) * 100)
    : 0

  return {
    hits: matched.size,
    misses: expected.length - matched.size,
    extras,
    timingErrors,
    percentScore: pct,
    grade: pctToGrade(pct),
  }
}
