import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, Trash2, Upload, Download, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { NavBar } from './NavBar'
import { ScoreRenderer } from './ScoreRenderer'
import { useAppStore, type Screen } from '../store/useAppStore'
import { parseNoteText, noteDataToText } from '../lib/composerParser'
import { importMusicXml } from '../lib/musicXmlImporter'
import type { ScoreData, MeasureData } from '../lib/demoScore'

interface ComposerScreenProps {
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
}

interface MeasureEntry {
  id: string
  treble: string
  bass: string
}

interface ParseErrors {
  [measureId: string]: { treble?: string; bass?: string }
}

const TIME_SIGS = ['4/4', '3/4', '2/4', '6/8', '3/8', '2/2', '12/8']

const HELP_TEXT = `Note format: Pitch/Duration
  C4/q  → C4 quarter   D#5/8 → D#5 eighth
  Bb3/h → Bb3 half     F4/w  → F4 whole
  C4/16 → 16th note    C4/qd → dotted quarter
  rest/q → quarter rest
  (C4,E4,G4)/q → chord

Durations: w h q 8 16 32  (+d for dotted)
Separate notes with commas: E5/8, D#5/8, E5/8`

function uid() {
  return Math.random().toString(36).slice(2)
}

function parseTimeSig(sig: string): { numBeats: number; beatValue: number } | null {
  const m = sig.match(/^(\d+)\/(\d+)$/)
  if (!m) return null
  return { numBeats: parseInt(m[1]), beatValue: parseInt(m[2]) }
}

function buildScore(
  title: string,
  composer: string,
  bpmStr: string,
  timeSig: string,
  measures: MeasureEntry[],
): { score: ScoreData; errors: ParseErrors } | { score: null; errors: ParseErrors } {
  const ts = parseTimeSig(timeSig)
  if (!ts) return { score: null, errors: { _meta: { treble: `Invalid time signature: "${timeSig}"` } } }

  const bpm = parseInt(bpmStr) || 72
  const parsedMeasures: MeasureData[] = []
  const errors: ParseErrors = {}

  for (const m of measures) {
    let trebleNotes = m.treble.trim() ? [] : [{ keys: ['b/4'], duration: 'qr' }]
    let bassNotes = m.bass.trim() ? [] : [{ keys: ['d/3'], duration: 'qr' }]

    if (m.treble.trim()) {
      try {
        trebleNotes = parseNoteText(m.treble, 'treble')
      } catch (e) {
        errors[m.id] = { ...errors[m.id], treble: (e as Error).message }
      }
    }

    if (m.bass.trim()) {
      try {
        bassNotes = parseNoteText(m.bass, 'bass')
      } catch (e) {
        errors[m.id] = { ...errors[m.id], bass: (e as Error).message }
      }
    }

    parsedMeasures.push({ treble: trebleNotes, bass: bassNotes })
  }

  if (Object.keys(errors).length > 0) return { score: null, errors }

  return {
    score: {
      title: title || 'Untitled',
      composer: composer || '',
      timeSignature: timeSig,
      numBeats: ts.numBeats,
      beatValue: ts.beatValue,
      bpm,
      measures: parsedMeasures,
    },
    errors: {},
  }
}

function scoreToMeasureEntries(score: ScoreData): MeasureEntry[] {
  return score.measures.map(m => ({
    id: uid(),
    treble: noteDataToText(m.treble.filter(n => !n.duration.endsWith('r'))).trim() ||
      (m.treble.every(n => n.duration.endsWith('r')) ? '' : noteDataToText(m.treble)),
    bass: noteDataToText(m.bass.filter(n => !n.duration.endsWith('r'))).trim() ||
      (m.bass.every(n => n.duration.endsWith('r')) ? '' : noteDataToText(m.bass)),
  }))
}

export function ComposerScreen({ onNavigate, isConnected, deviceName }: ComposerScreenProps) {
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen)
  const setSelectedScore = useAppStore(s => s.setSelectedScore)
  const setBpm = useAppStore(s => s.setBpm)
  const navigate = (s: Screen) => { setSettingsOpen(false); onNavigate(s) }

  const [title, setTitle] = useState('My Piece')
  const [composer, setComposer] = useState('')
  const [bpmStr, setBpmStr] = useState('90')
  const [timeSig, setTimeSig] = useState('4/4')
  const [measures, setMeasures] = useState<MeasureEntry[]>(() => [
    { id: uid(), treble: 'C5/q, E5/q, G5/q, C6/q', bass: '(C3,E3,G3)/h, (C3,E3,G3)/h' },
  ])

  const [previewScore, setPreviewScore] = useState<ScoreData | null>(null)
  const [errors, setErrors] = useState<ParseErrors>({})
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced parse on any change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const result = buildScore(title, composer, bpmStr, timeSig, measures)
      setPreviewScore(result.score)
      setErrors(result.errors)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [title, composer, bpmStr, timeSig, measures])

  const addMeasure = useCallback(() => {
    setMeasures(prev => [...prev, { id: uid(), treble: '', bass: '' }])
  }, [])

  const removeMeasure = useCallback((id: string) => {
    setMeasures(prev => prev.length > 1 ? prev.filter(m => m.id !== id) : prev)
  }, [])

  const updateMeasure = useCallback((id: string, field: 'treble' | 'bass', value: string) => {
    setMeasures(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }, [])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        let score: ScoreData

        if (file.name.endsWith('.json')) {
          score = JSON.parse(text) as ScoreData
          if (!score.measures || !score.title) throw new Error('Invalid JSON: missing title or measures')
        } else {
          score = importMusicXml(text)
        }

        setTitle(score.title)
        setComposer(score.composer)
        setBpmStr(String(score.bpm))
        setTimeSig(score.timeSignature)
        setMeasures(scoreToMeasureEntries(score))
      } catch (err) {
        setImportError((err as Error).message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleExport = useCallback(() => {
    if (!previewScore) return
    const json = JSON.stringify(previewScore, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${previewScore.title.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [previewScore])

  const handlePractice = useCallback(() => {
    if (!previewScore) return
    setSelectedScore(previewScore)
    setBpm(previewScore.bpm)
    onNavigate('practice')
  }, [previewScore, setSelectedScore, setBpm, onNavigate])

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="leather-texture" />

      <NavBar
        currentScreen="home"
        onNavigate={navigate}
        isConnected={isConnected}
        deviceName={deviceName}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {/* Back + title bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2 border-b border-gold/10 bg-black/30 relative z-10">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-gold/60 hover:text-gold transition-colors text-sm font-serif cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Home</span>
        </button>
        <span className="text-gold/20">·</span>
        <span className="text-gold/70 font-serif tracking-wider text-sm">Score Composer</span>
      </div>

      {/* Main two-column layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* ── Left: Editor panel ── */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4 gap-4 lg:max-w-[55%]">

          {/* Metadata */}
          <div className="ornate-card p-4 sm:p-5">
            <h3 className="font-serif text-gold/80 tracking-wider text-sm sm:text-base mb-3">Score Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gold/50 text-xs font-serif mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="composer-input w-full"
                  placeholder="My Piece"
                />
              </div>
              <div>
                <label className="block text-gold/50 text-xs font-serif mb-1">Composer</label>
                <input
                  value={composer}
                  onChange={e => setComposer(e.target.value)}
                  className="composer-input w-full"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-gold/50 text-xs font-serif mb-1">BPM</label>
                <input
                  type="number"
                  min={20}
                  max={300}
                  value={bpmStr}
                  onChange={e => setBpmStr(e.target.value)}
                  className="composer-input w-full"
                />
              </div>
              <div>
                <label className="block text-gold/50 text-xs font-serif mb-1">Time Signature</label>
                <select
                  value={timeSig}
                  onChange={e => setTimeSig(e.target.value)}
                  className="composer-input w-full"
                >
                  {TIME_SIGS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Help section */}
          <div className="ornate-card overflow-hidden">
            <button
              onClick={() => setShowHelp(h => !h)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-gold/60 hover:text-gold/80 transition-colors"
            >
              <span className="font-serif text-xs tracking-wider">Note Format Reference</span>
              {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showHelp && (
              <pre className="px-4 pb-3 text-gold/50 text-[10px] sm:text-xs font-mono leading-relaxed border-t border-gold/10">
                {HELP_TEXT}
              </pre>
            )}
          </div>

          {/* Import error */}
          {importError && (
            <div className="px-4 py-2 bg-red-900/30 border border-red-700/50 rounded text-red-400 text-xs font-mono">
              Import error: {importError}
            </div>
          )}

          {/* Mobile: preview toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowPreview(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 ornate-card text-gold/60 hover:text-gold/80 transition-colors"
            >
              <span className="font-serif text-xs tracking-wider">
                {hasErrors ? '⚠ Fix errors to see preview' : 'Preview Score'}
              </span>
              {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showPreview && previewScore && (
              <div className="mt-2 ornate-card p-3 overflow-x-auto">
                <ScoreRenderer score={previewScore} darkMode />
              </div>
            )}
          </div>

          {/* Measures */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-gold/80 tracking-wider text-sm sm:text-base">
                Measures <span className="text-gold/40 text-xs">({measures.length})</span>
              </h3>
            </div>

            {measures.map((m, idx) => (
              <div key={m.id} className="ornate-card p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gold/50 font-serif text-xs tracking-wider">
                    Measure {idx + 1}
                  </span>
                  {measures.length > 1 && (
                    <button
                      onClick={() => removeMeasure(m.id)}
                      className="text-gold/30 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-gold/40 text-[10px] font-mono mb-1">
                      TREBLE (right hand)
                    </label>
                    <textarea
                      rows={2}
                      value={m.treble}
                      onChange={e => updateMeasure(m.id, 'treble', e.target.value)}
                      className="composer-input w-full resize-none font-mono text-xs"
                      placeholder="E5/8, D#5/8, E5/8"
                    />
                    {errors[m.id]?.treble && (
                      <p className="text-red-400 text-[10px] mt-0.5 font-mono">{errors[m.id].treble}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gold/40 text-[10px] font-mono mb-1">
                      BASS (left hand)
                    </label>
                    <textarea
                      rows={2}
                      value={m.bass}
                      onChange={e => updateMeasure(m.id, 'bass', e.target.value)}
                      className="composer-input w-full resize-none font-mono text-xs"
                      placeholder="(A2,E3,A3)/qd"
                    />
                    {errors[m.id]?.bass && (
                      <p className="text-red-400 text-[10px] mt-0.5 font-mono">{errors[m.id].bass}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addMeasure}
              className="flex items-center justify-center gap-2 py-3 border border-dashed border-gold/20 hover:border-gold/50 text-gold/40 hover:text-gold/70 transition-all font-serif text-sm tracking-wider cursor-pointer"
            >
              <Plus size={14} />
              Add Measure
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pb-6">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gold/30 hover:border-gold/60 text-gold/60 hover:text-gold/90 transition-all font-serif text-xs tracking-wider cursor-pointer"
              >
                <Upload size={13} />
                Import (.xml / .json)
              </button>
              <button
                onClick={handleExport}
                disabled={!previewScore}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gold/30 hover:border-gold/60 text-gold/60 hover:text-gold/90 transition-all font-serif text-xs tracking-wider cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download size={13} />
                Export JSON
              </button>
            </div>

            <button
              onClick={handlePractice}
              disabled={!previewScore}
              className="ornate-button w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={14} className="fill-current" />
              Practice This Score
            </button>
            {hasErrors && (
              <p className="text-center text-gold/40 text-xs font-serif italic">
                Fix the errors above to enable practice
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Preview panel (desktop only) ── */}
        <div className="hidden lg:flex flex-col flex-1 overflow-y-auto border-l border-gold/10 px-6 py-4 gap-4">
          <h3 className="font-serif text-gold/80 tracking-wider text-base shrink-0">Live Preview</h3>

          {previewScore ? (
            <div className="overflow-x-auto">
              <ScoreRenderer score={previewScore} darkMode />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {hasErrors ? (
                <div className="text-center">
                  <p className="text-red-400/70 font-serif text-sm">Fix errors to see preview</p>
                  {Object.entries(errors).map(([id, e]) => {
                    const idx = measures.findIndex(m => m.id === id)
                    return (
                      <div key={id} className="mt-2 text-xs text-red-400/50 font-mono">
                        {idx >= 0 ? `Measure ${idx + 1}: ` : ''}
                        {e.treble ?? e.bass}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gold/30 font-serif italic text-sm">Start adding notes to preview the score</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.mxl,.json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}
