import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
import { OrnateFrame } from './OrnateFrame'
import { LyreIcon } from './icons/LyreIcon'
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

interface PracticeScreenProps {
  score: ScoreData
  bpm: number
  pressedNotes: Set<number>
  lastNoteOn: { note: number; velocity: number; time: number } | null
  onFinish: (result: ScoreResult) => void
  onBack: () => void
}

const MAX_WINDOW_MS = 300

export function PracticeScreen({
  score,
  bpm,
  pressedNotes,
  lastNoteOn,
  onFinish,
  onBack,
}: PracticeScreenProps) {
  const [hitNotes, setHitNotes] = useState<Set<string>>(new Set())
  const [missNotes, setMissNotes] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })

  const playedNotesRef = useRef<PlayedNote[]>([])
  const startTimeRef = useRef(0)
  const pendingExpectedRef = useRef<ExpectedNote[]>([])
  const isPlayingRef = useRef(false)

  const handleExpectedNote = useCallback((note: ExpectedNote) => {
    pendingExpectedRef.current.push(note)
    setTimeout(() => {
      const played = playedNotesRef.current
      const expMidi = vexFlowToMidi(note.pitch)
      const wasHit = played.some(
        p => p.pitch === expMidi && Math.abs(p.timestamp - note.beatMs) < MAX_WINDOW_MS,
      )
      if (!wasHit) {
        playErrorSound()
        setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }))
      }
    }, MAX_WINDOW_MS + 50)
  }, [])

  const handleComplete = useCallback(() => {
    isPlayingRef.current = false
    const scoreResult = evaluatePerformance(pendingExpectedRef.current, playedNotesRef.current)
    const hits = new Set<string>()
    const misses = new Set<string>()
    const matched = new Set<number>()
    let noteIdx = 0
    for (let mi = 0; mi < score.measures.length; mi++) {
      for (let ni = 0; ni < score.measures[mi].treble.length; ni++) {
        if (score.measures[mi].treble[ni].duration.endsWith('r')) continue
        const expected = pendingExpectedRef.current[noteIdx]
        if (expected) {
          const expMidi = vexFlowToMidi(expected.pitch)
          const matchIdx = playedNotesRef.current.findIndex(
            (p, pi) => !matched.has(pi) && p.pitch === expMidi && Math.abs(p.timestamp - expected.beatMs) < MAX_WINDOW_MS,
          )
          if (matchIdx >= 0) { hits.add(`${mi}-${ni}`); matched.add(matchIdx) }
          else { misses.add(`${mi}-${ni}`) }
        }
        noteIdx++
      }
    }
    setHitNotes(hits)
    setMissNotes(misses)
    setTimeout(() => onFinish(scoreResult), 1500)
  }, [score, onFinish])

  const { start, stop, reset, currentBeat, isPlaying, progress } = usePlayback({
    score, bpm, onExpectedNote: handleExpectedNote, onComplete: handleComplete,
  })

  useEffect(() => {
    if (!lastNoteOn || !isPlayingRef.current) return
    const timestamp = performance.now() - startTimeRef.current
    playedNotesRef.current.push({ pitch: lastNoteOn.note, timestamp })
    const matchedExp = pendingExpectedRef.current.find(
      exp => vexFlowToMidi(exp.pitch) === lastNoteOn.note && Math.abs(timestamp - exp.beatMs) < MAX_WINDOW_MS,
    )
    if (matchedExp) {
      playHitSound()
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }))
    }
  }, [lastNoteOn])

  const handleStart = useCallback(() => {
    playedNotesRef.current = []
    pendingExpectedRef.current = []
    setHitNotes(new Set())
    setMissNotes(new Set())
    setStats({ correct: 0, wrong: 0 })
    startTimeRef.current = performance.now()
    isPlayingRef.current = true
    start()
  }, [start])

  const handleReset = useCallback(() => {
    reset()
    isPlayingRef.current = false
    playedNotesRef.current = []
    pendingExpectedRef.current = []
    setHitNotes(new Set())
    setMissNotes(new Set())
    setStats({ correct: 0, wrong: 0 })
  }, [reset])

  return (
    <div className="practice-layout">

      {/* ══ TOP SECTION — ornate frame + title + score + controls ══ */}
      <div className="practice-top-section">

        {/* Ornate corner frame */}
        <OrnateFrame variant="full" className="absolute inset-0 pointer-events-none z-20" />

        {/* Title row */}
        <div className="practice-title-row">
          <button onClick={onBack} className="practice-back-btn">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="practice-title-center">
            <span className="practice-logo-text">Debussy</span>
            <span className="practice-subtitle-text">
              {score.title} · {score.composer} · {bpm} BPM
            </span>
          </div>

          <div className="practice-stats">
            <span style={{ color: '#6dbf8a' }}>✓ {stats.correct}</span>
            <span style={{ color: '#bf6d6d' }}>✗ {stats.wrong}</span>
          </div>
        </div>

        {/* Score area */}
        <div className="practice-score-box">
          <div className="practice-score-inner">
            <ScoreRenderer
              score={score}
              cursorBeat={isPlaying ? currentBeat : undefined}
              hitNotes={hitNotes.size > 0 ? hitNotes : undefined}
              missNotes={missNotes.size > 0 ? missNotes : undefined}
              darkMode
            />
          </div>

          {/* Progress bar at bottom of score */}
          {isPlaying && (
            <div className="practice-progress-track">
              <motion.div
                className="practice-progress-fill"
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="practice-controls-row">
          <LyreIcon size={26} style={{ color: 'rgba(160,120,38,0.25)' }} className="hidden sm:block" />

          {/* Play / Pause */}
          <button
            onClick={isPlaying ? () => { stop(); isPlayingRef.current = false } : handleStart}
            className="practice-play-btn"
          >
            <div className="practice-play-inner">
              {isPlaying
                ? <Pause className="practice-play-icon fill-current" />
                : <Play className="practice-play-icon fill-current ml-0.5" />}
            </div>
          </button>

          <button onClick={handleReset} className="practice-reset-btn">
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ══ PIANO KEYBOARD — 5 octaves C2–C7 for readable key width ══ */}
      <div className="practice-keyboard">
        <PianoKeyboard activeKeys={pressedNotes} startNote={36} endNote={96} />
      </div>
    </div>
  )
}
