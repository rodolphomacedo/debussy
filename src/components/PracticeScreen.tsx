import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
import { OrnateFrame } from './OrnateFrame'
import { PracticeHeader } from './PracticeHeader'
import { PracticeControls } from './PracticeControls'
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

type PracticeMode = 'listen' | 'practice'

const MAX_WINDOW_MS = 300

export function PracticeScreen({
  score,
  bpm,
  pressedNotes,
  lastNoteOn,
  onFinish,
  onBack,
}: PracticeScreenProps) {
  const [mode, setMode] = useState<PracticeMode>('practice')
  const [metronome, setMetronome] = useState(false)
  const [hitNotes,  setHitNotes]  = useState<Set<string>>(new Set())
  const [missNotes, setMissNotes] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ correct: 0, wrong: 0 })

  const playedNotesRef    = useRef<PlayedNote[]>([])
  const startTimeRef      = useRef(0)
  const pendingExpRef     = useRef<ExpectedNote[]>([])
  const isPlayingRef      = useRef(false)

  // Reset scoring state when mode changes
  useEffect(() => {
    playedNotesRef.current = []
    pendingExpRef.current  = []
    setHitNotes(new Set())
    setMissNotes(new Set())
    setStats({ correct: 0, wrong: 0 })
  }, [mode])

  const handleExpectedNote = useCallback((note: ExpectedNote) => {
    if (mode !== 'practice') return
    pendingExpRef.current.push(note)
    setTimeout(() => {
      const expMidi = vexFlowToMidi(note.pitch)
      const wasHit = playedNotesRef.current.some(
        p => p.pitch === expMidi && Math.abs(p.timestamp - note.beatMs) < MAX_WINDOW_MS,
      )
      if (!wasHit) {
        playErrorSound()
        setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }))
      }
    }, MAX_WINDOW_MS + 50)
  }, [mode])

  const handleComplete = useCallback(() => {
    isPlayingRef.current = false
    if (mode === 'listen') return

    const scoreResult = evaluatePerformance(pendingExpRef.current, playedNotesRef.current)
    const hits    = new Set<string>()
    const misses  = new Set<string>()
    const matched = new Set<number>()
    let noteIdx = 0
    for (let mi = 0; mi < score.measures.length; mi++) {
      for (let ni = 0; ni < score.measures[mi].treble.length; ni++) {
        if (score.measures[mi].treble[ni].duration.endsWith('r')) continue
        const expected = pendingExpRef.current[noteIdx]
        if (expected) {
          const expMidi = vexFlowToMidi(expected.pitch)
          const matchIdx = playedNotesRef.current.findIndex(
            (p, pi) => !matched.has(pi) && p.pitch === expMidi &&
                        Math.abs(p.timestamp - expected.beatMs) < MAX_WINDOW_MS,
          )
          if (matchIdx >= 0) { hits.add(`${mi}-${ni}`); matched.add(matchIdx) }
          else misses.add(`${mi}-${ni}`)
        }
        noteIdx++
      }
    }
    setHitNotes(hits)
    setMissNotes(misses)
    setTimeout(() => onFinish(scoreResult), 1500)
  }, [score, onFinish, mode])

  const { start, stop, reset, currentBeat, isPlaying, progress } = usePlayback({
    score, bpm,
    metronome,
    autoPlayNotes: mode === 'listen',
    onExpectedNote: handleExpectedNote,
    onComplete: handleComplete,
  })

  // Track MIDI input during practice mode
  useEffect(() => {
    if (!lastNoteOn || !isPlayingRef.current || mode !== 'practice') return
    const timestamp = performance.now() - startTimeRef.current
    playedNotesRef.current.push({ pitch: lastNoteOn.note, timestamp })
    const matchedExp = pendingExpRef.current.find(
      exp => vexFlowToMidi(exp.pitch) === lastNoteOn.note &&
             Math.abs(timestamp - exp.beatMs) < MAX_WINDOW_MS,
    )
    if (matchedExp) {
      playHitSound()
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }))
    }
  }, [lastNoteOn, mode])

  const handleStart = useCallback(() => {
    playedNotesRef.current  = []
    pendingExpRef.current   = []
    setHitNotes(new Set())
    setMissNotes(new Set())
    setStats({ correct: 0, wrong: 0 })
    startTimeRef.current    = performance.now()
    isPlayingRef.current    = true
    start()
  }, [start])

  const handleReset = useCallback(() => {
    reset()
    isPlayingRef.current   = false
    playedNotesRef.current = []
    pendingExpRef.current  = []
    setHitNotes(new Set())
    setMissNotes(new Set())
    setStats({ correct: 0, wrong: 0 })
  }, [reset])

  const handleStop = useCallback(() => {
    stop()
    isPlayingRef.current = false
  }, [stop])

  // Switch mode only when not playing
  const switchMode = useCallback((m: PracticeMode) => {
    if (isPlaying) { handleStop(); handleReset() }
    setMode(m)
  }, [isPlaying, handleStop, handleReset])

  return (
    <div className="practice-layout">

      {/* ══ TOP SECTION ══ */}
      <div className="practice-top-section">
        <OrnateFrame variant="full" className="absolute inset-0 pointer-events-none z-20" />

        <PracticeHeader
          title={score.title}
          composer={score.composer}
          bpm={bpm}
          mode={mode}
          stats={stats}
          onBack={onBack}
        />

        {/* ── Score area ── */}
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

        <PracticeControls
          mode={mode}
          isPlaying={isPlaying}
          metronome={metronome}
          onSwitchMode={switchMode}
          onPlay={handleStart}
          onStop={handleStop}
          onReset={handleReset}
          onToggleMetronome={() => setMetronome(m => !m)}
        />
      </div>

      {/* ══ PIANO KEYBOARD ══ */}
      <div className="practice-keyboard">
        <PianoKeyboard activeKeys={pressedNotes} startNote={36} endNote={96} />
      </div>
    </div>
  )
}
