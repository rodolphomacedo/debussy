interface GoldenRosesIconProps {
  className?: string
}

export function GoldenRosesIcon({ className = '' }: GoldenRosesIconProps) {
  return (
    <svg
      viewBox="0 0 300 500"
      fill="none"
      className={className}
    >
      {/* Rose 1 - top right */}
      <g transform="translate(180, 40) scale(1.2)">
        {/* Petals */}
        <circle cx="30" cy="30" r="18" fill="currentColor" opacity="0.15" />
        <path d="M30 12 C38 16, 46 24, 44 34 C42 28, 36 22, 30 20" fill="currentColor" opacity="0.25" />
        <path d="M48 30 C44 38, 36 44, 26 42 C32 40, 38 36, 40 30" fill="currentColor" opacity="0.2" />
        <path d="M30 48 C22 44, 14 36, 16 26 C18 32, 24 38, 30 40" fill="currentColor" opacity="0.25" />
        <path d="M12 30 C16 22, 24 16, 34 18 C28 20, 22 24, 20 30" fill="currentColor" opacity="0.2" />
        {/* Center spiral */}
        <path d="M30 26 C33 26, 34 29, 32 31 C30 33, 27 32, 27 29 C27 27, 29 26, 30 26" fill="currentColor" opacity="0.35" />
      </g>

      {/* Rose 2 - middle */}
      <g transform="translate(140, 160) scale(1.5)">
        <circle cx="30" cy="30" r="22" fill="currentColor" opacity="0.12" />
        <path d="M30 8 C40 14, 50 24, 48 36 C44 28, 38 20, 30 16" fill="currentColor" opacity="0.22" />
        <path d="M52 30 C46 40, 38 48, 26 46 C34 42, 40 36, 44 30" fill="currentColor" opacity="0.18" />
        <path d="M30 52 C20 46, 10 36, 12 24 C16 32, 22 40, 30 44" fill="currentColor" opacity="0.22" />
        <path d="M8 30 C14 20, 22 12, 34 14 C26 18, 20 24, 16 30" fill="currentColor" opacity="0.18" />
        <path d="M30 24 C34 24, 36 28, 34 32 C30 34, 26 32, 26 28 C26 26, 28 24, 30 24" fill="currentColor" opacity="0.3" />
      </g>

      {/* Rose 3 - bottom */}
      <g transform="translate(160, 310) scale(1.3)">
        <circle cx="30" cy="30" r="20" fill="currentColor" opacity="0.1" />
        <path d="M30 10 C39 15, 48 24, 46 35 C43 28, 37 21, 30 18" fill="currentColor" opacity="0.2" />
        <path d="M50 30 C45 39, 37 46, 26 44 C33 41, 39 35, 42 30" fill="currentColor" opacity="0.16" />
        <path d="M30 50 C21 45, 12 36, 14 25 C17 32, 23 39, 30 42" fill="currentColor" opacity="0.2" />
        <path d="M10 30 C15 21, 23 14, 34 16 C27 19, 21 25, 18 30" fill="currentColor" opacity="0.16" />
        <path d="M30 25 C33 25, 35 28, 33 31 C30 33, 27 31, 27 28 C27 26, 29 25, 30 25" fill="currentColor" opacity="0.28" />
      </g>

      {/* Stems and leaves */}
      <path
        d="M210 80 C200 120, 190 150, 185 200 C180 240, 200 280, 195 340 C192 380, 200 420, 205 480"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.2"
        fill="none"
      />

      {/* Leaf 1 */}
      <path
        d="M200 120 C215 110, 230 115, 225 130 C220 140, 205 135, 200 120"
        fill="currentColor"
        opacity="0.15"
      />

      {/* Leaf 2 */}
      <path
        d="M185 220 C170 210, 160 218, 165 232 C170 240, 180 238, 185 220"
        fill="currentColor"
        opacity="0.12"
      />

      {/* Leaf 3 */}
      <path
        d="M195 360 C210 350, 225 358, 218 372 C212 380, 200 375, 195 360"
        fill="currentColor"
        opacity="0.15"
      />

      {/* Small buds */}
      <circle cx="220" cy="140" r="6" fill="currentColor" opacity="0.1" />
      <circle cx="170" cy="260" r="5" fill="currentColor" opacity="0.08" />
      <circle cx="210" cy="400" r="7" fill="currentColor" opacity="0.1" />
    </svg>
  )
}
