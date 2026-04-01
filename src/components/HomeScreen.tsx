import { motion } from 'motion/react'
import { Music, Mic, ChevronRight } from 'lucide-react'
import { PianoKeyboard } from './PianoKeyboard'
import type { Screen } from '../store/useAppStore'

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
  pressedNotes: Set<number>
}

export function HomeScreen({ onNavigate, isConnected, deviceName, pressedNotes }: HomeScreenProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="leather-texture" />

      {/* Top status bar */}
      <div className="flex justify-between items-center p-6 relative z-10">
        <div className="flex items-center gap-4 px-6 py-3 bg-black/60 border-2 border-gold/30 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(212,175,55,0.1)]">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
          <span className="text-gold-light font-serif italic text-sm tracking-widest">
            {isConnected ? `MIDI Connected: ${deviceName}` : 'No MIDI Device'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-12 max-w-6xl mx-auto w-full px-8 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Title */}
        <div className="text-center relative mt-4">
          <div className="absolute top-1/2 left-0 w-1/4 h-[1px] bg-gradient-to-r from-transparent to-gold/40" />
          <div className="absolute top-1/2 right-0 w-1/4 h-[1px] bg-gradient-to-l from-transparent to-gold/40" />
          <h1 className="text-6xl font-serif metallic-gold mb-3 tracking-[0.2em] uppercase">DEBUSSY</h1>
          <p className="text-gold/40 italic font-serif text-xl tracking-widest">Harmonizing tradition with innovation</p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Practice card */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => onNavigate('practice')}
            className="ornate-card p-12 flex flex-col items-center text-center gap-8 group"
          >
            <div className="leather-texture" />
            <div className="absolute top-3 left-3 text-gold/30 text-3xl select-none pointer-events-none">❦</div>
            <div className="absolute top-3 right-3 text-gold/30 text-3xl select-none pointer-events-none">❦</div>
            <div className="absolute bottom-3 left-3 text-gold/30 text-3xl select-none pointer-events-none rotate-180">❦</div>
            <div className="absolute bottom-3 right-3 text-gold/30 text-3xl select-none pointer-events-none rotate-180">❦</div>

            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#111] to-[#000] flex items-center justify-center border-4 border-gold/30 group-hover:border-gold transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(212,175,55,0.2)]">
              <Music className="w-12 h-12 text-gold group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-serif metallic-gold mb-3 tracking-[0.15em]">PRACTICE</h2>
              <p className="text-gold/60 italic max-w-sm text-lg leading-relaxed">Master the classics with real-time feedback and performance tracking.</p>
            </div>

            <div className="flex items-center gap-4 text-gold-light font-serif border-b-2 border-gold/20 pb-2 group-hover:border-gold transition-all duration-500 tracking-[0.3em] text-sm uppercase">
              <span>BEGIN JOURNEY</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.div>

          {/* Capture card */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => onNavigate('capture')}
            className="ornate-card p-12 flex flex-col items-center text-center gap-8 group"
          >
            <div className="leather-texture" />
            <div className="absolute top-3 left-3 text-gold/30 text-3xl select-none pointer-events-none">❦</div>
            <div className="absolute top-3 right-3 text-gold/30 text-3xl select-none pointer-events-none">❦</div>
            <div className="absolute bottom-3 left-3 text-gold/30 text-3xl select-none pointer-events-none rotate-180">❦</div>
            <div className="absolute bottom-3 right-3 text-gold/30 text-3xl select-none pointer-events-none rotate-180">❦</div>

            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#111] to-[#000] flex items-center justify-center border-4 border-gold/30 group-hover:border-gold transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(212,175,55,0.2)]">
              <Mic className="w-12 h-12 text-gold group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-serif metallic-gold mb-3 tracking-[0.15em]">CAPTURE</h2>
              <p className="text-gold/60 italic max-w-sm text-lg leading-relaxed">Instantly transcribe your improvisations into digital sheet music.</p>
            </div>

            <div className="flex items-center gap-4 text-gold-light font-serif border-b-2 border-gold/20 pb-2 group-hover:border-gold transition-all duration-500 tracking-[0.3em] text-sm uppercase">
              <span>OPEN RECORDER</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom piano keyboard */}
      <div className="h-36 mt-auto bg-gradient-to-t from-[#1a1a1a] via-[#0a0a0a] to-[#2a2a2a] pt-6 border-t-4 border-gold/30 relative shadow-[0_-15px_50px_rgba(0,0,0,0.9)] z-20">
        <div className="leather-texture" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30">
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-gold" />
          <span className="text-gold font-serif italic text-xs tracking-[0.5em]">DEBUSSY</span>
          <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-gold" />
        </div>
        <div className="relative z-10 h-full px-8">
          <PianoKeyboard activeKeys={pressedNotes} />
        </div>
      </div>
    </div>
  )
}
