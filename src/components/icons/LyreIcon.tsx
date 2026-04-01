interface LyreIconProps {
  className?: string
  size?: number
}

export function LyreIcon({ className = '', size = 48 }: LyreIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Base/Crossbar */}
      <ellipse cx="32" cy="52" rx="14" ry="4" fill="currentColor" opacity="0.8" />
      <rect x="18" y="48" width="28" height="4" rx="2" fill="currentColor" />

      {/* Pillar left */}
      <path
        d="M20 48 C16 40, 12 28, 16 16 C18 10, 22 6, 28 4"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Pillar right */}
      <path
        d="M44 48 C48 40, 52 28, 48 16 C46 10, 42 6, 36 4"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Top scroll left */}
      <path
        d="M28 4 C24 2, 20 4, 20 8 C20 11, 24 12, 26 10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Top scroll right */}
      <path
        d="M36 4 C40 2, 44 4, 44 8 C44 11, 40 12, 38 10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Strings */}
      <line x1="26" y1="12" x2="26" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="30" y1="8" x2="30" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="34" y1="8" x2="34" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="38" y1="12" x2="38" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.6" />

      {/* Top ornament */}
      <circle cx="32" cy="4" r="2.5" fill="currentColor" />
    </svg>
  )
}
