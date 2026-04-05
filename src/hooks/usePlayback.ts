import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import type { ScoreData } from '../lib/demoScore'
import type { ExpectedNote } from '../lib/scorer'
import { getDurationTicks } from '../lib/scoreBuilder'
import { vexFlowToMidi } from '../lib/midiToNote'
import { playScheduledNote, playMetronomeTick } from '../lib/audioEngine'

export interface UsePlaybackOptions {
  score: ScoreData
  bpm?: number
  metronome?: boolean
  autoPlayNotes?: boolean          // listen mode — play notes via piano
  onExpectedNote?: (note: ExpectedNote) => void
  onComplete?: () => void
}

export interface UsePlaybackReturn {
  start: () => void
  stop: () => void
  reset: () => void
  currentBeat: number
  isPlaying: boolean
  progress: number
  expectedNotes: ExpectedNote[]
}

const QUARTER_TICKS = 4096

function buildExpectedNotes(score: ScoreData): ExpectedNote[] {
  const notes: ExpectedNote[] = []
  const beatsPerMeasure = score.numBeats
  let beatOffset = 0

  for (const measure of score.measures) {
    let localBeat = 0
    for (const noteData of measure.treble) {
      if (noteData.duration.endsWith('r')) {
        localBeat += (getDurationTicks(noteData.duration) / QUARTER_TICKS) * (4 / score.beatValue)
        continue
      }
      for (const key of noteData.keys) {
        notes.push({
          pitch: key,
          beat: beatOffset + localBeat,
          beatMs: 0,
          duration: noteData.duration,
        })
      }
      localBeat += (getDurationTicks(noteData.duration) / QUARTER_TICKS) * (4 / score.beatValue)
    }
    beatOffset += beatsPerMeasure
  }

  return notes
}

function computeBeatMs(notes: ExpectedNote[], bpm: number): ExpectedNote[] {
  const msPerBeat = 60_000 / bpm
  return notes.map(n => ({ ...n, beatMs: n.beat * msPerBeat }))
}

/** Convert VexFlow duration + bpm to seconds */
function durationToSeconds(duration: string, bpm: number): number {
  const ticks = getDurationTicks(duration)
  const quarterSeconds = 60 / bpm
  return (ticks / QUARTER_TICKS) * quarterSeconds
}

export function usePlayback({
  score,
  bpm = 72,
  metronome = false,
  autoPlayNotes = false,
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

  useEffect(() => {
    const raw = buildExpectedNotes(score)
    const withMs = computeBeatMs(raw, bpm)
    setExpectedNotes(withMs)
  }, [score, bpm])

  const start = useCallback(() => {
    const transport = Tone.getTransport()
    transport.bpm.value = bpm

    // ── Beat counter ────────────────────────────────────────────────────
    const beatInterval = `${score.beatValue}n`
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

    // ── Metronome clicks ────────────────────────────────────────────────
    if (metronome) {
      let beatCount = 0
      const metroId = transport.scheduleRepeat((time) => {
        playMetronomeTick(time, beatCount % score.numBeats === 0)
        beatCount++
      }, beatInterval)
      scheduledIdsRef.current.push(metroId)
    }

    // ── Expected note callbacks + auto-play ─────────────────────────────
    for (const note of expectedNotes) {
      const timeInSeconds = note.beatMs / 1000

      // Notify scorer (practice mode)
      const id = transport.schedule(() => {
        onExpectedNoteRef.current?.(note)
      }, timeInSeconds)
      scheduledIdsRef.current.push(id)

      // Play piano sound (listen mode)
      if (autoPlayNotes && note.duration) {
        const durSec = durationToSeconds(note.duration, bpm)
        const playId = transport.schedule((time) => {
          try {
            const midi = vexFlowToMidi(note.pitch)
            playScheduledNote(midi, Math.min(durSec * 0.9, 1.5), time)
          } catch { /* ignore unknown pitches */ }
        }, timeInSeconds)
        scheduledIdsRef.current.push(playId)
      }
    }

    transport.start()
    setIsPlaying(true)
  }, [bpm, totalBeats, expectedNotes, metronome, autoPlayNotes, score.beatValue, score.numBeats])

  const stop = useCallback(() => {
    Tone.getTransport().stop()
    setIsPlaying(false)
  }, [])

  const reset = useCallback(() => {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    for (const id of scheduledIdsRef.current) transport.clear(id)
    scheduledIdsRef.current = []
    setCurrentBeat(0)
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      const transport = Tone.getTransport()
      transport.stop()
      transport.position = 0
      for (const id of scheduledIdsRef.current) transport.clear(id)
      scheduledIdsRef.current = []
    }
  }, [])

  return {
    start, stop, reset,
    currentBeat, isPlaying,
    progress: totalBeats > 0 ? currentBeat / totalBeats : 0,
    expectedNotes,
  }
}
