interface BookMusicIconProps {
  className?: string
  size?: number
}

export function BookMusicIcon({ className = '', size = 64 }: BookMusicIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Book spine */}
      <path
        d="M10 8 C10 6, 12 4, 14 4 L30 4 C31 4, 32 5, 32 6 L32 58 C32 59, 31 60, 30 60 L14 60 C12 60, 10 58, 10 56 Z"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Book front cover */}
      <path
        d="M32 6 L32 58 C32 59, 33 60, 34 60 L50 60 C52 60, 54 58, 54 56 L54 8 C54 6, 52 4, 50 4 L34 4 C33 4, 32 5, 32 6 Z"
        fill="currentColor"
        opacity="0.2"
      />

      {/* Left page */}
      <path
        d="M12 10 L30 10 L30 56 L12 56 Z"
        fill="currentColor"
        opacity="0.15"
        rx="1"
      />

      {/* Right page */}
      <path
        d="M34 10 L52 10 L52 56 L34 56 Z"
        fill="currentColor"
        opacity="0.15"
        rx="1"
      />

      {/* Staff lines left page */}
      {[20, 23, 26, 29, 32].map(y => (
        <line key={`l${y}`} x1="14" y1={y} x2="28" y2={y} stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      ))}

      {/* Staff lines right page */}
      {[20, 23, 26, 29, 32].map(y => (
        <line key={`r${y}`} x1="36" y1={y} x2="50" y2={y} stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      ))}

      {/* Musical notes on left page */}
      <ellipse cx="17" cy="25" rx="2.5" ry="2" fill="currentColor" opacity="0.7" transform="rotate(-15, 17, 25)" />
      <line x1="19" y1="25" x2="19" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.7" />

      <ellipse cx="23" cy="22" rx="2.5" ry="2" fill="currentColor" opacity="0.7" transform="rotate(-15, 23, 22)" />
      <line x1="25" y1="22" x2="25" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.7" />

      {/* Musical notes on right page */}
      <ellipse cx="40" cy="28" rx="2.5" ry="2" fill="currentColor" opacity="0.7" transform="rotate(-15, 40, 28)" />
      <line x1="42" y1="28" x2="42" y2="19" stroke="currentColor" strokeWidth="1" opacity="0.7" />

      <ellipse cx="46" cy="25" rx="2.5" ry="2" fill="currentColor" opacity="0.7" transform="rotate(-15, 46, 25)" />
      <line x1="48" y1="25" x2="48" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.7" />

      {/* Treble clef on right page (simplified) */}
      <text x="37" y="30" fontSize="14" fill="currentColor" opacity="0.5" fontFamily="serif">𝄞</text>

      {/* Book binding center line */}
      <line x1="32" y1="4" x2="32" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}
