import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Mic, Square, RotateCcw } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
import { OrnateFrame } from './OrnateFrame'
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

  const trebleNotes = notes.filter(n => n.pitch >= 60)
  const bassNotes = notes.filter(n => n.pitch < 60)

  const origin = notes[0].startTime

  function buildVoice(raw: RawNote[]): MeasureData[] {
    if (raw.length === 0) return []

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

  if (lastNoteOn && isRecording && lastNoteOn.time !== lastProcessedRef.current) {
    lastProcessedRef.current = lastNoteOn.time

    const existing = activeNotesRef.current.get(lastNoteOn.note)
    if (existing && !existing.endTime) {
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
      const now = performance.now()
      for (const n of activeNotesRef.current.values()) {
        if (!n.endTime) n.endTime = now
      }
      const score = buildScoreFromCapture(rawNotesRef.current, bpm)
      setCapturedScore(score)
      setIsRecording(false)
    } else {
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
      <OrnateFrame variant="full" className="absolute inset-0 pointer-events-none z-40" />

      {/* Header — minimal with jewel recording indicator */}
      <div className="flex items-center justify-between px-8 py-4 relative z-30">
        <button onClick={onBack} className="flex items-center gap-3 group cursor-pointer">
          <span className="text-3xl font-serif metallic-gold tracking-wider italic">
            Debussy
          </span>
        </button>

        {/* Gemstone recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-3">
            <div className="gem-indicator active" />
            <span className="text-red-400 text-xs font-serif uppercase tracking-[0.3em]">
              Recording
            </span>
          </div>
        )}
      </div>

      {/* Sheet music area — dark background */}
      <div className="flex-1 sheet-music-dark mx-6 rounded-sm flex flex-col">
        {capturedScore ? (
          <div className="overflow-x-auto flex-1 flex items-center px-4">
            <ScoreRenderer score={capturedScore} darkMode />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center gap-12 px-12">
            {/* Empty staff lines (gold on dark) */}
            {[1, 2].map(row => (
              <div key={row} className="relative h-24 w-full">
                <div className="space-y-[14px]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-[1px] w-full bg-gold/20" />
                  ))}
                </div>
                <div className="absolute left-0 top-[-10px] text-5xl font-serif text-gold/40 select-none">
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
                          <div className="w-6 h-4 rounded-full bg-gold/80 rotate-[-15deg]" />
                          <div className="absolute right-0 bottom-1/2 w-[2px] h-12 bg-gold/60 origin-bottom" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-8 py-4 relative z-30">
        {/* Main controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleRecording}
            className={`ornate-button flex items-center gap-3 px-8 py-3 text-base ${isRecording ? '!bg-gradient-to-b !from-[#3a1515] !to-[#1a0a0a] !text-red-400 !border-red-500/40' : ''}`}
          >
            {isRecording ? <Square size={16} className="fill-current" /> : <Mic size={16} />}
            {isRecording ? 'Stop Recording' : 'Start/Stop Recording'}
          </button>

          <button className="ornate-button-dark px-6 py-3 text-sm font-serif tracking-wider">
            Quantize BPM
          </button>

          <button
            onClick={handleClear}
            className="ornate-button-dark px-6 py-3 text-sm font-serif tracking-wider flex items-center gap-2"
          >
            <RotateCcw size={14} />
            Undo Last Note
          </button>
        </div>

        {/* Right side: decorative knobs + instrument */}
        <div className="flex items-center gap-6">
          {/* Volume knob (decorative) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] relative">
              <div className="absolute top-1 left-1/2 w-[1px] h-2 bg-gold/50 -translate-x-1/2" />
            </div>
            <span className="text-gold/30 text-[7px] uppercase tracking-wider">Vol</span>
          </div>

          {/* Reverb knob (decorative) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] relative">
              <div className="absolute top-1 left-1/2 w-[1px] h-2 bg-gold/50 -translate-x-1/2 rotate-45" />
            </div>
            <span className="text-gold/30 text-[7px] uppercase tracking-wider">Rev</span>
          </div>

          <div className="h-8 w-px bg-gold/10" />

          {/* Instrument selector */}
          <div className="ornate-button-dark px-4 py-2 text-xs font-serif">
            <span className="text-gold/30 text-[7px] uppercase tracking-wider block mb-0.5">Instrument</span>
            <span className="text-gold/70 tracking-wider">Grand Piano</span>
          </div>
        </div>
      </div>

      {/* Piano keyboard */}
      <div className="h-52 relative z-20">
        <PianoKeyboard activeKeys={pressedNotes} />
      </div>
    </div>
  )
}
