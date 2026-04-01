import {
  evaluatePerformance,
  pctToGrade,
  noteNameToMidi,
  type ExpectedNote,
  type PlayedNote,
} from './scorer'

describe('noteNameToMidi', () => {
  it('converts c/4 to 60', () => {
    expect(noteNameToMidi('c/4')).toBe(60)
  })

  it('converts e/5 to 76', () => {
    expect(noteNameToMidi('e/5')).toBe(76)
  })

  it('converts a/0 to 21', () => {
    expect(noteNameToMidi('a/0')).toBe(21)
  })

  it('converts d#/5 to 75', () => {
    expect(noteNameToMidi('d#/5')).toBe(75)
  })
})

describe('pctToGrade', () => {
  it('returns A for 90%+', () => {
    expect(pctToGrade(100)).toBe('A')
    expect(pctToGrade(90)).toBe('A')
  })

  it('returns B for 75-89%', () => {
    expect(pctToGrade(89)).toBe('B')
    expect(pctToGrade(75)).toBe('B')
  })

  it('returns C for 60-74%', () => {
    expect(pctToGrade(74)).toBe('C')
    expect(pctToGrade(60)).toBe('C')
  })

  it('returns D for 45-59%', () => {
    expect(pctToGrade(59)).toBe('D')
    expect(pctToGrade(45)).toBe('D')
  })

  it('returns F for below 45%', () => {
    expect(pctToGrade(44)).toBe('F')
    expect(pctToGrade(0)).toBe('F')
  })
})

describe('evaluatePerformance', () => {
  it('scores a perfect performance (all hits within 150ms)', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'e/5', beat: 0, beatMs: 0 },
      { pitch: 'd#/5', beat: 1, beatMs: 833 },
      { pitch: 'e/5', beat: 2, beatMs: 1666 },
    ]
    const played: PlayedNote[] = [
      { pitch: 76, timestamp: 10 },    // e/5, 10ms late
      { pitch: 75, timestamp: 840 },   // d#/5, 7ms late
      { pitch: 76, timestamp: 1670 },  // e/5, 4ms late
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(3)
    expect(result.misses).toBe(0)
    expect(result.extras).toBe(0)
    expect(result.percentScore).toBe(100)
    expect(result.grade).toBe('A')
  })

  it('scores partial hits (timing 150-300ms)', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
      { pitch: 'd/4', beat: 1, beatMs: 833 },
    ]
    const played: PlayedNote[] = [
      { pitch: 60, timestamp: 200 },  // c/4, 200ms late → partial
      { pitch: 62, timestamp: 1080 }, // d/4, 247ms late → partial
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(2)
    expect(result.misses).toBe(0)
    // 2 partial hits = 0.5 + 0.5 = 1.0 out of 2.0 total = 50%
    expect(result.percentScore).toBe(50)
    expect(result.grade).toBe('D')
  })

  it('scores all misses (nothing played)', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
      { pitch: 'd/4', beat: 1, beatMs: 833 },
      { pitch: 'e/4', beat: 2, beatMs: 1666 },
    ]
    const played: PlayedNote[] = []

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(0)
    expect(result.misses).toBe(3)
    expect(result.extras).toBe(0)
    expect(result.percentScore).toBe(0)
    expect(result.grade).toBe('F')
  })

  it('penalizes extra notes', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
    ]
    const played: PlayedNote[] = [
      { pitch: 60, timestamp: 10 },   // correct hit
      { pitch: 65, timestamp: 100 },  // extra
      { pitch: 67, timestamp: 200 },  // extra
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(1)
    expect(result.extras).toBe(2)
    // earned = 1.0 - 2*0.1 = 0.8, total = 1, pct = 80%
    expect(result.percentScore).toBe(80)
    expect(result.grade).toBe('B')
  })

  it('handles timing beyond 300ms as miss', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
    ]
    const played: PlayedNote[] = [
      { pitch: 60, timestamp: 350 }, // correct pitch but too late
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(0)
    expect(result.misses).toBe(1)
    expect(result.extras).toBe(1) // unmatched played note
  })

  it('handles wrong pitch as miss + extra', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
    ]
    const played: PlayedNote[] = [
      { pitch: 62, timestamp: 10 }, // wrong pitch (D instead of C)
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(0)
    expect(result.misses).toBe(1)
    expect(result.extras).toBe(1)
  })

  it('does not match one played note to multiple expected notes', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
      { pitch: 'c/4', beat: 1, beatMs: 833 },
    ]
    const played: PlayedNote[] = [
      { pitch: 60, timestamp: 10 }, // only one C4 played
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.hits).toBe(1)
    expect(result.misses).toBe(1)
  })

  it('handles empty expected notes', () => {
    const result = evaluatePerformance([], [])
    expect(result.percentScore).toBe(0)
    expect(result.grade).toBe('F')
  })

  it('clamps percentScore to 0 when extras exceed earned weight', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
    ]
    // 1 miss + 15 extras → earned = 0 - 15*0.1 = clamped to 0
    const played: PlayedNote[] = Array.from({ length: 15 }, (_, i) => ({
      pitch: 65 + i,
      timestamp: i * 10,
    }))

    const result = evaluatePerformance(expected, played)
    expect(result.percentScore).toBe(0)
    expect(result.grade).toBe('F')
  })

  it('records timing errors for matched notes', () => {
    const expected: ExpectedNote[] = [
      { pitch: 'c/4', beat: 0, beatMs: 0 },
      { pitch: 'd/4', beat: 1, beatMs: 833 },
    ]
    const played: PlayedNote[] = [
      { pitch: 60, timestamp: 50 },
      { pitch: 62, timestamp: 933 },
    ]

    const result = evaluatePerformance(expected, played)
    expect(result.timingErrors).toHaveLength(2)
    expect(result.timingErrors[0]).toBe(50)
    expect(result.timingErrors[1]).toBe(100)
  })
})
