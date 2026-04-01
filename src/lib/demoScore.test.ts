import { FUR_ELISE } from './demoScore'
import type { ScoreData, MeasureData } from './demoScore'

describe('FUR_ELISE demo score', () => {
  it('has correct metadata', () => {
    expect(FUR_ELISE.title).toBe('Für Elise')
    expect(FUR_ELISE.composer).toBe('Ludwig van Beethoven')
    expect(FUR_ELISE.timeSignature).toBe('3/8')
    expect(FUR_ELISE.numBeats).toBe(3)
    expect(FUR_ELISE.beatValue).toBe(8)
  })

  it('has exactly 8 measures', () => {
    expect(FUR_ELISE.measures).toHaveLength(8)
  })

  it('every measure has treble and bass voices', () => {
    for (const measure of FUR_ELISE.measures) {
      expect(measure.treble.length).toBeGreaterThan(0)
      expect(measure.bass.length).toBeGreaterThan(0)
    }
  })

  it('all notes have valid keys and duration', () => {
    for (const measure of FUR_ELISE.measures) {
      for (const note of [...measure.treble, ...measure.bass]) {
        expect(note.keys.length).toBeGreaterThan(0)
        for (const key of note.keys) {
          // VexFlow format: note/octave (e.g. "c/4", "f#/5")
          expect(key).toMatch(/^[a-g][#b]?\/\d+$/)
        }
        expect(note.duration).toBeTruthy()
      }
    }
  })

  it('treble notes have 3 eighth-note beats per measure', () => {
    const durationToEighths: Record<string, number> = {
      '8': 1, '8r': 1, 'q': 2, 'qr': 2, 'qd': 3,
      '4': 2, '4d': 3, 'h': 4, 'hd': 6, 'w': 8,
      '16': 0.5, '32': 0.25,
    }

    for (let i = 0; i < FUR_ELISE.measures.length; i++) {
      const measure = FUR_ELISE.measures[i]
      const totalEighths = measure.treble.reduce((sum, note) => {
        const eighths = durationToEighths[note.duration]
        expect(eighths).toBeDefined()
        return sum + (eighths ?? 0)
      }, 0)
      expect(totalEighths).toBe(3)
    }
  })

  it('bass notes fill 3 eighth-note beats per measure', () => {
    const durationToEighths: Record<string, number> = {
      '8': 1, '8r': 1, 'q': 2, 'qr': 2, 'qd': 3,
      '4': 2, '4d': 3, 'h': 4, 'hd': 6, 'w': 8,
      '16': 0.5, '32': 0.25,
    }

    for (let i = 0; i < FUR_ELISE.measures.length; i++) {
      const measure = FUR_ELISE.measures[i]
      const totalEighths = measure.bass.reduce((sum, note) => {
        const eighths = durationToEighths[note.duration]
        expect(eighths).toBeDefined()
        return sum + (eighths ?? 0)
      }, 0)
      expect(totalEighths).toBe(3)
    }
  })

  it('conforms to ScoreData type', () => {
    const score: ScoreData = FUR_ELISE
    expect(score).toBeDefined()
    const measure: MeasureData = score.measures[0]
    expect(measure).toBeDefined()
  })
})
