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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#100e08', overflow: 'hidden' }}>

      {/* ══ TOP SECTION — ornate frame + title + score + controls ══ */}
      <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* Ornate corner frame — decorates this section only */}
        <OrnateFrame variant="full" className="absolute inset-0 pointer-events-none z-20" />

        {/* Title row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px', flexShrink: 0, position: 'relative', zIndex: 25,
        }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#A07828', fontFamily: 'var(--font-serif)', fontSize: 12,
            letterSpacing: '0.1em', cursor: 'pointer', background: 'none', border: 'none',
          }}>
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{
              fontFamily: 'var(--font-elegant)', fontSize: 20, fontStyle: 'italic',
              letterSpacing: '0.12em',
              background: 'linear-gradient(to bottom, #e8c87a, #c9a84c, #a07828, #c9a84c)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Debussy</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, color: '#8a6520', letterSpacing: '0.15em', fontStyle: 'italic' }}>
              {score.title} · {score.composer} · {bpm} BPM
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-serif)', fontSize: 13 }}>
            <span style={{ color: '#6dbf8a' }}>✓ {stats.correct}</span>
            <span style={{ color: '#bf6d6d' }}>✗ {stats.wrong}</span>
          </div>
        </div>

        {/* Score area — fills remaining top section height */}
        <div style={{
          flex: '1 1 0', minHeight: 0, margin: '0 16px',
          position: 'relative', zIndex: 10,
          background: 'linear-gradient(to bottom, #1e1a10, #141008, #1a160e)',
          border: '1.5px solid rgba(160,120,38,0.3)',
          borderRadius: 3,
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
          overflowX: 'auto', overflowY: 'hidden',
        }}>
          <div style={{ padding: '12px 20px' }}>
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
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.5)' }}>
              <motion.div
                style={{
                  height: '100%', width: `${progress * 100}%`,
                  background: 'linear-gradient(to right, #6b4e18, #c9a84c, #e8c87a)',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
        </div>

        {/* Controls row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 24px', flexShrink: 0, position: 'relative', zIndex: 25,
        }}>
          <LyreIcon size={26} style={{ color: 'rgba(160,120,38,0.25)' }} />

          {/* Play / Pause */}
          <button
            onClick={isPlaying ? () => { stop(); isPlayingRef.current = false } : handleStart}
            style={{
              width: 50, height: 50, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8c87a, #c9a84c, #a07828, #c9a84c)',
              padding: 2, cursor: 'pointer', border: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.7), 0 0 0 1px rgba(100,75,20,0.4)',
            }}
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e1408, #0e0c06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#c9a84c',
            }}>
              {isPlaying
                ? <Pause style={{ width: 22, height: 22 }} className="fill-current" />
                : <Play style={{ width: 22, height: 22, marginLeft: 2 }} className="fill-current" />}
            </div>
          </button>

          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', fontFamily: 'var(--font-serif)', fontSize: 11,
              letterSpacing: '0.14em', color: '#8a6520', cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(160,120,38,0.25)', borderRadius: 2,
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ══ PIANO KEYBOARD — fixed height, same as previous version ══ */}
      <div style={{ height: 208, flexShrink: 0, position: 'relative', zIndex: 30 }}>
        <PianoKeyboard activeKeys={pressedNotes} />
      </div>
    </div>
  )
}
