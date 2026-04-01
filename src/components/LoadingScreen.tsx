import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { initAudio } from '../lib/audioEngine'

interface LoadingScreenProps {
  onComplete: () => void
}

const STATUSES = [
  'Connecting to your piano...',
  'Loading piano sounds...',
  'Calibrating MIDI sensitivity...',
  'Preparing your library...',
  'Ready to play.',
]

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [audioLoading, setAudioLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100 }
        return prev + 1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => prev < STATUSES.length - 1 ? prev + 1 : prev)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const handleStart = useCallback(async () => {
    setAudioLoading(true)
    await initAudio()
    onComplete()
  }, [onComplete])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-50 velvet-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="flex flex-col items-center z-10"
      >
        {/* Title — mixed case, calligraphic feel */}
        <h1 className="text-8xl font-serif metallic-gold gold-glow mb-4 tracking-wide">
          Debussy
        </h1>

        {/* Subtitle */}
        <p className="text-gold/50 font-serif italic text-lg tracking-widest mb-16">
          Harmonizing tradition with innovation
        </p>

        <div className="flex flex-col items-center gap-6">
          {/* Start button — appears early, gold-filled */}
          {progress === 100 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              disabled={audioLoading}
              className="ornate-button mb-6"
            >
              {audioLoading ? 'Loading Sounds...' : 'Start Playing'}
            </motion.button>
          )}

          {/* Status messages */}
          <div className="h-12 flex flex-col items-center justify-center gap-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-gold/50 font-serif italic text-base"
              >
                {STATUSES[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar — slim with flourishes */}
          <div className="relative mt-2">
            <span className="flourish-left">❧</span>
            <div className="progress-bar-container">
              <motion.div
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="flourish-right">❧</span>
          </div>

          {/* Percentage below */}
          <div className="text-gold/40 font-serif italic text-sm">
            {progress}%
          </div>
        </div>
      </motion.div>
    </div>
  )
}
