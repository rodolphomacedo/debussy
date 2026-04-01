import { useCallback, useRef, useState } from 'react'
import { useAppStore, type Screen } from '../store/useAppStore'

interface ConfigScreenProps {
  onNavigate: (screen: Screen) => void
}

const MIN_BPM = 40
const MAX_BPM = 200
const DIAL_RADIUS = 120
const TICK_COUNT = 17 // Ticks from 40 to 200 in steps of ~10

function bpmToAngle(bpm: number): number {
  const ratio = (bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)
  return -135 + ratio * 270 // -135° to +135°
}

function angleToBpm(angleDeg: number): number {
  const ratio = (angleDeg + 135) / 270
  return Math.round(Math.min(MAX_BPM, Math.max(MIN_BPM, MIN_BPM + ratio * (MAX_BPM - MIN_BPM))))
}

export function ConfigScreen({ onNavigate }: ConfigScreenProps) {
  const bpm = useAppStore(s => s.bpm)
  const setBpm = useAppStore(s => s.setBpm)
  const handSelection = useAppStore(s => s.handSelection)
  const setHandSelection = useAppStore(s => s.setHandSelection)
  const initialCount = useAppStore(s => s.initialCount)
  const setInitialCount = useAppStore(s => s.setInitialCount)
  const soundFeedback = useAppStore(s => s.soundFeedback)
  const setSoundFeedback = useAppStore(s => s.setSoundFeedback)

  const [isDragging, setIsDragging] = useState(false)
  const dialRef = useRef<SVGSVGElement>(null)

  const handleDialInteraction = useCallback((clientX: number, clientY: number) => {
    const svg = dialRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90 // 0° at top
    if (angle < -135) angle += 360
    if (angle > 135) return
    setBpm(angleToBpm(angle))
  }, [setBpm])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    handleDialInteraction(e.clientX, e.clientY)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [handleDialInteraction])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    handleDialInteraction(e.clientX, e.clientY)
  }, [isDragging, handleDialInteraction])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const needleAngle = bpmToAngle(bpm)

  // Generate tick marks
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const tickBpm = MIN_BPM + (i / (TICK_COUNT - 1)) * (MAX_BPM - MIN_BPM)
    const angle = bpmToAngle(tickBpm)
    const rad = (angle - 90) * (Math.PI / 180)
    const innerR = DIAL_RADIUS - 12
    const outerR = DIAL_RADIUS - 4
    const labelR = DIAL_RADIUS + 12
    return {
      x1: 140 + Math.cos(rad) * innerR,
      y1: 140 + Math.sin(rad) * innerR,
      x2: 140 + Math.cos(rad) * outerR,
      y2: 140 + Math.sin(rad) * outerR,
      lx: 140 + Math.cos(rad) * labelR,
      ly: 140 + Math.sin(rad) * labelR,
      label: Math.round(tickBpm),
      isMajor: i % 2 === 0,
    }
  })

  return (
    <div className="h-full flex flex-col items-center justify-center overflow-hidden relative velvet-bg">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif metallic-gold tracking-[0.2em] mb-2">DEBUSSY</h1>
        <p className="text-gold/40 font-serif italic text-base tracking-widest">Session Configuration</p>
      </div>

      {/* Main content row */}
      <div className="flex items-center gap-16">
        {/* Left: Toggle switches */}
        <div className="flex flex-col gap-8">
          {/* Initial Count toggle */}
          <div className="flex items-center gap-4">
            <span className="text-gold/50 font-serif text-sm tracking-wider w-28 text-right">Initial Count</span>
            <button
              onClick={() => setInitialCount(!initialCount)}
              className={`toggle-switch ${initialCount ? 'active' : ''}`}
            >
              <div className="toggle-knob" />
            </button>
            <span className="text-gold/40 text-xs font-mono w-8">{initialCount ? 'ON' : 'OFF'}</span>
          </div>

          {/* Sound Feedback toggle */}
          <div className="flex items-center gap-4">
            <span className="text-gold/50 font-serif text-sm tracking-wider w-28 text-right">Sound Feedback</span>
            <button
              onClick={() => setSoundFeedback(!soundFeedback)}
              className={`toggle-switch ${soundFeedback ? 'active' : ''}`}
            >
              <div className="toggle-knob" />
            </button>
            <span className="text-gold/40 text-xs font-mono w-8">{soundFeedback ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Center: BPM Dial */}
        <div className="flex flex-col items-center">
          <svg
            ref={dialRef}
            width="280"
            height="280"
            viewBox="0 0 280 280"
            className="cursor-pointer"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Outer ring */}
            <circle cx="140" cy="140" r={DIAL_RADIUS} fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="3" />
            <circle cx="140" cy="140" r={DIAL_RADIUS - 16} fill="rgba(0,0,0,0.6)" stroke="rgba(212,175,55,0.15)" strokeWidth="1" />

            {/* Tick marks */}
            {ticks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={tick.x1} y1={tick.y1}
                  x2={tick.x2} y2={tick.y2}
                  stroke={tick.isMajor ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.3)'}
                  strokeWidth={tick.isMajor ? 2 : 1}
                />
                {tick.isMajor && (
                  <text
                    x={tick.lx} y={tick.ly}
                    fill="rgba(212,175,55,0.5)"
                    fontSize="10"
                    fontFamily="Cormorant Garamond"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            ))}

            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 140, 140)`}>
              <line x1="140" y1="140" x2="140" y2={140 - DIAL_RADIUS + 25} stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="140" cy={140 - DIAL_RADIUS + 22} r="4" fill="#D4AF37" />
            </g>

            {/* Center hub */}
            <circle cx="140" cy="140" r="8" fill="#D4AF37" opacity="0.8" />
            <circle cx="140" cy="140" r="5" fill="#1a1a1a" />

            {/* BPM label */}
            <text x="140" y="185" fill="rgba(212,175,55,0.4)" fontSize="10" fontFamily="Cormorant Garamond" textAnchor="middle" letterSpacing="3">
              BPM
            </text>
          </svg>

          {/* BPM value display */}
          <div className="text-center -mt-2">
            <span className="text-3xl font-serif metallic-gold">{bpm}</span>
          </div>

          {/* Metronome button */}
          <button className="ornate-button-dark px-6 py-2 text-sm mt-4 font-serif tracking-wider">
            Play Metronome
          </button>
        </div>

        {/* Right: Hand selection */}
        <div className="flex flex-col gap-4">
          {(['both', 'right', 'left'] as const).map(hand => (
            <button
              key={hand}
              onClick={() => setHandSelection(hand)}
              className={`px-6 py-3 rounded-sm border-2 transition-all cursor-pointer flex items-center gap-4 ${
                handSelection === hand
                  ? 'border-gold/60 bg-gold/10'
                  : 'border-gold/15 bg-black/30 hover:border-gold/30'
              }`}
            >
              {/* Mini keyboard illustration */}
              <div className="flex gap-px">
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className={`w-2.5 h-6 rounded-b-sm border border-gold/20 ${
                      (hand === 'both') ||
                      (hand === 'right' && i >= 3) ||
                      (hand === 'left' && i <= 3)
                        ? 'bg-gold/30'
                        : 'bg-black/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gold/70 font-serif text-sm tracking-wider uppercase">
                {hand === 'both' ? 'Both' : hand === 'right' ? 'Right Hand' : 'Left Hand'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Session button */}
      <button
        onClick={() => onNavigate('practice')}
        className="ornate-button mt-12 px-20 py-5 text-xl tracking-[0.25em]"
      >
        START SESSION
      </button>
    </div>
  )
}
