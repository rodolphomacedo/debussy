import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Mic, Square, RotateCcw, ChevronLeft } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
import { quantizeDuration } from '../lib/quantize'
import { midiToVexFlow } from '../lib/midiToNote'
import type { ScoreData, MeasureData, NoteData } from '../lib/demoScore'

interface CaptureScreenProps {
  pressedNotes: Set<number>
  lastNoteOn: { note: number; velocity: number; time: number } | null
  bpm: number
  onBack: () => void
}

interface RawNote {
  pitch: number
  velocity: number
  startTime: number
  endTime?: number
}

function buildScoreFromCapture(notes: RawNote[], bpm: number): ScoreData | null {
  if (notes.length === 0) return null

  const beatMs = 60_000 / bpm
  const beatsPerMeasure = 3
  const measureMs = beatsPerMeasure * beatMs

  // Split into treble/bass by C4 (MIDI 60)
  const trebleNotes = notes.filter(n => n.pitch >= 60)
  const bassNotes = notes.filter(n => n.pitch < 60)

  const origin = notes[0].startTime

  function buildVoice(raw: RawNote[]): MeasureData[] {
    if (raw.length === 0) return []

    // Group notes into measures
    const measureMap = new Map<number, NoteData[]>()

    for (const n of raw) {
      const relStart = n.startTime - origin
      const dur = (n.endTime ?? n.startTime + beatMs) - n.startTime
      const measureIdx = Math.floor(relStart / measureMs)

      if (!measureMap.has(measureIdx)) measureMap.set(measureIdx, [])
      measureMap.get(measureIdx)!.push({
        keys: [midiToVexFlow(n.pitch)],
        duration: quantizeDuration(dur, bpm),
      })
    }

    const maxMeasure = Math.max(...measureMap.keys())
    const measures: MeasureData[] = []

    for (let i = 0; i <= maxMeasure; i++) {
      const treble = i <= maxMeasure && measureMap.has(i) ? measureMap.get(i)! : [{ keys: ['b/4'], duration: '8r' }, { keys: ['b/4'], duration: '8r' }, { keys: ['b/4'], duration: '8r' }]
      measures.push({
        treble,
        bass: [{ keys: ['d/3'], duration: '4dr' }],
      })
    }

    return measures
  }

  // Build from treble notes (primary) — bass just gets rests for now
  const measures = buildVoice(trebleNotes.length > 0 ? trebleNotes : bassNotes)
  if (measures.length === 0) return null

  return {
    title: 'Captured',
    composer: 'You',
    timeSignature: '3/8',
    numBeats: 3,
    beatValue: 8,
    bpm,
    measures,
  }
}

export function CaptureScreen({ pressedNotes, lastNoteOn, bpm, onBack }: CaptureScreenProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [capturedScore, setCapturedScore] = useState<ScoreData | null>(null)
  const rawNotesRef = useRef<RawNote[]>([])
  const activeNotesRef = useRef<Map<number, RawNote>>(new Map())
  const lastProcessedRef = useRef<number>(0)

  // Process incoming MIDI notes
  if (lastNoteOn && isRecording && lastNoteOn.time !== lastProcessedRef.current) {
    lastProcessedRef.current = lastNoteOn.time

    const existing = activeNotesRef.current.get(lastNoteOn.note)
    if (existing && !existing.endTime) {
      // Note off (re-trigger)
      existing.endTime = lastNoteOn.time
    }

    const newNote: RawNote = {
      pitch: lastNoteOn.note,
      velocity: lastNoteOn.velocity,
      startTime: lastNoteOn.time,
    }
    rawNotesRef.current.push(newNote)
    activeNotesRef.current.set(lastNoteOn.note, newNote)
  }

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording — build score
      const now = performance.now()
      for (const n of activeNotesRef.current.values()) {
        if (!n.endTime) n.endTime = now
      }
      const score = buildScoreFromCapture(rawNotesRef.current, bpm)
      setCapturedScore(score)
      setIsRecording(false)
    } else {
      // Start recording
      rawNotesRef.current = []
      activeNotesRef.current.clear()
      setCapturedScore(null)
      setIsRecording(true)
    }
  }, [isRecording, bpm])

  const handleClear = useCallback(() => {
    rawNotesRef.current = []
    activeNotesRef.current.clear()
    setCapturedScore(null)
  }, [])

  return (
    <div className="h-full flex flex-col bg-piano-black overflow-hidden relative">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border-b-4 border-gold/30 shadow-[0_10px_40px_rgba(0,0,0,0.9)] relative z-30">
        <div className="leather-texture" />

        <div className="flex items-center gap-6 relative z-10">
          <button onClick={onBack} className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/60 border border-gold/30 flex items-center justify-center text-gold/60 group-hover:text-gold group-hover:border-gold transition-all">
              <ChevronLeft size={20} />
            </div>
            <h1 className="text-2xl font-serif metallic-gold tracking-[0.1em]">DEBUSSY</h1>
          </button>
          <div className="h-8 w-px bg-gold/20 mx-2" />
          <div className="flex items-center gap-2 text-gold/40 font-serif italic text-sm tracking-widest uppercase">
            <Mic size={14} className="text-gold/60" />
            Live Transcription
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10">
          {isRecording && (
            <motion.div
              className="rec-pulse flex items-center gap-3 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-[0.3em]"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              Recording
            </motion.div>
          )}
        </div>
      </header>

      {/* Sheet music capture area */}
      <main className="flex-1 flex flex-col p-6 gap-6 relative z-10">
        <div className="flex-1 sheet-music-area rounded-lg p-8 flex flex-col">
          {capturedScore ? (
            <div className="overflow-x-auto">
              <ScoreRenderer score={capturedScore} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-12">
              {/* Empty staff lines */}
              {[1, 2].map(row => (
                <div key={row} className="relative h-28 w-full">
                  <div className="space-y-[14px] opacity-20">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[1.5px] w-full bg-black" />)}
                  </div>
                  <div className="absolute left-0 top-[-10px] text-5xl font-serif text-black/40 select-none">
                    {row === 1 ? '\u{1D11E}' : '\u{1D122}'}
                  </div>

                  {isRecording && (
                    <div className="absolute inset-0 flex items-center px-20">
                      <div className="flex gap-8">
                        {Array.from({ length: Math.min(rawNotesRef.current.length, 8) }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, type: 'spring' }}
                          >
                            <div className="w-6 h-4 rounded-full bg-black/80 rotate-[-15deg]" />
                            <div className="absolute right-0 bottom-1/2 w-[2px] h-12 bg-black origin-bottom" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-auto pt-6">
            <button onClick={handleToggleRecording} className={`ornate-button flex items-center gap-3 min-w-[240px] justify-center ${isRecording ? 'text-red-400' : ''}`}>
              {isRecording ? <Square size={18} className="fill-current" /> : <Mic size={18} />}
              {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
            </button>
            <button onClick={handleClear} className="ornate-button flex items-center gap-3 bg-black/40">
              <RotateCcw size={18} />
              CLEAR
            </button>
          </div>

          {/* Info bar */}
          <div className="flex gap-12 items-center justify-center bg-black/5 px-8 py-3 rounded-xl border border-black/5 mt-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-black/40 text-[9px] uppercase tracking-[0.3em] font-elegant">Tempo</span>
              <div className="text-xl font-mono text-black/80 font-bold">{bpm} <span className="text-xs font-serif italic">BPM</span></div>
            </div>
            <div className="w-px h-8 bg-black/10" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-black/40 text-[9px] uppercase tracking-[0.3em] font-elegant">Notes</span>
              <div className="text-xl font-mono text-black/80 font-bold">{rawNotesRef.current.length}</div>
            </div>
            <div className="w-px h-8 bg-black/10" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-black/40 text-[9px] uppercase tracking-[0.3em] font-elegant">Time</span>
              <div className="text-xl font-mono text-black/80 font-bold">3/8</div>
            </div>
          </div>
        </div>
      </main>

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
