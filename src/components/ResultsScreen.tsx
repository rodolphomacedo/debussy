import { motion } from 'motion/react'
import { RotateCcw, Home, Settings2 } from 'lucide-react'
import { NavBar } from './NavBar'
import { GoldenRosesIcon } from './icons/GoldenRosesIcon'
import { useAppStore, type Screen } from '../store/useAppStore'
import type { ScoreResult } from '../lib/scorer'

interface ResultsScreenProps {
  result: ScoreResult
  onHome: () => void
  onRetry: () => void
}

function getDetailText(label: string, value: number | string): string {
  if (label === 'Accuracy Percentage') {
    const pct = typeof value === 'string' ? parseInt(value) : value
    if (pct >= 95) return 'Exceptional Performance'
    if (pct >= 85) return 'Very Good Performance'
    if (pct >= 70) return 'Solid Performance'
    return 'Needs Improvement'
  }
  if (label === 'Perfect Hits') return 'Rhythm & Pitch on Point'
  if (label === 'Partial Hits') return 'Slight Timing Variations'
  if (label === 'Errors') return 'Missed Notes'
  return ''
}

export function ResultsScreen({ result, onHome, onRetry }: ResultsScreenProps) {
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen)
  const setScreen = useAppStore(s => s.setScreen)

  const navigate = (screen: Screen) => setScreen(screen)

  // Performance consistency mock data (split timing errors into 5 sections)
  const sections = ['Intro', 'Verse 1', 'Chorus', 'Bridge', 'Outro']
  const sectionScores: number[] = []
  if (result.timingErrors.length > 0) {
    const chunkSize = Math.ceil(result.timingErrors.length / 5)
    for (let i = 0; i < 5; i++) {
      const chunk = result.timingErrors.slice(i * chunkSize, (i + 1) * chunkSize)
      const avg = chunk.length > 0
        ? Math.max(0, 100 - (chunk.reduce((a, b) => a + b, 0) / chunk.length) / 3)
        : result.percentScore
      sectionScores.push(Math.round(avg))
    }
  } else {
    for (let i = 0; i < 5; i++) sectionScores.push(result.percentScore)
  }

  // SVG polyline points for performance chart
  const chartWidth = 500
  const chartHeight = 80
  const points = sectionScores.map((score, i) => {
    const x = (i / (sectionScores.length - 1)) * chartWidth
    const y = chartHeight - (score / 100) * chartHeight
    return `${x},${y}`
  }).join(' ')

  const statsRows = [
    { label: 'Accuracy Percentage', value: `${result.percentScore}%` },
    { label: 'Perfect Hits', value: String(result.hits) },
    { label: 'Partial Hits', value: String(Math.max(0, result.hits - result.misses)) },
    { label: 'Errors', value: String(result.misses) },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="leather-texture" />

      {/* Golden roses decoration (right side) — hidden on mobile */}
      <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-60 lg:w-80 pointer-events-none z-0 opacity-40 sm:opacity-60">
        <GoldenRosesIcon className="w-full h-full text-gold" />
      </div>

      {/* NavBar */}
      <NavBar
        currentScreen="results"
        onNavigate={navigate}
        isConnected={false}
        deviceName={null}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 w-full flex flex-col items-start px-4 sm:px-8 lg:px-12 py-4 sm:py-8 relative z-10 overflow-y-auto custom-scrollbar max-w-4xl">
        {/* Grade circle */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="flex items-center justify-center mx-auto mb-3 sm:mb-8"
        >
          <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-black/80 to-black/95 border-4 border-gold/50 flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.2)]">
            <span className="text-3xl sm:text-6xl font-elegant metallic-gold italic">{result.grade}</span>
          </div>
        </motion.div>

        {/* Session Statistics heading */}
        <div className="w-full mb-2 sm:mb-6">
          <h2 className="text-base sm:text-2xl font-serif metallic-gold tracking-wider text-center mb-1 sm:mb-2">
            Session Statistics
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-gold/40" />
            <span className="text-gold/30 text-xs sm:text-sm">&#10086;</span>
            <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>

        {/* Stats table */}
        <motion.table
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full border-collapse mb-3 sm:mb-8"
        >
          <thead>
            <tr className="border-b-2 border-gold/30">
              <th className="text-left py-2 text-gold/60 font-serif italic text-xs sm:text-sm tracking-wider">Metric</th>
              <th className="text-center py-2 text-gold/60 font-serif italic text-xs sm:text-sm tracking-wider">Result</th>
              <th className="hidden sm:table-cell text-right py-2 text-gold/60 font-serif italic text-sm tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {statsRows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="border-b border-gold/10"
              >
                <td className="py-2 sm:py-3 text-gold/70 font-serif text-xs sm:text-base">{row.label}</td>
                <td className="py-2 sm:py-3 text-gold-light font-serif text-center text-base sm:text-lg">{row.value}</td>
                <td className="hidden sm:table-cell py-3 text-gold/40 font-serif italic text-sm text-right">{getDetailText(row.label, row.value)}</td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>

        {/* Performance Consistency chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full mb-3 sm:mb-8"
        >
          <h3 className="text-sm sm:text-lg font-serif metallic-gold tracking-wider mb-2 sm:mb-4">
            Performance Consistency
          </h3>
          <div className="relative">
            {/* Section labels */}
            <div className="flex justify-between mb-1 text-gold/30 text-[8px] sm:text-[10px] font-serif tracking-wider">
              {sections.map(s => <span key={s}>{s}</span>)}
            </div>
            <svg width="100%" height={chartHeight + 10} viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`} className="overflow-visible">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(pct => (
                <line
                  key={pct}
                  x1="0" y1={chartHeight - (pct / 100) * chartHeight}
                  x2={chartWidth} y2={chartHeight - (pct / 100) * chartHeight}
                  stroke="rgba(212,175,55,0.1)" strokeWidth="1"
                />
              ))}
              {/* Performance line */}
              <polyline
                points={points}
                fill="none"
                stroke="url(#chartGold)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Dots at each point */}
              {sectionScores.map((score, i) => (
                <circle
                  key={i}
                  cx={(i / (sectionScores.length - 1)) * chartWidth}
                  cy={chartHeight - (score / 100) * chartHeight}
                  r="4"
                  fill="#D4AF37"
                  opacity="0.8"
                />
              ))}
              <defs>
                <linearGradient id="chartGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8E6D10" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#F9E29C" />
                </linearGradient>
              </defs>
            </svg>
            {/* Time markers */}
            <div className="flex justify-between mt-1 text-gold/20 text-[8px] sm:text-[9px] font-mono">
              <span>0:00</span>
              <span>1:30</span>
              <span>3:00</span>
              <span>4:45</span>
              <span>6:12</span>
            </div>
          </div>
        </motion.div>

        {/* Action buttons — always horizontal */}
        <div className="flex flex-row gap-2 sm:gap-6 w-full pb-4 sm:pb-0">
          <button onClick={onRetry} className="flex-1 ornate-button flex items-center justify-center gap-1 sm:gap-3">
            <RotateCcw className="w-3 h-3 sm:w-5 sm:h-5 shrink-0" />
            <span>Try Again</span>
          </button>
          <button onClick={() => navigate('config')} className="flex-1 ornate-button flex items-center justify-center gap-1 sm:gap-3">
            <Settings2 className="w-3 h-3 sm:w-5 sm:h-5 shrink-0" />
            <span className="hidden sm:inline">Change BPM</span>
            <span className="sm:hidden">BPM</span>
          </button>
          <button onClick={onHome} className="flex-1 ornate-button flex items-center justify-center gap-1 sm:gap-3">
            <Home className="w-3 h-3 sm:w-5 sm:h-5 shrink-0" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  )
}
