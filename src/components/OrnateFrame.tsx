import type { ReactNode } from 'react'

interface OrnateFrameProps {
  variant?: 'full' | 'card' | 'panel'
  className?: string
  children?: ReactNode
}

function CornerOrnament({ position, offset = 0 }: { position: 'tl' | 'tr' | 'bl' | 'br'; offset?: number }) {
  const transforms: Record<string, string> = {
    tl: '',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  }

  const offsetStyle: Record<string, React.CSSProperties> = {
    tl: { top: -offset, left: -offset },
    tr: { top: -offset, right: -offset },
    bl: { bottom: -offset, left: -offset },
    br: { bottom: -offset, right: -offset },
  }

  return (
    <div
      className={`absolute pointer-events-none select-none z-30`}
      style={offsetStyle[position]}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        style={{ transform: transforms[position] }}
      >
        {/* Outer corner scroll */}
        <path
          d="M4 4 C4 4, 4 30, 8 40 C12 50, 16 52, 20 48 C24 44, 20 38, 16 40 C12 42, 14 48, 18 46"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M4 4 C4 4, 30 4, 40 8 C50 12, 52 16, 48 20 C44 24, 38 20, 40 16 C42 12, 48 14, 46 18"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />

        {/* Inner scrollwork */}
        <path
          d="M8 8 C8 8, 8 20, 12 28 C16 36, 22 34, 20 28"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.35"
        />
        <path
          d="M8 8 C8 8, 20 8, 28 12 C36 16, 34 22, 28 20"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.35"
        />

        {/* Corner leaf/flourish */}
        <path
          d="M6 6 C10 10, 14 8, 12 4"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="currentColor"
          opacity="0.3"
        />

        {/* Extending line along top */}
        <line x1="20" y1="4" x2="76" y2="4" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        {/* Extending line along left */}
        <line x1="4" y1="20" x2="4" y2="76" stroke="currentColor" strokeWidth="1" opacity="0.2" />

        {/* Small dot ornament */}
        <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  )
}

export function OrnateFrame({ variant = 'card', className = '', children }: OrnateFrameProps) {
  const sizeMap = {
    full: 'w-full h-full',
    card: '',
    panel: '',
  }

  const offset = variant === 'card' ? 20 : 0

  return (
    <div className={`relative text-gold ${sizeMap[variant]} ${className}`}>
      <CornerOrnament position="tl" offset={offset} />
      <CornerOrnament position="tr" offset={offset} />
      <CornerOrnament position="bl" offset={offset} />
      <CornerOrnament position="br" offset={offset} />
      {children}
    </div>
  )
}
