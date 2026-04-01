import { useState } from 'react'
import { NavBar } from './NavBar'
import { OrnateFrame } from './OrnateFrame'
import { ScoreRenderer } from './ScoreRenderer'
import { useAppStore, type Screen } from '../store/useAppStore'
import { FUR_ELISE, type ScoreData } from '../lib/demoScore'

interface SelectionScreenProps {
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
}

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

interface PieceInfo {
  id: string
  title: string
  composer: string
  bpm: number
  difficulty: Difficulty
  score: ScoreData | null
}

const PIECES: PieceInfo[] = [
  { id: '1', title: 'Für Elise', composer: 'Ludwig van Beethoven', bpm: 120, difficulty: 'Intermediate', score: FUR_ELISE },
  { id: '2', title: 'Clair de Lune', composer: 'Claude Debussy', bpm: 132, difficulty: 'Advanced', score: null },
  { id: '3', title: 'Moonlight Sonata', composer: 'Ludwig van Beethoven', bpm: 100, difficulty: 'Advanced', score: null },
  { id: '4', title: 'Prelude in C Major', composer: 'J.S. Bach', bpm: 90, difficulty: 'Beginner', score: null },
]

const DIFFICULTY_TABS: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

export function SelectionScreen({ onNavigate, isConnected, deviceName }: SelectionScreenProps) {
  const [selectedId, setSelectedId] = useState(PIECES[0].id)
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | null>(null)
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen)
  const setSelectedScore = useAppStore(s => s.setSelectedScore)
  const setBpm = useAppStore(s => s.setBpm)

  const filteredPieces = filterDifficulty
    ? PIECES.filter(p => p.difficulty === filterDifficulty)
    : PIECES

  const selectedPiece = PIECES.find(p => p.id === selectedId) ?? PIECES[0]

  const handleStart = () => {
    if (selectedPiece.score) {
      setSelectedScore(selectedPiece.score)
      setBpm(selectedPiece.bpm)
    }
    onNavigate('practice')
  }

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="leather-texture" />

      <NavBar
        currentScreen="selection"
        onNavigate={onNavigate}
        isConnected={isConnected}
        deviceName={deviceName}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col px-8 py-6 relative z-10 overflow-hidden">
        <h2 className="text-2xl font-serif metallic-gold tracking-wider mb-6">
          Sheet Music Selection
        </h2>

        {/* Difficulty tabs */}
        <div className="flex gap-2 mb-6">
          {DIFFICULTY_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterDifficulty(filterDifficulty === tab ? null : tab)}
              className={`px-5 py-1.5 rounded-full text-xs font-serif tracking-wider border transition-all cursor-pointer ${
                filterDifficulty === tab
                  ? 'bg-gold/20 border-gold/60 text-gold'
                  : 'bg-black/30 border-gold/20 text-gold/50 hover:border-gold/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Two column layout */}
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left: piece list */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2">
            {filteredPieces.map(piece => (
              <button
                key={piece.id}
                onClick={() => setSelectedId(piece.id)}
                className={`w-full text-left px-6 py-4 rounded-sm border-2 transition-all cursor-pointer ${
                  selectedId === piece.id
                    ? 'border-gold/60 bg-gold/5'
                    : 'border-gold/15 bg-black/20 hover:border-gold/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif text-gold-light text-lg tracking-wide">{piece.title}</div>
                    <div className="text-gold/40 text-xs font-serif italic">{piece.composer}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold/60 text-sm font-mono">{piece.bpm} BPM</div>
                    <div className="text-gold/30 text-[10px] font-serif tracking-wider">
                      Difficulty: {piece.difficulty}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: preview + start button */}
          <div className="w-96 flex flex-col gap-6">
            {/* Score preview */}
            <div className="flex-1 ornate-card p-4 flex items-center justify-center overflow-hidden">
              <OrnateFrame variant="card">
                <div className="p-2">
                  {selectedPiece.score ? (
                    <div className="overflow-hidden" style={{ maxHeight: '200px' }}>
                      <ScoreRenderer score={selectedPiece.score} darkMode />
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gold/30 font-serif italic text-sm">
                      Preview not available
                    </div>
                  )}
                </div>
              </OrnateFrame>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="ornate-button py-5 text-xl tracking-[0.2em] text-center"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
