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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-piano-black overflow-hidden z-50">
      {/* Corner flourishes */}
      <div className="absolute top-8 left-8 text-gold/20 text-6xl select-none">❦</div>
      <div className="absolute top-8 right-8 text-gold/20 text-6xl select-none scale-x-[-1]">❦</div>
      <div className="absolute bottom-8 left-8 text-gold/20 text-6xl select-none scale-y-[-1]">❦</div>
      <div className="absolute bottom-8 right-8 text-gold/20 text-6xl select-none scale-x-[-1] scale-y-[-1]">❦</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="flex flex-col items-center z-10"
      >
        <h1 className="text-8xl font-serif metallic-gold gold-glow mb-2 tracking-widest uppercase">
          DEBUSSY
        </h1>

        <div className="flex items-center gap-4 mb-16">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-gold" />
          <span className="text-gold text-2xl">❦</span>
          <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-gold" />
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="relative">
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
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-gold-light font-serif italic text-lg">
              {progress}%
            </div>
          </div>

          <div className="h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-gold/60 font-serif italic text-xl"
              >
                {STATUSES[statusIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {progress === 100 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              disabled={audioLoading}
              className="ornate-button mt-8"
            >
              {audioLoading ? 'LOADING SOUNDS...' : 'START PLAYING'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
