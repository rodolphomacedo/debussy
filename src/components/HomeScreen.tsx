import { NavBar } from './NavBar'
import { OrnateFrame } from './OrnateFrame'
import { ModeCard } from './ModeCard'
import { BookMusicIcon } from './icons/BookMusicIcon'
import { QuillInkwellIcon } from './icons/QuillInkwellIcon'
import { EarMusicIcon } from './icons/EarMusicIcon'
import { StaffPenIcon } from './icons/StaffPenIcon'
import { useAppStore, type Screen } from '../store/useAppStore'

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
  isConnected: boolean
  deviceName: string | null
}

const RECENT_SESSIONS = [
  { date: 'Oct 24', title: 'Clair de Lune', grade: 'A' },
  { date: 'Oct 22', title: 'Arabesque No. 1', grade: 'A' },
  { date: 'Oct 20', title: 'Prelude to the Afternoon of a Faun', grade: 'B' },
  { date: 'Oct 18', title: "Children's Corner", grade: 'A' },
]

interface ModeCardConfig {
  title: string
  description: string
  ctaLabel: string
  screen: Screen
  icon: (props: { size: number; className: string }) => React.ReactNode
  className?: string
}

const MODE_CARDS: ModeCardConfig[] = [
  {
    title: 'Practice Sheet Music',
    description: 'Browse library or continue learning.',
    ctaLabel: 'OPEN LIBRARY',
    screen: 'practice',
    icon: BookMusicIcon,
  },
  {
    title: 'Play by Ear',
    description: 'Listen, learn, and reproduce melodies by ear.',
    ctaLabel: 'START LISTENING',
    screen: 'ear-training',
    icon: EarMusicIcon,
  },
  {
    title: 'Compose Score',
    description: 'Write your own sheet music and practice it.',
    ctaLabel: 'OPEN COMPOSER',
    screen: 'composer',
    icon: StaffPenIcon,
  },
  {
    title: 'Capture Notes',
    description: 'Record and transcribe your playing.',
    ctaLabel: 'START RECORDING',
    screen: 'capture',
    icon: QuillInkwellIcon,
  },
]

export function HomeScreen({ onNavigate, isConnected, deviceName }: HomeScreenProps) {
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen)

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="leather-texture" />

      <NavBar
        currentScreen="home"
        onNavigate={onNavigate}
        isConnected={isConnected}
        deviceName={deviceName}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-6">
          {MODE_CARDS.map(card => (
            <ModeCard
              key={card.screen}
              title={card.title}
              description={card.description}
              ctaLabel={card.ctaLabel}
              onClick={() => onNavigate(card.screen)}
              className={card.className}
              icon={
                <>
                  <card.icon size={48} className="sm:hidden text-gold/70 group-hover:text-gold transition-colors duration-500" />
                  <card.icon size={72} className="hidden sm:block text-gold/70 group-hover:text-gold transition-colors duration-500" />
                </>
              }
            />
          ))}
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
    </div>
  )
}
