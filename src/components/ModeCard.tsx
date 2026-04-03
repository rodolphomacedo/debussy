import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { OrnateFrame } from './OrnateFrame'

interface ModeCardProps {
  title: string
  description: string
  ctaLabel: string
  icon: ReactNode
  onClick: () => void
  className?: string
}

export function ModeCard({ title, description, ctaLabel, icon, onClick, className = '' }: ModeCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={onClick}
      className={`ornate-card group ${className}`}
    >
      <OrnateFrame variant="card">
        <div className="flex flex-col items-center gap-4 sm:gap-5 p-10 sm:p-12 text-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-serif metallic-gold tracking-wider">
            {title}
          </h2>

          {icon}

          <p className="text-gold/50 italic text-xs sm:text-sm max-w-xs leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-3 text-gold-light font-serif border-b-2 border-gold/20 pb-2 group-hover:border-gold transition-all duration-500 tracking-[0.2em] text-[10px] sm:text-xs uppercase">
            <span>{ctaLabel}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </OrnateFrame>
    </motion.div>
  )
}
