import { Settings } from 'lucide-react'
import { LyreIcon } from './icons/LyreIcon'
import type { Screen } from '../store/useAppStore'

interface NavBarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
  onSettingsOpen: () => void
}

export function NavBar({
  currentScreen,
  onNavigate,
  isConnected,
  deviceName,
  onSettingsOpen,
}: NavBarProps) {
  const navItems: { label: string; screen: Screen }[] = [
    { label: 'Home', screen: 'home' },
    { label: 'Library', screen: 'selection' },
  ]

  return (
    <nav className="flex items-center justify-between px-8 py-4 relative z-30 border-b border-gold/10">
      {/* Logo */}
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-3 group cursor-pointer"
      >
        <LyreIcon size={28} className="text-gold/60 group-hover:text-gold transition-colors" />
        <span className="text-2xl font-serif text-gold tracking-wider italic">
          Debussy
        </span>
      </button>

      {/* Center: MIDI status */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-1.5 bg-black/40 border border-gold/20 rounded-full">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]'
              : 'bg-red-500/60'
          }`}
        />
        <span className="text-gold/60 text-xs font-serif tracking-wider">
          {isConnected ? `MIDI Connected: ${deviceName}` : 'No MIDI Device'}
        </span>
      </div>

      {/* Right: nav items + settings */}
      <div className="flex items-center gap-8">
        {navItems.map(item => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className={`text-sm font-serif tracking-wider transition-colors cursor-pointer ${
              currentScreen === item.screen
                ? 'text-gold'
                : 'text-gold/40 hover:text-gold/70'
            }`}
          >
            {item.label}
          </button>
        ))}

        <button
          onClick={onSettingsOpen}
          className="w-9 h-9 rounded-full border border-gold/20 flex items-center justify-center text-gold/40 hover:text-gold hover:border-gold/50 transition-all cursor-pointer"
        >
          <Settings size={16} />
        </button>
      </div>
    </nav>
  )
}
