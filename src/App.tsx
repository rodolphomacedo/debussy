import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LoadingScreen } from './components/LoadingScreen'
import { HomeScreen } from './components/HomeScreen'
import { PracticeScreen } from './components/PracticeScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { CaptureScreen } from './components/CaptureScreen'
import { SelectionScreen } from './components/SelectionScreen'
import { ConfigScreen } from './components/ConfigScreen'
import { SettingsPanel } from './components/SettingsPanel'
import { useMidi } from './hooks/useMidi'
import { FUR_ELISE } from './lib/demoScore'
import { isAudioReady, playNote, releaseNote } from './lib/audioEngine'
import { useAppStore, type Screen } from './store/useAppStore'
import type { ScoreResult } from './lib/scorer'

interface NoteOnEvent {
  note: number
  velocity: number
  time: number
}

function App() {
  const screen = useAppStore(s => s.screen)
  const setScreen = useAppStore(s => s.setScreen)
  const bpm = useAppStore(s => s.bpm)
  const lastScore = useAppStore(s => s.lastScore)
  const setLastScore = useAppStore(s => s.setLastScore)
  const setAudioReady = useAppStore(s => s.setAudioReady)
  const selectedScore = useAppStore(s => s.selectedScore)

  const [lastNoteOn, setLastNoteOn] = useState<NoteOnEvent | null>(null)

  const handleNoteOn = useCallback((note: number, velocity: number) => {
    if (isAudioReady()) playNote(note, velocity)
    setLastNoteOn({ note, velocity, time: performance.now() })
  }, [])

  const handleNoteOff = useCallback((note: number) => {
    if (isAudioReady()) releaseNote(note)
  }, [])

  const { devices, pressedNotes, isConnected } = useMidi({
    onNoteOn: handleNoteOn,
    onNoteOff: handleNoteOff,
  })

  const deviceName = devices.length > 0 ? devices[0].name : null

  const handleLoadingComplete = useCallback(() => {
    setAudioReady(true)
    setScreen('home')
  }, [setAudioReady, setScreen])

  const handlePracticeFinish = useCallback((result: ScoreResult) => {
    setLastScore(result)
    setScreen('results')
  }, [setLastScore, setScreen])

  const navigate = useCallback((s: Screen) => setScreen(s), [setScreen])

  const practiceScore = selectedScore ?? FUR_ELISE

  return (
    <div className="relative w-full h-screen overflow-hidden bg-piano-black">
      <AnimatePresence mode="wait">
        {screen === 'loading' && (
          <motion.div key="loading" exit={{ opacity: 0 }} className="w-full h-full">
            <LoadingScreen onComplete={handleLoadingComplete} />
          </motion.div>
        )}

        {screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <HomeScreen
              onNavigate={navigate}
              isConnected={isConnected}
              deviceName={deviceName}
              pressedNotes={pressedNotes}
            />
          </motion.div>
        )}

        {screen === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <SelectionScreen
              onNavigate={navigate}
              isConnected={isConnected}
              deviceName={deviceName}
            />
          </motion.div>
        )}

        {screen === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <ConfigScreen onNavigate={navigate} />
          </motion.div>
        )}

        {screen === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <PracticeScreen
              score={practiceScore}
              bpm={bpm}
              pressedNotes={pressedNotes}
              lastNoteOn={lastNoteOn}
              onFinish={handlePracticeFinish}
              onBack={() => navigate('home')}
            />
          </motion.div>
        )}

        {screen === 'results' && lastScore && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full h-full"
          >
            <ResultsScreen
              result={lastScore}
              onHome={() => navigate('home')}
              onRetry={() => navigate('practice')}
            />
          </motion.div>
        )}

        {screen === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <CaptureScreen
              pressedNotes={pressedNotes}
              lastNoteOn={lastNoteOn}
              bpm={bpm}
              onBack={() => navigate('home')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings overlay — renders above all screens */}
      <SettingsPanel deviceName={deviceName} />
    </div>
  )
}

export default App
