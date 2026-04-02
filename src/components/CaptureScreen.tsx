import { useCallback, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Mic, Square, RotateCcw, ArrowLeft } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
import { OrnateFrame } from './OrnateFrame'
import { useAppStore } from '../store/useAppStore'
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

function RotaryKnob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const knobRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const rotation = -135 + value * 270 // -135 to +135 degrees

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !knobRef.current) return
    const rect = knobRef.current.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    const delta = (centerY - e.clientY) / 80
    onChange(Math.max(0, Math.min(1, value + delta * 0.05)))
  }, [value, onChange])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        ref={knobRef}
        className="w-10 h-10 rounded-full cursor-grab active:cursor-grabbing relative"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          background: 'conic-gradient(from 210deg, #1a1408, #3d2e14, #2a1e0c, #1a1408)',
          border: '2px solid rgba(180, 145, 45, 0.35)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        {/* Indicator notch */}
        <div
          className="absolute top-[3px] left-1/2 w-[2px] h-3 rounded-full origin-bottom"
          style={{
            background: 'linear-gradient(to bottom, #d4af37, #8e6d10)',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: '50% 250%',
          }}
        />
        {/* Center dot */}
        <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-[#2a2208] to-[#0e0c06] border border-gold/10" />
      </div>
      <span className="text-gold/35 text-[8px] uppercase tracking-[0.15em] font-serif">{label}</span>
    </div>
  )
}

function VerticalSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateValue = useCallback((clientY: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = 1 - (clientY - rect.top) / rect.height
    onChange(Math.max(0, Math.min(1, ratio)))
  }, [onChange])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updateValue(e.clientY)
  }, [updateValue])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updateValue(e.clientY)
  }, [updateValue])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        ref={trackRef}
        className="w-3 h-20 rounded-full relative cursor-pointer"
        style={{
          background: 'linear-gradient(to bottom, #1a1408, #0e0b06)',
          border: '1px solid rgba(180, 145, 45, 0.2)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{
            height: `${value * 100}%`,
            background: 'linear-gradient(to top, #8e6d10, #d4af37)',
            opacity: 0.6,
          }}
        />
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-3 rounded-sm"
          style={{
            bottom: `calc(${value * 100}% - 6px)`,
            background: 'linear-gradient(to bottom, #d4af37, #8e6d10)',
            border: '1px solid rgba(255,225,100,0.3)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        />
      </div>
      <span className="text-gold/35 text-[8px] uppercase tracking-[0.15em] font-serif">{label}</span>
    </div>
  )
}

export function CaptureScreen({ pressedNotes, lastNoteOn, bpm, onBack }: CaptureScreenProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [capturedScore, setCapturedScore] = useState<ScoreData | null>(null)
  const rawNotesRef = useRef<RawNote[]>([])
  const activeNotesRef = useRef<Map<number, RawNote>>(new Map())
  const lastProcessedRef = useRef<number>(0)

  const pianoVolume = useAppStore(s => s.pianoVolume)
  const setPianoVolume = useAppStore(s => s.setPianoVolume)
  const sustainLock = useAppStore(s => s.sustainLock)
  const setSustainLock = useAppStore(s => s.setSustainLock)

  // Local knob states for reverb (decorative for now)
  const [reverbAmount, setReverbAmount] = useState(0.3)

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

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-2 sm:py-3 relative z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gold/50 hover:text-gold transition-colors cursor-pointer group">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <span className="text-lg sm:text-2xl font-serif metallic-gold tracking-wider italic">
            Debussy
          </span>
        </div>

        {/* Gemstone recording indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isRecording && (
            <>
              <div className="gem-indicator active" />
              <span className="hidden sm:inline text-red-400 text-xs font-serif uppercase tracking-[0.3em]">
                Recording
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main content area — sheet music + sidebar (stacked on mobile) */}
      <div className="flex-1 flex flex-col sm:flex-row relative z-10 overflow-hidden">
        {/* Sheet music area */}
        <div className="flex-1 sheet-music-dark mx-3 sm:mx-4 sm:ml-6 rounded-sm flex flex-col">
          {capturedScore ? (
            <div className="overflow-x-auto flex-1 flex items-center px-2 sm:px-4">
              <ScoreRenderer score={capturedScore} darkMode />
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-6 sm:gap-10 px-4 sm:px-10">
              {[1, 2].map(row => (
                <div key={row} className="relative h-16 sm:h-20 w-full">
                  <div className="space-y-[14px]">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-[1px] w-full bg-gold/20" />
                    ))}
                  </div>
                  <div className="absolute left-0 top-[-10px] text-4xl sm:text-5xl font-serif text-gold/40 select-none">
                    {row === 1 ? '\u{1D11E}' : '\u{1D122}'}
                  </div>

                  {isRecording && (
                    <div className="absolute inset-0 flex items-center px-10 sm:px-20">
                      <div className="flex gap-4 sm:gap-8">
                        {Array.from({ length: Math.min(rawNotesRef.current.length, 8) }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, type: 'spring' }}
                          >
                            <div className="w-4 sm:w-6 h-3 sm:h-4 rounded-full bg-gold/80 rotate-[-15deg]" />
                            <div className="absolute right-0 bottom-1/2 w-[2px] h-8 sm:h-12 bg-gold/60 origin-bottom" />
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

        {/* Sidebar — vertical on tablet+, horizontal strip on mobile */}
        <div className="flex sm:flex-col items-center justify-around sm:justify-between py-2 sm:py-4 px-4 sm:px-0 sm:w-20 sm:mr-4">
          <VerticalSlider label="Volume" value={pianoVolume} onChange={setPianoVolume} />
          <RotaryKnob label="Reverb" value={reverbAmount} onChange={setReverbAmount} />

          {/* Sustain lock toggle */}
          <button
            onClick={() => setSustainLock(!sustainLock)}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: sustainLock
                  ? 'linear-gradient(135deg, #d4af37, #8e6d10)'
                  : 'linear-gradient(135deg, #2a2a2a, #0a0a0a)',
                border: `2px solid ${sustainLock ? 'rgba(249,226,156,0.5)' : 'rgba(180,145,45,0.25)'}`,
                boxShadow: sustainLock
                  ? '0 0 10px rgba(212,175,55,0.3), inset 0 1px 2px rgba(255,225,100,0.3)'
                  : 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              <span className="text-[10px] font-serif font-bold" style={{ color: sustainLock ? '#1a1408' : 'rgba(212,175,55,0.4)' }}>
                S
              </span>
            </div>
            <span className="text-gold/35 text-[7px] uppercase tracking-[0.12em] font-serif leading-tight text-center">
              Sustain{'\n'}Lock
            </span>
          </button>

          {/* Instrument label */}
          <div className="text-center hidden sm:block">
            <span className="text-gold/25 text-[7px] uppercase tracking-[0.12em] font-serif block">Instrument</span>
            <span className="text-gold/50 text-[8px] font-serif tracking-wider block mt-0.5">Grand</span>
            <span className="text-gold/50 text-[8px] font-serif tracking-wider block">Piano</span>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 px-4 sm:px-8 py-2 sm:py-3 relative z-30 flex-wrap">
        <button
          onClick={handleToggleRecording}
          className={`ornate-button flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm ${isRecording ? '!bg-gradient-to-b !from-[#3a1515] !to-[#1a0a0a] !text-red-400 !border-red-500/40' : ''}`}
        >
          {isRecording ? <Square size={14} className="fill-current" /> : <Mic size={14} />}
          <span className="hidden sm:inline">{isRecording ? 'Stop Recording' : 'Start/Stop Recording'}</span>
          <span className="sm:hidden">{isRecording ? 'Stop' : 'Record'}</span>
        </button>

        <button className="ornate-button-dark px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-serif tracking-wider">
          <span className="hidden sm:inline">Quantize BPM</span>
          <span className="sm:hidden">Quantize</span>
        </button>

        <button
          onClick={handleClear}
          className="ornate-button-dark px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-serif tracking-wider flex items-center gap-1 sm:gap-2"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Undo Last Note</span>
          <span className="sm:hidden">Undo</span>
        </button>
      </div>

      {/* Piano keyboard */}
      <div className="h-36 sm:h-44 lg:h-52 relative z-20">
        <PianoKeyboard activeKeys={pressedNotes} />
      </div>
    </div>
  )
}
