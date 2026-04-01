import { motion } from 'motion/react'
import { RotateCcw, Home, Award } from 'lucide-react'
import type { ScoreResult } from '../lib/scorer'

interface ResultsScreenProps {
  result: ScoreResult
  onHome: () => void
  onRetry: () => void
}

export function ResultsScreen({ result, onHome, onRetry }: ResultsScreenProps) {
  const avgTiming = result.timingErrors.length > 0
    ? Math.round(result.timingErrors.reduce((a, b) => a + b, 0) / result.timingErrors.length)
    : 0

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="leather-texture" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl p-12 flex flex-col items-center gap-10 ornate-card"
      >
        <div className="leather-texture" />
        <div className="absolute top-6 left-6 text-gold/30 text-4xl select-none pointer-events-none">❦</div>
        <div className="absolute top-6 right-6 text-gold/30 text-4xl select-none pointer-events-none">❦</div>
        <div className="absolute bottom-6 left-6 text-gold/30 text-4xl select-none pointer-events-none rotate-180">❦</div>
        <div className="absolute bottom-6 right-6 text-gold/30 text-4xl select-none pointer-events-none rotate-180">❦</div>

        {/* Header */}
        <header className="text-center relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1, type: 'spring' }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-black/60 border-2 border-gold/50 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              <Award className="w-10 h-10 text-gold" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-serif metallic-gold uppercase tracking-[0.3em] mb-2">SESSION COMPLETE</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-gold/50" />
            <span className="text-gold text-lg">❦</span>
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
        </header>

        {/* Grade + stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full relative z-10">
          {/* Grade circle */}
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-black/80 to-black/95 rounded-full border-4 border-gold/40 aspect-square shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(212,175,55,0.15)]">
            <span className="text-xs text-gold/40 uppercase tracking-[0.4em] mb-2 font-elegant">Grade</span>
            <span className={`text-8xl font-serif metallic-gold`}>{result.grade}</span>
          </div>

          {/* Stats list */}
          <div className="flex flex-col justify-center gap-6">
            {[
              { label: 'Accuracy', value: `${result.percentScore}%`, color: 'text-gold-light' },
              { label: 'Perfect Hits', value: result.hits, color: 'text-green-400' },
              { label: 'Misses', value: result.misses, color: 'text-red-400' },
              { label: 'Extra Notes', value: result.extras, color: 'text-amber-500' },
              { label: 'Avg. Timing', value: `${avgTiming}ms`, color: 'text-gold-light' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex justify-between items-end border-b-2 border-gold/20 pb-3"
              >
                <span className="text-gold/60 font-serif italic text-lg tracking-widest">{item.label}</span>
                <span className={`${item.color} font-serif text-2xl`}>{item.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Accuracy ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="url(#goldGrad)" strokeWidth="8"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * result.percentScore) / 100 }}
                  transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE08B" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#AA7C11" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-serif metallic-gold">{result.percentScore}%</span>
                <span className="text-[10px] text-gold/40 uppercase tracking-[0.4em] mt-2 font-elegant">Accuracy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-8 w-full max-w-3xl mt-6 relative z-10">
          <button onClick={onRetry} className="flex-1 ornate-button flex items-center justify-center gap-3 group py-5 text-lg tracking-[0.2em]">
            <RotateCcw className="w-6 h-6 group-hover:-rotate-180 transition-transform duration-700" />
            RETRY
          </button>
          <button onClick={onHome} className="flex-1 ornate-button flex items-center justify-center gap-3 group py-5 text-lg tracking-[0.2em]">
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
            HOME
          </button>
        </div>
      </motion.div>
    </div>
  )
}
