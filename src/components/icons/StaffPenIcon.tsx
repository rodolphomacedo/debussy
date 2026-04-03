interface Props {
  size?: number
  className?: string
}

export function StaffPenIcon({ size = 72, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Staff lines */}
      <line x1="6" y1="20" x2="50" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <line x1="6" y1="28" x2="50" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <line x1="6" y1="36" x2="50" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <line x1="6" y1="44" x2="50" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <line x1="6" y1="52" x2="50" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      {/* Note head */}
      <ellipse cx="18" cy="36" rx="5" ry="4" fill="currentColor" opacity="0.9"/>
      <line x1="23" y1="36" x2="23" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      {/* Pen / quill */}
      <path
        d="M55 14 L64 5 L67 8 L58 17 Z"
        fill="currentColor" opacity="0.85"
      />
      <path
        d="M55 14 L48 58 L53 55 L58 17 Z"
        fill="currentColor" opacity="0.6"
      />
      <line x1="48" y1="58" x2="52" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    </svg>
  )
}
