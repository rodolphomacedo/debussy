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
    <div className="h-full flex flex-col bg-piano-black overflow-hidden relative">
      <OrnateFrame variant="full" className="absolute inset-0 pointer-events-none z-40" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 relative z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gold/50 hover:text-gold transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-serif text-sm tracking-wider">Home</span>
          </button>
          <span className="text-gold/15">|</span>
          <span className="text-2xl font-serif metallic-gold tracking-wider italic">Debussy</span>
        </div>
        <div className="flex items-center gap-3 text-gold/40 text-xs font-serif italic tracking-wider">
          <span>{score.title}</span>
          <span className="text-gold/20">·</span>
          <span>{score.composer}</span>
          <span className="text-gold/20">·</span>
          <span>{bpm} BPM</span>
        </div>
      </div>

      {/* Sheet music area */}
      <div className="flex-1 sheet-music-dark mx-6 rounded-sm" style={{ minHeight: '280px', overflowX: 'auto' }}>
        <div style={{ padding: '8px 16px' }}>
          <ScoreRenderer
            score={score}
            cursorBeat={isPlaying ? currentBeat : undefined}
            hitNotes={hitNotes.size > 0 ? hitNotes : undefined}
            missNotes={missNotes.size > 0 ? missNotes : undefined}
            darkMode
          />
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && (
        <div className="h-1 mx-6 bg-black/60">
          <motion.div
            className="h-full gold-shine"
            style={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Controls bar below sheet music */}
      <div className="flex items-center justify-between px-12 py-4 relative z-30">
        {/* Left: lyre decoration */}
        <LyreIcon size={32} className="text-gold/25" />

        {/* Center: play button + score */}
        <div className="flex items-center gap-8">
          <button
            onClick={isPlaying ? () => { stop(); isPlayingRef.current = false } : handleStart}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f9e29c] to-[#b8860b] p-[2px] shadow-[0_5px_20px_rgba(0,0,0,0.6)] active:translate-y-1 transition-all group cursor-pointer"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center text-gold group-hover:text-white transition-colors">
              {isPlaying
                ? <Pause className="w-8 h-8 fill-current" />
                : <Play className="w-8 h-8 fill-current ml-1" />}
            </div>
          </button>

          <div className="flex items-center gap-4 text-lg font-serif">
            <span className="text-green-500">✓ {stats.correct}</span>
            <span className="text-gold/20">·</span>
            <span className="text-red-500">✗ {stats.wrong}</span>
          </div>
        </div>

        {/* Right: reset */}
        <button
          onClick={handleReset}
          className="ornate-button-dark px-6 py-2 text-sm flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="font-serif tracking-wider">Reset</span>
        </button>
      </div>

      {/* Piano keyboard */}
      <div className="h-52 relative z-20">
        <PianoKeyboard activeKeys={pressedNotes} />
      </div>
    </div>
  )
}
