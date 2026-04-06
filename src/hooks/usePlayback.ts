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
  autoPlayNotes?: boolean
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

/**
 * Ticks per one beat in the given time signature.
 * e.g. 3/8 → ticksPerBeat = 4096*(4/8) = 2048  (one eighth note per beat)
 *      4/4 → ticksPerBeat = 4096*(4/4) = 4096  (one quarter note per beat)
 */
function ticksPerBeat(beatValue: number): number {
  return QUARTER_TICKS * 4 / beatValue
}

/**
 * Advance in time-signature beats for a given VexFlow duration.
 * An eighth note in 3/8 → 1 beat. A quarter note in 4/4 → 1 beat.
 */
function durationBeats(duration: string, beatValue: number): number {
  return getDurationTicks(duration) / ticksPerBeat(beatValue)
}

/** Convert VexFlow duration + bpm to seconds (independent of time signature). */
function durationToSeconds(duration: string, bpm: number): number {
  return (getDurationTicks(duration) / QUARTER_TICKS) * (60 / bpm)
}

/**
 * Build expected notes (treble only) for scoring.
 * Beats are counted in time-signature units so they match the beat counter.
 */
function buildExpectedNotes(score: ScoreData): ExpectedNote[] {
  const notes: ExpectedNote[] = []
  let beatOffset = 0

  for (const measure of score.measures) {
    let localBeat = 0
    for (const noteData of measure.treble) {
      const advance = durationBeats(noteData.duration, score.beatValue)
      if (!noteData.duration.endsWith('r')) {
        for (const key of noteData.keys) {
          notes.push({ pitch: key, beat: beatOffset + localBeat, beatMs: 0, duration: noteData.duration })
        }
      }
      localBeat += advance
    }
    beatOffset += score.numBeats
  }

  return notes
}

/**
 * Build all notes for audio playback (treble + bass).
 * Same timing logic as buildExpectedNotes.
 */
interface PlaybackNote {
  pitch: string
  beatMs: number
  duration: string
}

function buildPlaybackNotes(score: ScoreData, bpm: number): PlaybackNote[] {
  const msPerBeat = (60_000 / bpm) * (4 / score.beatValue)
  const notes: PlaybackNote[] = []
  let beatOffset = 0

  for (const measure of score.measures) {
    for (const stave of [measure.treble, measure.bass]) {
      let localBeat = 0
      for (const noteData of stave) {
        const advance = durationBeats(noteData.duration, score.beatValue)
        if (!noteData.duration.endsWith('r')) {
          for (const key of noteData.keys) {
            notes.push({
              pitch: key,
              beatMs: (beatOffset + localBeat) * msPerBeat,
              duration: noteData.duration,
            })
          }
        }
        localBeat += advance
      }
    }
    beatOffset += score.numBeats
  }

  return notes
}

function computeBeatMs(notes: ExpectedNote[], bpm: number, beatValue: number): ExpectedNote[] {
  const msPerBeat = (60_000 / bpm) * (4 / beatValue)
  return notes.map(n => ({ ...n, beatMs: n.beat * msPerBeat }))
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
    const withMs = computeBeatMs(raw, bpm, score.beatValue)
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

    // ── Scoring callbacks (treble only) ─────────────────────────────────
    for (const note of expectedNotes) {
      const id = transport.schedule(() => {
        onExpectedNoteRef.current?.(note)
      }, note.beatMs / 1000)
      scheduledIdsRef.current.push(id)
    }

    // ── Audio playback (treble + bass) ──────────────────────────────────
    if (autoPlayNotes) {
      const playbackNotes = buildPlaybackNotes(score, bpm)
      for (const note of playbackNotes) {
        const durSec = durationToSeconds(note.duration, bpm)
        const playId = transport.schedule((time) => {
          try {
            const midi = vexFlowToMidi(note.pitch)
            playScheduledNote(midi, Math.min(durSec * 0.9, 1.5), time)
          } catch { /* ignore unknown pitches */ }
        }, note.beatMs / 1000)
        scheduledIdsRef.current.push(playId)
      }
    }

    transport.start()
    setIsPlaying(true)
  }, [bpm, totalBeats, expectedNotes, metronome, autoPlayNotes, score])

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
