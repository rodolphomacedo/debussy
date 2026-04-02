interface EarMusicIconProps {
  className?: string
  size?: number
}

export function EarMusicIcon({ className = '', size = 64 }: EarMusicIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Ear outline */}
      <path
        d="M24 52 C18 52, 14 48, 14 42 L14 36 C14 34, 15 32, 17 31 C19 30, 20 28, 20 26 C20 20, 24 14, 32 14 C40 14, 44 20, 44 26 C44 30, 42 34, 40 36 C38 38, 37 40, 37 42 L37 44 C37 48, 34 52, 30 52 Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Inner ear curve */}
      <path
        d="M28 42 C26 42, 24 40, 24 38 L24 34 C24 32, 26 30, 28 30 C30 30, 32 28, 32 26 C32 24, 34 22, 36 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.5"
        strokeLinecap="round"
      />

      {/* Sound waves */}
      <path
        d="M46 20 C49 23, 50 27, 50 32 C50 37, 49 41, 46 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M50 16 C54 20, 56 26, 56 32 C56 38, 54 44, 50 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
        strokeLinecap="round"
      />

      {/* Musical notes floating near the ear */}
      <ellipse cx="48" cy="26" rx="2" ry="1.5" fill="currentColor" opacity="0.6" transform="rotate(-15, 48, 26)" />
      <line x1="49.5" y1="26" x2="49.5" y2="19" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <path d="M49.5 19 C51 18, 52 19, 52 20" stroke="currentColor" strokeWidth="0.8" opacity="0.6" fill="none" />

      <ellipse cx="52" cy="38" rx="1.8" ry="1.3" fill="currentColor" opacity="0.45" transform="rotate(-15, 52, 38)" />
      <line x1="53.3" y1="38" x2="53.3" y2="32" stroke="currentColor" strokeWidth="0.7" opacity="0.45" />
      <path d="M53.3 32 C55 31, 56 32, 56 33" stroke="currentColor" strokeWidth="0.7" opacity="0.45" fill="none" />
    </svg>
  )
}
