import { useCallback, useRef } from 'react'
import { isAudioReady, playNote, releaseNote } from '../lib/audioEngine'

interface PianoKeyboardProps {
  activeKeys?: Set<number> | number[]
  /**
   * Keys the user should play next — highlighted with a gold glow
   * to guide them during practice mode.
   */
  guideKeys?: Set<number> | number[]
  /**
   * When true, clicking/touching keys triggers the Salamander Grand Piano sound.
   * Defaults to true.
   */
  playable?: boolean
  /**
   * Range of MIDI notes to display. Defaults to full 88-key piano (A0=21 to C8=108).
   */
  startNote?: number
  endNote?: number
}

// ── Piano key layout constants ──
// A real piano has 88 keys: A0 (MIDI 21) through C8 (MIDI 108).
// White keys per octave: C, D, E, F, G, A, B (indices 0, 2, 4, 5, 7, 9, 11)
// Black keys per octave: C#, D#, F#, G#, A# (indices 1, 3, 6, 8, 10)

const BLACK_KEY_SEMITONES = new Set([1, 3, 6, 8, 10])

function isBlack(midi: number): boolean {
  return BLACK_KEY_SEMITONES.has(midi % 12)
}

/**
 * Black key horizontal offset relative to its preceding white key.
 * Values are fractions of white key width, matching real piano geometry.
 * Grouped by position within the octave.
 */
function getBlackKeyOffset(midi: number): number {
  const semitone = midi % 12
  switch (semitone) {
    case 1: return 0.58   // C#: slightly right of C
    case 3: return 0.72   // D#: further right, before E
    case 6: return 0.56   // F#: slightly right of F
    case 8: return 0.64   // G#: middle
    case 10: return 0.72  // A#: further right, before B
    default: return 0.6
  }
}

/**
 * Returns the note name for labeling C keys.
 */
function getNoteLabel(midi: number): string | null {
  if (midi % 12 !== 0 && midi !== 21) return null // Only label C keys (and A0)
  if (midi === 21) return 'A0'
  return `C${Math.floor(midi / 12) - 1}`
}

export function PianoKeyboard({
  activeKeys = [],
  guideKeys = [],
  playable = true,
  startNote = 21,  // A0
  endNote = 108,    // C8
}: PianoKeyboardProps) {
  const activeSet = activeKeys instanceof Set ? activeKeys : new Set(activeKeys)
  const guideSet = guideKeys instanceof Set ? guideKeys : new Set(guideKeys)
  const pressedByMouseRef = useRef<Set<number>>(new Set())

  // Build the list of all MIDI notes in range
  const allNotes = Array.from({ length: endNote - startNote + 1 }, (_, i) => i + startNote)
  const whiteNotes = allNotes.filter(n => !isBlack(n))
  const blackNotes = allNotes.filter(n => isBlack(n))

  // Compute white key index for positioning black keys
  const whiteKeyIndex = new Map<number, number>()
  whiteNotes.forEach((note, idx) => { whiteKeyIndex.set(note, idx) })

  const handlePointerDown = useCallback((midi: number) => {
    if (!playable) return
    pressedByMouseRef.current.add(midi)
    if (isAudioReady()) playNote(midi, 0.7)
  }, [playable])

  const handlePointerUp = useCallback((midi: number) => {
    if (!playable) return
    pressedByMouseRef.current.delete(midi)
    if (isAudioReady()) releaseNote(midi)
  }, [playable])

  const handlePointerLeave = useCallback((midi: number) => {
    if (!playable) return
    if (pressedByMouseRef.current.has(midi)) {
      pressedByMouseRef.current.delete(midi)
      if (isAudioReady()) releaseNote(midi)
    }
  }, [playable])

  const whiteKeyCount = whiteNotes.length

  return (
    <div className="piano-container">
      {/* Wooden case — left side */}
      <div className="piano-wood-left" />

      {/* Wooden case — top rail (fallboard edge) */}
      <div className="piano-wood-top" />

      {/* Wooden case — right side */}
      <div className="piano-wood-right" />

      {/* Key bed */}
      <div className="piano-keybed">
        {/* Warm stage lighting */}
        <div className="piano-lighting" />

        {/* White keys */}
        {whiteNotes.map((midi, idx) => {
          const isActive = activeSet.has(midi)
          const isGuide = guideSet.has(midi)
          const label = getNoteLabel(midi)

          return (
            <div
              key={midi}
              className={[
                'piano-white-key',
                isActive ? 'pressed' : '',
                isGuide ? 'guide' : '',
              ].join(' ')}
              style={{
                left: `${(idx / whiteKeyCount) * 100}%`,
                width: `${(1 / whiteKeyCount) * 100}%`,
              }}
              onPointerDown={(e) => { e.preventDefault(); handlePointerDown(midi) }}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
            >
              {/* Key surface detail — subtle ivory grain */}
              <div className="key-surface" />

              {/* Key front face (visible edge at bottom) */}
              <div className="key-front" />

              {/* Guide glow overlay */}
              {isGuide && <div className="key-guide-glow" />}

              {/* Label */}
              {label && (
                <span className="key-label">{label}</span>
              )}
            </div>
          )
        })}

        {/* Black keys */}
        {blackNotes.map((midi) => {
          // Find the white key just below this black key
          const prevWhite = midi - 1 - (isBlack(midi - 1) ? 1 : 0)
          const whiteIdx = whiteKeyIndex.get(prevWhite)
          if (whiteIdx === undefined) return null

          const isActive = activeSet.has(midi)
          const isGuide = guideSet.has(midi)
          const offset = getBlackKeyOffset(midi)
          const leftPercent = ((whiteIdx + offset) / whiteKeyCount) * 100
          const widthPercent = (0.55 / whiteKeyCount) * 100

          return (
            <div
              key={midi}
              className={[
                'piano-black-key',
                isActive ? 'pressed' : '',
                isGuide ? 'guide' : '',
              ].join(' ')}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
              onPointerDown={(e) => { e.preventDefault(); handlePointerDown(midi) }}
              onPointerUp={() => handlePointerUp(midi)}
              onPointerLeave={() => handlePointerLeave(midi)}
            >
              {/* 3D top bevel */}
              <div className="black-key-top" />

              {/* Candlelight underglow when pressed */}
              {isActive && <div className="black-key-glow" />}

              {/* Guide glow overlay */}
              {isGuide && <div className="key-guide-glow black" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
