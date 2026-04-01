import { useCallback, useEffect, useRef, useState } from 'react'
import { ScoreRenderer } from './ScoreRenderer'
import { ResultOverlay } from './ResultOverlay'
import { usePlayback } from '../hooks/usePlayback'
import {
  evaluatePerformance,
  type ExpectedNote,
  type PlayedNote,
  type ScoreResult,
} from '../lib/scorer'
import { playErrorSound, playHitSound } from '../lib/audioEngine'
import { vexFlowToMidi } from '../lib/midiToNote'
import type { ScoreData } from '../lib/demoScore'

export interface ScorePlayerProps {
  score: ScoreData
  bpm?: number
  /** MIDI note currently pressed — fed from parent's useMidi */
  lastNoteOn?: { note: number; velocity: number; time: number } | null
}

const MAX_WINDOW_MS = 300

export function ScorePlayer({ score, bpm = 72, lastNoteOn }: ScorePlayerProps) {
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [hitNotes, setHitNotes] = useState<Set<string>>(new Set())
  const [missNotes, setMissNotes] = useState<Set<string>>(new Set())

  const playedNotesRef = useRef<PlayedNote[]>([])
  const startTimeRef = useRef<number>(0)
  const pendingExpectedRef = useRef<ExpectedNote[]>([])
  const isPlayingRef = useRef(false)

  const handleExpectedNote = useCallback((note: ExpectedNote) => {
    pendingExpectedRef.current.push(note)

    // Check after the timing window if this note was hit
    setTimeout(() => {
      const played = playedNotesRef.current
      const expMidi = vexFlowToMidi(note.pitch)
      const wasHit = played.some(
        p =>
          p.pitch === expMidi &&
          Math.abs(p.timestamp - note.beatMs) < MAX_WINDOW_MS,
      )

      if (!wasHit) {
        playErrorSound()
      }
    }, MAX_WINDOW_MS + 50)
  }, [])

  const handleComplete = useCallback(() => {
    isPlayingRef.current = false

    const scoreResult = evaluatePerformance(
      pendingExpectedRef.current,
      playedNotesRef.current,
    )
    setResult(scoreResult)

    // Build hit/miss sets for coloring
    const hits = new Set<string>()
    const misses = new Set<string>()
    const matched = new Set<number>()

    let noteIdx = 0
    for (let mi = 0; mi < score.measures.length; mi++) {
      const measure = score.measures[mi]
      for (let ni = 0; ni < measure.treble.length; ni++) {
        const noteData = measure.treble[ni]
        if (noteData.duration.endsWith('r')) continue

        const expected = pendingExpectedRef.current[noteIdx]
        if (expected) {
          const expMidi = vexFlowToMidi(expected.pitch)
          const wasHit = playedNotesRef.current.some(
            (p, pi) =>
              !matched.has(pi) &&
              p.pitch === expMidi &&
              Math.abs(p.timestamp - expected.beatMs) < MAX_WINDOW_MS,
          )
          if (wasHit) {
            hits.add(`${mi}-${ni}`)
            // Mark the first matching played note as used
            const matchIdx = playedNotesRef.current.findIndex(
              (p, pi) =>
                !matched.has(pi) &&
                p.pitch === expMidi &&
                Math.abs(p.timestamp - expected.beatMs) < MAX_WINDOW_MS,
            )
            if (matchIdx >= 0) matched.add(matchIdx)
          } else {
            misses.add(`${mi}-${ni}`)
          }
        }
        noteIdx++
      }
    }

    setHitNotes(hits)
    setMissNotes(misses)
  }, [score])

  const { start, stop, reset, currentBeat, isPlaying, progress } = usePlayback({
    score,
    bpm,
    onExpectedNote: handleExpectedNote,
    onComplete: handleComplete,
  })

  // Record incoming MIDI notes while playing
  useEffect(() => {
    if (!lastNoteOn || !isPlayingRef.current) return

    const timestamp = performance.now() - startTimeRef.current
    playedNotesRef.current.push({ pitch: lastNoteOn.note, timestamp })

    // Check if this note matches any pending expected note
    const matchedExp = pendingExpectedRef.current.find(
      exp =>
        vexFlowToMidi(exp.pitch) === lastNoteOn.note &&
        Math.abs(timestamp - exp.beatMs) < MAX_WINDOW_MS,
    )
    if (matchedExp) {
      playHitSound()
    }
  }, [lastNoteOn])

  const handleStart = useCallback(() => {
    playedNotesRef.current = []
    pendingExpectedRef.current = []
    setResult(null)
    setHitNotes(new Set())
    setMissNotes(new Set())
    startTimeRef.current = performance.now()
    isPlayingRef.current = true
    start()
  }, [start])

  const handlePlayAgain = useCallback(() => {
    reset()
    setResult(null)
    setHitNotes(new Set())
    setMissNotes(new Set())
  }, [reset])

  return (
    <div className="score-player">
      <div className="player-controls">
        {!isPlaying && !result && (
          <button className="player-btn" onClick={handleStart}>
            Start Practice
          </button>
        )}
        {isPlaying && (
          <button className="player-btn" onClick={stop}>
            Stop
          </button>
        )}
      </div>

      {isPlaying && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <ScoreRenderer
        score={score}
        cursorBeat={isPlaying ? currentBeat : undefined}
        hitNotes={hitNotes.size > 0 ? hitNotes : undefined}
        missNotes={missNotes.size > 0 ? missNotes : undefined}
      />

      {result && (
        <ResultOverlay result={result} onClose={handlePlayAgain} />
      )}
    </div>
  )
}
