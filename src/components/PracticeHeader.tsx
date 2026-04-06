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
    <div className="practice-header-row">
      <button onClick={onBack} className="practice-back-btn">
        <ArrowLeft size={13} />
        <span className="hidden sm:inline">Home</span>
      </button>

      {/* Title block — absolutely centered regardless of side widths */}
      <div className="practice-title-block">
        <span className="practice-logo-text">Debussy</span>
        <div className="practice-info-row">
          <span className="practice-song-name">{title}</span>
          <span className="practice-info-sep">·</span>
          <span className="practice-composer">{composer}</span>
          <span className="practice-info-sep">·</span>
          <span className="practice-bpm-badge">{bpm} BPM</span>
        </div>
      </div>

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
  )
}
