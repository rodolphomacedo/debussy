import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Trash2, Plus, Minus,
         Undo2, Play, Download, Upload, Circle } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { ScoreRenderer } from './ScoreRenderer'
import { useAppStore, type Screen } from '../store/useAppStore'
import { importMusicXml } from '../lib/musicXmlImporter'
import { getDurationTicks } from '../lib/scoreBuilder'
import type { ScoreData, MeasureData, NoteData } from '../lib/demoScore'

// ── Props ──────────────────────────────────────────────────────────────────

interface ComposerScreenProps {
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
  pressedNotes: Set<number>
  lastNoteOn: { note: number; velocity: number; time: number } | null
}

// ── Constants ──────────────────────────────────────────────────────────────

const QUARTER_TICKS = 4096

const DURATIONS: { value: string; label: string; key: string }[] = [
  { value: 'w',  label: '1/1', key: '1' },
  { value: 'h',  label: '1/2', key: '2' },
  { value: 'q',  label: '1/4', key: '3' },
  { value: '8',  label: '1/8', key: '4' },
  { value: '16', label: '1/16', key: '5' },
]

const NOTE_SHARP = ['c','c#','d','d#','e','f','f#','g','g#','a','a#','b']
const NOTE_FLAT  = ['c','db','d','eb','e','f','gb','g','ab','a','bb','b']

const TIME_SIGS = ['4/4','3/4','2/4','6/8','3/8','2/2','12/8']

// ── Helpers ────────────────────────────────────────────────────────────────

function midiToVexKey(midi: number, preferFlat: boolean): string {
  const octave = Math.floor(midi / 12) - 1
  const idx = midi % 12
  return `${(preferFlat ? NOTE_FLAT : NOTE_SHARP)[idx]}/${octave}`
}

function ticksPerBeat(beatValue: number): number {
  return (QUARTER_TICKS * 4) / beatValue
}

function measureTicks(numBeats: number, beatValue: number): number {
  return numBeats * ticksPerBeat(beatValue)
}

function staffTicks(notes: NoteData[]): number {
  return notes.reduce((s, n) => s + getDurationTicks(n.duration), 0)
}

/** Beat position inside a measure for cursor at noteIdx */
function beatInMeasure(notes: NoteData[], noteIdx: number, beatValue: number): number {
  const tpb = ticksPerBeat(beatValue)
  const ticks = notes.slice(0, noteIdx).reduce((s, n) => s + getDurationTicks(n.duration), 0)
  return ticks / tpb
}

/** Global cursorBeat value for ScoreRenderer */
function computeCursorBeat(
  measureIdx: number, noteIdx: number,
  measures: MeasureData[], staff: 'treble' | 'bass',
  numBeats: number, beatValue: number,
): number {
  const notes = measures[measureIdx]?.[staff] ?? []
  return measureIdx * numBeats + beatInMeasure(notes, noteIdx, beatValue)
}

function parseTimeSig(sig: string): { numBeats: number; beatValue: number } {
  const [a, b] = sig.split('/').map(Number)
  return { numBeats: a || 4, beatValue: b || 4 }
}

/** Ensure each staff has at least a rest placeholder for VexFlow */
function withRestFill(score: ScoreData): ScoreData {
  const rest = (clef: 'treble' | 'bass'): NoteData => ({
    keys: [clef === 'treble' ? 'b/4' : 'd/3'],
    duration: 'wr',
  })
  return {
    ...score,
    measures: score.measures.map(m => ({
      treble: m.treble.length > 0 ? m.treble : [rest('treble')],
      bass:   m.bass.length   > 0 ? m.bass   : [rest('bass')],
    })),
  }
}

function emptyMeasure(): MeasureData {
  return { treble: [], bass: [] }
}

function cloneScore(m: MeasureData[]): MeasureData[] {
  return m.map(measure => ({
    treble: measure.treble.map(n => ({ ...n, keys: [...n.keys] })),
    bass:   measure.bass.map(n =>   ({ ...n, keys: [...n.keys] })),
  }))
}

// ── Note symbols (inline SVG) ──────────────────────────────────────────────

function NoteIcon({ dur, dotted, size = 22 }: { dur: string; dotted?: boolean; size?: number }) {
  const filled = dur !== 'w' && dur !== 'h'
  const hasStem = dur !== 'w'
  const flags = dur === '8' ? 1 : dur === '16' ? 2 : 0
  const w = size * 0.9
  const h = size * 1.3
  return (
    <svg width={w} height={h} viewBox="0 0 18 26" fill="none" style={{ display: 'block' }}>
      {/* note head */}
      <ellipse cx="8" cy="21" rx="6" ry="4.2"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.6"
        transform="rotate(-15 8 21)"
      />
      {/* stem */}
      {hasStem && <line x1="14" y1="19" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5"/>}
      {/* flag 1 */}
      {flags >= 1 && <path d="M14 4 C22 7 20 13 14 14" stroke="currentColor" strokeWidth="1.5" fill="none"/>}
      {/* flag 2 */}
      {flags >= 2 && <path d="M14 10 C22 13 20 19 14 20" stroke="currentColor" strokeWidth="1.5" fill="none"/>}
      {/* dot */}
      {dotted && <circle cx="17" cy="20" r="1.5" fill="currentColor"/>}
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function ComposerScreen({
  onNavigate, pressedNotes, lastNoteOn,
}: ComposerScreenProps) {
  const setSelectedScore = useAppStore(s => s.setSelectedScore)
  const setBpm           = useAppStore(s => s.setBpm)

  // ── Score metadata ─────────────────────────────────────────────────────
  const [title,    setTitle]    = useState('New Piece')
  const [composer, setComposer] = useState('')
  const [bpmStr,   setBpmStr]   = useState('90')
  const [timeSig,  setTimeSig]  = useState('4/4')

  // ── Score content ──────────────────────────────────────────────────────
  const [measures,  setMeasures]  = useState<MeasureData[]>([emptyMeasure()])
  const [history,   setHistory]   = useState<MeasureData[][]>([])

  // ── Cursor ─────────────────────────────────────────────────────────────
  const [curMeasure, setCurMeasure] = useState(0)
  const [curNote,    setCurNote]    = useState(0)
  const [curStaff,   setCurStaff]   = useState<'treble' | 'bass'>('treble')

  // ── Input mode ─────────────────────────────────────────────────────────
  const [inputMode,  setInputMode]  = useState(true)
  const [selDur,     setSelDur]     = useState('q')
  const [isDotted,   setIsDotted]   = useState(false)
  const [accidental, setAccidental] = useState<'' | '#' | 'b'>('')

  // ── Import ─────────────────────────────────────────────────────────────
  const [importErr, setImportErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Derived ────────────────────────────────────────────────────────────
  const { numBeats, beatValue } = parseTimeSig(timeSig)
  const score: ScoreData = {
    title: title || 'Untitled',
    composer,
    timeSignature: timeSig,
    numBeats,
    beatValue,
    bpm: parseInt(bpmStr) || 90,
    measures,
  }
  const displayScore = withRestFill(score)
  const cursorBeat = computeCursorBeat(curMeasure, curNote, measures, curStaff, numBeats, beatValue)

  // ── Undo ───────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    setHistory(h => [...h.slice(-30), cloneScore(measures)])
  }, [measures])

  const undo = useCallback(() => {
    if (history.length === 0) return
    setMeasures(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }, [history])

  // ── Insert / delete ────────────────────────────────────────────────────
  const insertNote = useCallback((midi: number) => {
    if (!inputMode) return
    const preferFlat = accidental === 'b'
    const key = midiToVexKey(midi, preferFlat)
    const dur = isDotted ? `${selDur}d` : selDur
    const note: NoteData = { keys: [key], duration: dur }

    saveHistory()

    setMeasures(prev => {
      const next = cloneScore(prev)
      next[curMeasure][curStaff].splice(curNote, 0, note)
      return next
    })

    // Advance cursor — if measure is now full, move to next
    setCurNote(prev => {
      const newIdx = prev + 1
      const newNotes = measures[curMeasure][curStaff]
      const newTicks = staffTicks([...newNotes.slice(0, prev), note])
      const maxTicks = measureTicks(numBeats, beatValue)
      if (newTicks >= maxTicks && curMeasure < measures.length - 1) {
        setCurMeasure(m => m + 1)
        return 0
      }
      return newIdx
    })
  }, [inputMode, accidental, isDotted, selDur, saveHistory, curMeasure, curNote, curStaff, measures, numBeats, beatValue])

  const insertRest = useCallback(() => {
    if (!inputMode) return
    const dur = isDotted ? `${selDur}d` : selDur
    const key = curStaff === 'treble' ? 'b/4' : 'd/3'
    const note: NoteData = { keys: [key], duration: `${dur}r` }

    saveHistory()
    setMeasures(prev => {
      const next = cloneScore(prev)
      next[curMeasure][curStaff].splice(curNote, 0, note)
      return next
    })
    setCurNote(n => n + 1)
  }, [inputMode, isDotted, selDur, curStaff, saveHistory, curMeasure, curNote])

  const deletePrev = useCallback(() => {
    if (curNote === 0) {
      if (curMeasure > 0) {
        const prevLen = measures[curMeasure - 1][curStaff].length
        setCurMeasure(m => m - 1)
        setCurNote(prevLen)
      }
      return
    }
    saveHistory()
    setMeasures(prev => {
      const next = cloneScore(prev)
      next[curMeasure][curStaff].splice(curNote - 1, 1)
      return next
    })
    setCurNote(n => Math.max(0, n - 1))
  }, [measures, curMeasure, curNote, curStaff, saveHistory])

  // ── Cursor navigation ──────────────────────────────────────────────────
  const movePrev = useCallback(() => {
    if (curNote > 0) {
      setCurNote(n => n - 1)
    } else if (curMeasure > 0) {
      setCurMeasure(m => m - 1)
      setCurNote(measures[curMeasure - 1][curStaff].length)
    }
  }, [curNote, curMeasure, curStaff, measures])

  const moveNext = useCallback(() => {
    const len = measures[curMeasure][curStaff].length
    if (curNote < len) {
      setCurNote(n => n + 1)
    } else if (curMeasure < measures.length - 1) {
      setCurMeasure(m => m + 1)
      setCurNote(0)
    }
  }, [curNote, curMeasure, curStaff, measures])

  const toggleStaff = useCallback(() => {
    setCurStaff(s => s === 'treble' ? 'bass' : 'treble')
    setCurNote(0)
  }, [])

  // ── Measure operations ─────────────────────────────────────────────────
  const addMeasure = useCallback(() => {
    saveHistory()
    setMeasures(prev => [...prev, emptyMeasure()])
  }, [saveHistory])

  const removeMeasure = useCallback(() => {
    if (measures.length <= 1) return
    saveHistory()
    setMeasures(prev => prev.slice(0, -1))
    if (curMeasure >= measures.length - 1) {
      setCurMeasure(measures.length - 2)
      setCurNote(0)
    }
  }, [measures, curMeasure, saveHistory])

  // ── MIDI input ─────────────────────────────────────────────────────────
  const lastNoteRef = useRef<typeof lastNoteOn>(null)
  useEffect(() => {
    if (!lastNoteOn || !inputMode) return
    if (lastNoteRef.current?.time === lastNoteOn.time) return
    lastNoteRef.current = lastNoteOn
    insertNote(lastNoteOn.note)
  }, [lastNoteOn, inputMode, insertNote])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT') return

      switch (e.key) {
        case '1': setSelDur('w'); break
        case '2': setSelDur('h'); break
        case '3': setSelDur('q'); break
        case '4': setSelDur('8'); break
        case '5': setSelDur('16'); break
        case '.': setIsDotted(d => !d); break
        case 'r': case 'R': if (inputMode) insertRest(); break
        case 'ArrowLeft':  e.preventDefault(); movePrev(); break
        case 'ArrowRight': e.preventDefault(); moveNext(); break
        case 'ArrowUp': case 'ArrowDown': e.preventDefault(); toggleStaff(); break
        case 'Backspace': case 'Delete': e.preventDefault(); if (inputMode) deletePrev(); break
        case 'z':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); undo() }
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputMode, insertRest, movePrev, moveNext, toggleStaff, deletePrev, undo])

  // ── Import ─────────────────────────────────────────────────────────────
  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportErr(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string
        const imported: ScoreData = file.name.endsWith('.json')
          ? JSON.parse(text) as ScoreData
          : importMusicXml(text)
        if (!imported.measures?.length) throw new Error('No measures found')
        setTitle(imported.title)
        setComposer(imported.composer)
        setBpmStr(String(imported.bpm))
        setTimeSig(imported.timeSignature)
        setMeasures(imported.measures)
        setCurMeasure(0); setCurNote(0); setCurStaff('treble')
        setHistory([])
      } catch (err) { setImportErr((err as Error).message) }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(score, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${score.title.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [score])

  const handlePractice = useCallback(() => {
    setSelectedScore(score)
    setBpm(score.bpm)
    onNavigate('practice')
  }, [score, setSelectedScore, setBpm, onNavigate])

  // ── Current measure ticks fill info ───────────────────────────────────
  const curNotes     = measures[curMeasure]?.[curStaff] ?? []
  const curTicks     = staffTicks(curNotes)
  const maxTicks     = measureTicks(numBeats, beatValue)
  const fillPct      = Math.min(100, Math.round((curTicks / maxTicks) * 100))
  const curDurLabel  = DURATIONS.find(d => d.value === selDur)?.label ?? selDur

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-piano-black" tabIndex={-1}>
      <div className="leather-texture" />

      {/* ── Top metadata bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gold/10 bg-black/40 relative z-10 shrink-0">
        <button
          onClick={() => onNavigate('home')}
          className="text-gold/50 hover:text-gold transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="composer-meta-input w-32 sm:w-44 font-serif text-gold/90 text-sm"
            placeholder="Title" />
          <input value={composer} onChange={e => setComposer(e.target.value)}
            className="composer-meta-input w-24 sm:w-36 text-gold/60 text-xs italic"
            placeholder="Composer" />
          <input type="number" min={20} max={300} value={bpmStr}
            onChange={e => setBpmStr(e.target.value)}
            className="composer-meta-input w-14 text-gold/60 text-xs text-center"
            placeholder="BPM" />
          <select value={timeSig} onChange={e => setTimeSig(e.target.value)}
            className="composer-meta-input text-gold/60 text-xs">
            {TIME_SIGS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport}
            className="composer-action-btn hidden sm:flex" title="Export JSON">
            <Download size={13} />
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="composer-action-btn hidden sm:flex" title="Import .xml / .json">
            <Upload size={13} />
          </button>
          <button onClick={handlePractice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-gold-light to-gold text-black text-xs font-serif tracking-wider cursor-pointer hover:brightness-110 transition-all">
            <Play size={11} className="fill-current" />
            <span className="hidden sm:inline">Practice</span>
          </button>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 border-b border-gold/10 bg-black/30 relative z-10 shrink-0 overflow-x-auto">

        {/* Input mode toggle */}
        <button
          onClick={() => setInputMode(m => !m)}
          title="Note input mode (N)"
          className={`composer-tool-btn flex items-center gap-1 px-2 ${inputMode ? 'composer-tool-active' : ''}`}
        >
          <Circle size={8} className={inputMode ? 'fill-current text-red-400' : 'text-gold/40'} />
          <span className="text-[10px] font-mono hidden sm:inline">{inputMode ? 'INPUT' : 'SELECT'}</span>
        </button>

        <div className="composer-divider" />

        {/* Duration buttons */}
        {DURATIONS.map(d => (
          <button
            key={d.value}
            onClick={() => setSelDur(d.value)}
            title={`${d.label} (${d.key})`}
            className={`composer-tool-btn flex flex-col items-center gap-0.5 px-1.5 py-1 ${selDur === d.value ? 'composer-tool-active' : ''}`}
          >
            <NoteIcon dur={d.value} dotted={isDotted && selDur === d.value} />
            <span className="text-[8px] font-mono text-gold/40">{d.key}</span>
          </button>
        ))}

        {/* Dotted */}
        <button
          onClick={() => setIsDotted(d => !d)}
          title="Dotted (.)"
          className={`composer-tool-btn px-2 text-base font-bold leading-none ${isDotted ? 'composer-tool-active' : ''}`}
        >·</button>

        <div className="composer-divider" />

        {/* Accidentals */}
        {(['', '#', 'b'] as const).map(acc => (
          <button key={acc} onClick={() => setAccidental(acc)}
            title={acc === '' ? 'Natural' : acc === '#' ? 'Sharp' : 'Flat'}
            className={`composer-tool-btn w-7 text-sm font-bold ${accidental === acc ? 'composer-tool-active' : ''}`}>
            {acc === '' ? '♮' : acc === '#' ? '♯' : '♭'}
          </button>
        ))}

        <div className="composer-divider" />

        {/* Rest */}
        <button onClick={insertRest} disabled={!inputMode}
          title="Insert rest (R)"
          className="composer-tool-btn px-2 text-base disabled:opacity-30">𝄽</button>

        <div className="composer-divider" />

        {/* Navigation */}
        <button onClick={movePrev} title="Previous (←)" className="composer-tool-btn px-1.5">
          <ArrowLeft size={12} />
        </button>
        <button onClick={moveNext} title="Next (→)" className="composer-tool-btn px-1.5">
          <ArrowRight size={12} />
        </button>
        <button onClick={toggleStaff} title="Switch staff (↑↓)" className="composer-tool-btn px-1.5">
          <ArrowUp size={10} /><ArrowDown size={10} />
        </button>
        <button onClick={deletePrev} disabled={!inputMode}
          title="Delete (Backspace)" className="composer-tool-btn px-1.5 disabled:opacity-30">
          <Trash2 size={12} />
        </button>

        <div className="composer-divider" />

        {/* Measure ops */}
        <button onClick={addMeasure} title="Add measure" className="composer-tool-btn px-1.5">
          <Plus size={12} />
        </button>
        <button onClick={removeMeasure} disabled={measures.length <= 1}
          title="Remove last measure" className="composer-tool-btn px-1.5 disabled:opacity-30">
          <Minus size={12} />
        </button>

        <div className="composer-divider" />

        {/* Undo */}
        <button onClick={undo} disabled={history.length === 0}
          title="Undo (Ctrl+Z)" className="composer-tool-btn px-1.5 disabled:opacity-30">
          <Undo2 size={12} />
        </button>
      </div>

      {/* ── Score area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto relative" style={{ minHeight: 0 }}>
        <div className="p-4 pb-2">
          {importErr && (
            <div className="mb-2 px-3 py-1.5 bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-mono">
              {importErr}
            </div>
          )}
          <ScoreRenderer
            score={displayScore}
            cursorBeat={cursorBeat}
            darkMode
          />
        </div>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-gold/10 bg-black/40 text-[10px] font-mono text-gold/40 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${curStaff === 'treble' ? 'text-gold/70' : 'text-gold/30'}`}>TREBLE</span>
          <span className={`font-semibold ${curStaff === 'bass' ? 'text-gold/70' : 'text-gold/30'}`}>BASS</span>
          <span>M.{curMeasure + 1} · note {curNote + 1}/{curNotes.length + 1}</span>
          <span className={fillPct >= 100 ? 'text-green-400/60' : ''}>{fillPct}% full</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{curDurLabel}{isDotted ? '.' : ''} {accidental === '#' ? '♯' : accidental === 'b' ? '♭' : '♮'}</span>
          <span className="hidden sm:inline">{measures.length} measure{measures.length !== 1 ? 's' : ''}</span>
          {/* Mobile import/export */}
          <button onClick={handleExport} className="sm:hidden text-gold/40 hover:text-gold/70 cursor-pointer">
            <Download size={11} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="sm:hidden text-gold/40 hover:text-gold/70 cursor-pointer">
            <Upload size={11} />
          </button>
        </div>
      </div>

      {/* ── Piano keyboard ────────────────────────────────────────────── */}
      <div className="shrink-0" style={{ height: 'clamp(90px, 18vh, 150px)' }}>
        <PianoKeyboard
          activeKeys={pressedNotes}
          startNote={48}
          endNote={84}
          onNoteClick={inputMode ? insertNote : undefined}
        />
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".xml,.mxl,.json"
        onChange={handleImport} className="hidden" />
    </div>
  )
}
