import { Play, Pause, RotateCcw, Music, Piano, BellOff, Bell } from 'lucide-react'

interface PracticeControlsProps {
  mode: 'listen' | 'practice'
  isPlaying: boolean
  metronome: boolean
  onSwitchMode: (mode: 'listen' | 'practice') => void
  onPlay: () => void
  onStop: () => void
  onReset: () => void
  onToggleMetronome: () => void
}

export function PracticeControls({
  mode,
  isPlaying,
  metronome,
  onSwitchMode,
  onPlay,
  onStop,
  onReset,
  onToggleMetronome,
}: PracticeControlsProps) {
  return (
    <div className="practice-controls-row">

      {/* Mode tabs (left) */}
      <div className="practice-mode-tabs">
        <button
          onClick={() => onSwitchMode('listen')}
          className={`practice-mode-tab ${mode === 'listen' ? 'active' : ''}`}
        >
          <Music size={11} />
          <span>Listen</span>
        </button>
        <button
          onClick={() => onSwitchMode('practice')}
          className={`practice-mode-tab ${mode === 'practice' ? 'active' : ''}`}
        >
          <Piano size={11} />
          <span>Practice</span>
        </button>
      </div>

      {/* Play + Reset (center) */}
      <div className="practice-center-btns">
        <button
          onClick={isPlaying ? onStop : onPlay}
          className="practice-play-btn"
        >
          <div className="practice-play-inner">
            {isPlaying
              ? <Pause className="practice-play-icon fill-current" />
              : <Play  className="practice-play-icon fill-current ml-0.5" />}
          </div>
        </button>

        <button onClick={onReset} className="practice-reset-btn">
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      {/* Metronome toggle (right) */}
      <button
        onClick={onToggleMetronome}
        className={`practice-metro-btn ${metronome ? 'active' : ''}`}
        title={metronome ? 'Metronome on' : 'Metronome off'}
      >
        {metronome ? <Bell size={14} /> : <BellOff size={14} />}
        <span className="hidden sm:inline">Metro</span>
      </button>
    </div>
  )
}
