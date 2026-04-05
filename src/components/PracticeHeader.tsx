import { ArrowLeft } from 'lucide-react'
import { LyreIcon } from './icons/LyreIcon'

interface PracticeHeaderProps {
  title: string
  composer: string
  bpm: number
  mode: 'listen' | 'practice'
  stats: { correct: number; wrong: number }
  onBack: () => void
}

export function PracticeHeader({ title, composer, bpm, mode, stats, onBack }: PracticeHeaderProps) {
  return (
    <>
      {/* Header row: back · Debussy logo · stats/icon */}
      <div className="practice-header-row">
        <button onClick={onBack} className="practice-back-btn">
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Home</span>
        </button>

        <span className="practice-logo-text">Debussy</span>

        {mode === 'practice' && (
          <div className="practice-stats">
            <span style={{ color: '#6dbf8a' }}>✓ {stats.correct}</span>
            <span style={{ color: '#bf6d6d' }}>✗ {stats.wrong}</span>
          </div>
        )}
        {mode === 'listen' && (
          <LyreIcon size={20} style={{ color: 'rgba(160,120,38,0.4)' }} />
        )}
      </div>

      {/* Info row: title · composer · BPM */}
      <div className="practice-info-row">
        <span className="practice-song-name">{title}</span>
        <span className="practice-info-sep">·</span>
        <span className="practice-composer">{composer}</span>
        <span className="practice-info-sep">·</span>
        <span className="practice-bpm-badge">{bpm} BPM</span>
      </div>
    </>
  )
}
