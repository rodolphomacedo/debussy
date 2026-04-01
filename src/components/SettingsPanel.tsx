import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { OrnateFrame } from './OrnateFrame'
import { useAppStore } from '../store/useAppStore'

interface SettingsPanelProps {
  deviceName: string | null
}

export function SettingsPanel({ deviceName }: SettingsPanelProps) {
  const settingsOpen = useAppStore(s => s.settingsOpen)
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen)
  const metronomeVolume = useAppStore(s => s.metronomeVolume)
  const setMetronomeVolume = useAppStore(s => s.setMetronomeVolume)
  const pianoVolume = useAppStore(s => s.pianoVolume)
  const setPianoVolume = useAppStore(s => s.setPianoVolume)
  const sfxVolume = useAppStore(s => s.sfxVolume)
  const setSfxVolume = useAppStore(s => s.setSfxVolume)
  const keyboardOctaves = useAppStore(s => s.keyboardOctaves)
  const setKeyboardOctaves = useAppStore(s => s.setKeyboardOctaves)

  // Level dots for metronome volume
  const levelDots = 8
  const activeDots = Math.round(metronomeVolume * levelDots)

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={() => setSettingsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-[201] velvet-bg border-l border-gold/20 shadow-[-10px_0_40px_rgba(0,0,0,0.8)]"
          >
            <OrnateFrame variant="panel" className="h-full">
              <div className="p-8 flex flex-col gap-7 h-full overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif text-gold tracking-wider italic">Settings</h2>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center text-gold/40 hover:text-gold hover:border-gold/50 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Metronome Volume */}
                <div className="flex flex-col gap-2">
                  <label className="text-gold/50 font-serif text-sm tracking-wider">Metronome Volume</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0" max="1" step="0.1"
                      value={metronomeVolume}
                      onChange={e => setMetronomeVolume(parseFloat(e.target.value))}
                      className="gold-slider flex-1"
                    />
                    <div className="flex gap-1">
                      {Array.from({ length: levelDots }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-3 rounded-sm ${
                            i < activeDots ? 'bg-gold' : 'bg-gold/15'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Piano Volume */}
                <div className="flex flex-col gap-2">
                  <label className="text-gold/50 font-serif text-sm tracking-wider">Piano Volume</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.1"
                    value={pianoVolume}
                    onChange={e => setPianoVolume(parseFloat(e.target.value))}
                    className="gold-slider"
                  />
                </div>

                {/* Sound Effects */}
                <div className="flex flex-col gap-2">
                  <label className="text-gold/50 font-serif text-sm tracking-wider">Sound Effects</label>
                  <input
                    type="range"
                    min="0" max="1" step="0.1"
                    value={sfxVolume}
                    onChange={e => setSfxVolume(parseFloat(e.target.value))}
                    className="gold-slider"
                  />
                </div>

                {/* MIDI Device */}
                <div className="flex flex-col gap-2">
                  <label className="text-gold/50 font-serif text-sm tracking-wider">MIDI Device</label>
                  <div className="px-4 py-2 rounded-sm border border-gold/20 bg-black/30 text-gold/60 font-serif text-sm">
                    {deviceName ?? 'No device connected'}
                  </div>
                </div>

                {/* Dark/Light Mode */}
                <div className="flex items-center justify-between">
                  <label className="text-gold/50 font-serif text-sm tracking-wider">Dark/Light Mode</label>
                  <div className="flex items-center gap-2">
                    <div className="toggle-switch active">
                      <div className="toggle-knob" />
                    </div>
                    <span className="text-gold/40 text-xs font-mono">Dark</span>
                  </div>
                </div>

                {/* Keyboard Octaves */}
                <div className="flex flex-col gap-2">
                  <label className="text-gold/50 font-serif text-sm tracking-wider">Keyboard Octaves</label>
                  <div className="flex items-center gap-4">
                    <span className="text-gold/30 text-xs font-mono">{keyboardOctaves}</span>
                    <input
                      type="range"
                      min="2" max="5" step="1"
                      value={keyboardOctaves}
                      onChange={e => setKeyboardOctaves(parseInt(e.target.value))}
                      className="gold-slider flex-1"
                    />
                    <span className="text-gold/30 text-xs font-mono">5</span>
                  </div>
                </div>
              </div>
            </OrnateFrame>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
