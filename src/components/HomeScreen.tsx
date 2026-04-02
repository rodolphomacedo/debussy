import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import { NavBar } from './NavBar'
import { OrnateFrame } from './OrnateFrame'
import { BookMusicIcon } from './icons/BookMusicIcon'
import { QuillInkwellIcon } from './icons/QuillInkwellIcon'
import { EarMusicIcon } from './icons/EarMusicIcon'
import { useAppStore, type Screen } from '../store/useAppStore'

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
  pressedNotes: Set<number>
}

const RECENT_SESSIONS = [
  { date: 'Oct 24', title: 'Clair de Lune', grade: 'A' },
  { date: 'Oct 22', title: 'Arabesque No. 1', grade: 'A' },
  { date: 'Oct 20', title: 'Prelude to the Afternoon of a Faun', grade: 'B' },
  { date: 'Oct 18', title: "Children's Corner", grade: 'A' },
]

export function HomeScreen({ onNavigate, isConnected, deviceName, pressedNotes }: HomeScreenProps) {
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen)

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="leather-texture" />

      {/* NavBar */}
      <NavBar
        currentScreen="home"
        onNavigate={onNavigate}
        isConnected={isConnected}
        deviceName={deviceName}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10">
          {/* Practice card */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() => onNavigate('practice')}
            className="ornate-card p-5 sm:p-7 lg:p-10 flex flex-col items-center text-center gap-4 sm:gap-6 group"
          >
            <OrnateFrame variant="card">
              <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-serif metallic-gold tracking-wider">
                  Practice Sheet Music
                </h2>

                <BookMusicIcon size={48} className="sm:hidden text-gold/70 group-hover:text-gold transition-colors duration-500" />
                <BookMusicIcon size={72} className="hidden sm:block text-gold/70 group-hover:text-gold transition-colors duration-500" />

                <p className="text-gold/50 italic text-xs sm:text-sm max-w-xs leading-relaxed">
                  Browse library or continue learning.
                </p>

                <div className="flex items-center gap-3 text-gold-light font-serif border-b-2 border-gold/20 pb-2 group-hover:border-gold transition-all duration-500 tracking-[0.2em] text-[10px] sm:text-xs uppercase">
                  <span>OPEN LIBRARY</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </OrnateFrame>
          </motion.div>

          {/* Ear Training card */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() => onNavigate('ear-training')}
            className="ornate-card p-5 sm:p-7 lg:p-10 flex flex-col items-center text-center gap-4 sm:gap-6 group"
          >
            <OrnateFrame variant="card">
              <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-serif metallic-gold tracking-wider">
                  Play by Ear
                </h2>

                <EarMusicIcon size={48} className="sm:hidden text-gold/70 group-hover:text-gold transition-colors duration-500" />
                <EarMusicIcon size={72} className="hidden sm:block text-gold/70 group-hover:text-gold transition-colors duration-500" />

                <p className="text-gold/50 italic text-xs sm:text-sm max-w-xs leading-relaxed">
                  Listen, learn, and reproduce melodies by ear.
                </p>

                <div className="flex items-center gap-3 text-gold-light font-serif border-b-2 border-gold/20 pb-2 group-hover:border-gold transition-all duration-500 tracking-[0.2em] text-[10px] sm:text-xs uppercase">
                  <span>START LISTENING</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </OrnateFrame>
          </motion.div>

          {/* Capture card */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() => onNavigate('capture')}
            className="ornate-card p-5 sm:p-7 lg:p-10 flex flex-col items-center text-center gap-4 sm:gap-6 group sm:col-span-2 lg:col-span-1"
          >
            <OrnateFrame variant="card">
              <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-serif metallic-gold tracking-wider">
                  Capture Notes
                </h2>

                <QuillInkwellIcon size={48} className="sm:hidden text-gold/70 group-hover:text-gold transition-colors duration-500" />
                <QuillInkwellIcon size={72} className="hidden sm:block text-gold/70 group-hover:text-gold transition-colors duration-500" />

                <p className="text-gold/50 italic text-xs sm:text-sm max-w-xs leading-relaxed">
                  Record and transcribe your playing.
                </p>

                <div className="flex items-center gap-3 text-gold-light font-serif border-b-2 border-gold/20 pb-2 group-hover:border-gold transition-all duration-500 tracking-[0.2em] text-[10px] sm:text-xs uppercase">
                  <span>START RECORDING</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </OrnateFrame>
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <div className="ornate-card p-4 sm:p-6">
          <OrnateFrame variant="card">
            <div className="px-2 sm:px-4 py-2">
              <h3 className="text-center font-serif text-gold/80 tracking-wider text-base sm:text-lg mb-3 sm:mb-4">
                Recent Sessions
              </h3>
              <div className="flex flex-col gap-1 sm:gap-2">
                {RECENT_SESSIONS.map((session, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 border-b border-gold/10 last:border-b-0 text-xs sm:text-sm"
                  >
                    <span className="text-gold/40 font-serif italic w-12 sm:w-16">{session.date}</span>
                    <span className="text-gold/70 font-serif flex-1 px-2 sm:px-4 truncate">{session.title}</span>
                    <span className="text-gold font-serif italic text-[10px] sm:text-sm">Grade: {session.grade}</span>
                  </div>
                ))}
              </div>
            </div>
          </OrnateFrame>
        </div>
      </div>

      {/* Bottom piano keyboard */}
      <div className="h-32 sm:h-36 lg:h-44 mt-auto relative z-20">
        <PianoKeyboard activeKeys={pressedNotes} />
      </div>
    </div>
  )
}
