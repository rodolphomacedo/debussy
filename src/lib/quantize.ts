type VFDuration = 'w' | 'h' | 'q' | '8' | '16'

/**
 * Quantize a raw duration (in ms) to the closest VexFlow duration
 * based on the current BPM. This snaps freeform playing to the
 * nearest musical grid value.
 */
export function quantizeDuration(durationMs: number, bpm: number): VFDuration {
  const beatMs = 60_000 / bpm

  const grids: [VFDuration, number][] = [
    ['w',  beatMs * 4],
    ['h',  beatMs * 2],
    ['q',  beatMs * 1],
    ['8',  beatMs * 0.5],
    ['16', beatMs * 0.25],
  ]

  return grids.reduce((best, curr) =>
    Math.abs(curr[1] - durationMs) < Math.abs(best[1] - durationMs) ? curr : best,
  )[0]
}
