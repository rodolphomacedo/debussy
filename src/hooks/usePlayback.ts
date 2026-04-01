import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import type { ScoreData } from '../lib/demoScore'
import type { ExpectedNote } from '../lib/scorer'
import { getDurationTicks } from '../lib/scoreBuilder'

export interface UsePlaybackOptions {
  score: ScoreData
  bpm?: number
  onExpectedNote?: (note: ExpectedNote) => void
  onComplete?: () => void
}

export interface UsePlaybackReturn {
  start: () => void
  stop: () => void
  reset: () => void
  currentBeat: number
  isPlaying: boolean
  progress: number // 0–1
  expectedNotes: ExpectedNote[]
}

/**
 * Build a flat list of expected notes from the score data, computing
 * each note's absolute beat position and millisecond timestamp.
 */
function buildExpectedNotes(score: ScoreData): ExpectedNote[] {
  const notes: ExpectedNote[] = []
  const beatsPerMeasure = score.numBeats
  let beatOffset = 0

  for (const measure of score.measures) {
    let localBeat = 0
    for (const noteData of measure.treble) {
      // Skip rests
      if (noteData.duration.endsWith('r')) {
        const ticks = getDurationTicks(noteData.duration)
        const quarterTicks = 4096
        localBeat += (ticks / quarterTicks) * (4 / score.beatValue)
        continue
      }

      for (const key of noteData.keys) {
        const absoluteBeat = beatOffset + localBeat
        notes.push({
          pitch: key,
          beat: absoluteBeat,
          beatMs: 0, // computed after we know the BPM
        })
      }

      const ticks = getDurationTicks(noteData.duration)
      const quarterTicks = 4096
      localBeat += (ticks / quarterTicks) * (4 / score.beatValue)
    }
    beatOffset += beatsPerMeasure
  }

  return notes
}

/**
 * Compute beatMs for all notes based on BPM and beat value.
 * In 3/8 time, one beat = one eighth note. beatMs = (60000 / bpm) per beat.
 */
function computeBeatMs(notes: ExpectedNote[], bpm: number): ExpectedNote[] {
  const msPerBeat = 60_000 / bpm
  return notes.map(n => ({
    ...n,
    beatMs: n.beat * msPerBeat,
  }))
}

export function usePlayback({
  score,
  bpm = 72,
  onExpectedNote,
  onComplete,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [currentBeat, setCurrentBeat] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [expectedNotes, setExpectedNotes] = useState<ExpectedNote[]>([])

  const onExpectedNoteRef = useRef(onExpectedNote)
  onExpectedNoteRef.current = onExpectedNote
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const totalBeats = score.numBeats * score.measures.length
  const scheduledIdsRef = useRef<number[]>([])

  // Build expected notes when score changes
  useEffect(() => {
    const raw = buildExpectedNotes(score)
    const withMs = computeBeatMs(raw, bpm)
    setExpectedNotes(withMs)
  }, [score, bpm])

  const start = useCallback(() => {
    const transport = Tone.getTransport()
    transport.bpm.value = bpm

    // Schedule beat counter update
    const beatInterval = '8n' // one eighth note per beat in 3/8
    const repeatId = transport.scheduleRepeat((time) => {
      Tone.getDraw().schedule(() => {
        setCurrentBeat(prev => {
          const next = prev + 1
          if (next >= totalBeats) {
            transport.stop()
            setIsPlaying(false)
            onCompleteRef.current?.()
          }
          return next
        })
      }, time)
    }, beatInterval)
    scheduledIdsRef.current.push(repeatId)

    // Schedule expected note callbacks
    for (const note of expectedNotes) {
      const timeInSeconds = note.beatMs / 1000
      const id = transport.schedule(() => {
        onExpectedNoteRef.current?.(note)
      }, timeInSeconds)
      scheduledIdsRef.current.push(id)
    }

    transport.start()
    setIsPlaying(true)
  }, [bpm, totalBeats, expectedNotes])

  const stop = useCallback(() => {
    const transport = Tone.getTransport()
    transport.stop()
    setIsPlaying(false)
  }, [])

  const reset = useCallback(() => {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0

    // Clear all scheduled events
    for (const id of scheduledIdsRef.current) {
      transport.clear(id)
    }
    scheduledIdsRef.current = []

    setCurrentBeat(0)
    setIsPlaying(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const transport = Tone.getTransport()
      transport.stop()
      transport.position = 0
      for (const id of scheduledIdsRef.current) {
        transport.clear(id)
      }
      scheduledIdsRef.current = []
    }
  }, [])

  const progress = totalBeats > 0 ? currentBeat / totalBeats : 0

  return {
    start,
    stop,
    reset,
    currentBeat,
    isPlaying,
    progress,
    expectedNotes,
  }
}
