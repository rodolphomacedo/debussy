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
    <div className="practice-screen">
      <OrnateFrame variant="full" className="absolute inset-0 pointer-events-none z-40" />

      {/* ── Header ── */}
      <div className="practice-header">
        <button onClick={onBack} className="practice-back-btn group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Home</span>
        </button>

        <div className="practice-title-block">
          <span className="practice-title">Debussy</span>
          <span className="practice-subtitle">
            {score.title} · {score.composer} · {bpm} BPM
          </span>
        </div>

        <div className="flex items-center gap-4 text-base font-serif">
          <span style={{ color: '#6dbf8a' }}>✓ {stats.correct}</span>
          <span className="text-gold/20">·</span>
          <span style={{ color: '#bf6d6d' }}>✗ {stats.wrong}</span>
        </div>
      </div>

      {/* ── Sheet music ── */}
      <div className="practice-score-area">
        <div className="practice-score-inner">
          <ScoreRenderer
            score={score}
            cursorBeat={isPlaying ? currentBeat : undefined}
            hitNotes={hitNotes.size > 0 ? hitNotes : undefined}
            missNotes={missNotes.size > 0 ? missNotes : undefined}
            darkMode
          />
        </div>

        {/* Progress bar — overlaid at bottom of score area */}
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

      {/* ── Controls ── */}
      <div className="practice-controls">
        <LyreIcon size={28} className="text-gold/20 shrink-0" />

        <button
          onClick={isPlaying ? () => { stop(); isPlayingRef.current = false } : handleStart}
          className="practice-play-btn group"
        >
          <div className="practice-play-inner">
            {isPlaying
              ? <Pause className="w-7 h-7 fill-current" />
              : <Play className="w-7 h-7 fill-current ml-0.5" />}
          </div>
        </button>

        <button onClick={handleReset} className="practice-reset-btn">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* ── Piano keyboard — occupies the bottom 40% ── */}
      <div className="practice-keyboard">
        <PianoKeyboard activeKeys={pressedNotes} />
      </div>
    </div>
  )
}
