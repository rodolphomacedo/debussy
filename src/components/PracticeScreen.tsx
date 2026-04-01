import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, RotateCcw, ChevronLeft } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
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

  // Record MIDI notes
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
      {/* Top bar */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border-b-4 border-gold/30 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative z-30 corner-flourishes">
        <div className="leather-texture" />

        <div className="flex items-center gap-6 relative z-10">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-black/60 border-2 border-gold/30 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-serif metallic-gold tracking-[0.15em] leading-none mb-1">
              {score.title.toUpperCase()}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-gold/40 text-[10px] uppercase tracking-[0.3em] font-serif italic">{score.composer}</span>
              <div className="w-1 h-1 rounded-full bg-gold/20" />
              <span className="text-gold/40 text-[10px] uppercase tracking-[0.3em] font-serif">{bpm} BPM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10 relative z-10">
          {/* Stats */}
          <div className="flex gap-8 bg-black/40 px-6 py-2 rounded-xl border border-gold/10 shadow-inner">
            <div className="text-center">
              <div className="text-2xl font-serif text-green-500 leading-none">{stats.correct}</div>
              <div className="text-[9px] text-gold/30 uppercase tracking-[0.25em] mt-1">Correct</div>
            </div>
            <div className="w-px h-8 bg-gold/10 self-center" />
            <div className="text-center">
              <div className="text-2xl font-serif text-red-500 leading-none">{stats.wrong}</div>
              <div className="text-[9px] text-gold/30 uppercase tracking-[0.25em] mt-1">Wrong</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={isPlaying ? () => { stop(); isPlayingRef.current = false } : handleStart}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f9e29c] to-[#b8860b] p-[2px] shadow-[0_5px_20px_rgba(0,0,0,0.6)] active:translate-y-1 transition-all group"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center text-gold group-hover:text-white transition-colors">
                {isPlaying
                  ? <Pause className="w-7 h-7 fill-current" />
                  : <Play className="w-7 h-7 fill-current ml-1" />}
              </div>
            </button>
            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-black/60 border-2 border-gold/30 flex items-center justify-center text-gold/60 hover:text-gold hover:border-gold transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sheet music area */}
      <div className="flex-1 sheet-music-area flex items-center justify-center">
        <div className="w-full overflow-x-auto px-4">
          <ScoreRenderer
            score={score}
            cursorBeat={isPlaying ? currentBeat : undefined}
            hitNotes={hitNotes.size > 0 ? hitNotes : undefined}
            missNotes={missNotes.size > 0 ? missNotes : undefined}
          />
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && (
        <div className="h-1 bg-black/60">
          <motion.div
            className="h-full gold-shine"
            style={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      {/* Piano keyboard */}
      <div className="h-52 bg-gradient-to-t from-[#1a1a1a] via-[#0a0a0a] to-[#2a2a2a] pt-8 border-t-4 border-gold/30 relative shadow-[0_-15px_50px_rgba(0,0,0,0.9)] z-20">
        <div className="leather-texture" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30">
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-gold" />
          <span className="text-gold font-serif italic text-xs tracking-[0.5em]">DEBUSSY</span>
          <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-gold" />
        </div>
        <div className="relative z-10 h-full px-4">
          <PianoKeyboard activeKeys={pressedNotes} />
        </div>
      </div>
    </div>
  )
}
