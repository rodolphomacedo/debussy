interface QuillInkwellIconProps {
  className?: string
  size?: number
}

export function QuillInkwellIcon({ className = '', size = 64 }: QuillInkwellIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      {/* Inkwell body */}
      <path
        d="M18 40 C18 36, 22 34, 26 34 L38 34 C42 34, 46 36, 46 40 L46 52 C46 56, 42 60, 38 60 L26 60 C22 60, 18 56, 18 52 Z"
        fill="currentColor"
        opacity="0.3"
      />

      {/* Inkwell rim */}
      <ellipse cx="32" cy="34" rx="14" ry="4" fill="currentColor" opacity="0.5" />
      <ellipse cx="32" cy="34" rx="10" ry="2.5" fill="currentColor" opacity="0.15" />

      {/* Ink surface */}
      <ellipse cx="32" cy="36" rx="8" ry="2" fill="currentColor" opacity="0.2" />

      {/* Quill feather */}
      <path
        d="M36 32 L52 4 C54 2, 56 2, 58 4 C60 8, 56 14, 50 18 L44 22 C46 16, 48 12, 52 6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        opacity="0.6"
        strokeLinecap="round"
      />

      {/* Quill shaft */}
      <line x1="36" y1="32" x2="52" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />

      {/* Feather barbs right */}
      <path
        d="M48 10 C52 8, 54 6, 56 4"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />
      <path
        d="M46 14 C50 12, 53 9, 55 7"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />
      <path
        d="M44 18 C48 16, 51 13, 54 10"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />

      {/* Quill nib */}
      <path
        d="M36 32 L34 38 L38 36 Z"
        fill="currentColor"
        opacity="0.7"
      />

      {/* Musical note floating from inkwell */}
      <ellipse cx="28" cy="28" rx="2.5" ry="2" fill="currentColor" opacity="0.5" transform="rotate(-15, 28, 28)" />
      <line x1="30" y1="28" x2="30" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M30 20 C33 18, 33 22, 30 21" fill="currentColor" opacity="0.4" />
    </svg>
  )
}
