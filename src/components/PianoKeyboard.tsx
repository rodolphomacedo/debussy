interface PianoKeyboardProps {
  activeKeys?: Set<number> | number[]
}

const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10])

function isBlackKey(note: number): boolean {
  return BLACK_KEY_INDICES.has(note % 12)
}

export function PianoKeyboard({ activeKeys = [] }: PianoKeyboardProps) {
  const activeSet = activeKeys instanceof Set
    ? activeKeys
    : new Set(activeKeys)

  // C3 (48) to B5 (83) = 3 octaves
  const keys = Array.from({ length: 36 }, (_, i) => i + 48)
  const whiteKeys = keys.filter(k => !isBlackKey(k))

  return (
    <div className="w-full h-full flex items-start justify-center px-4 pt-2">
      <div className="flex h-full relative">
        {whiteKeys.map((note) => {
          const active = activeSet.has(note)
          const hasBlackRight = isBlackKey(note + 1)

          return (
            <div
              key={note}
              className={`piano-key-white w-8 relative flex flex-col justify-end pb-2 items-center text-[8px] text-gray-400 ${active ? 'active bg-gold/40' : ''}`}
            >
              {note % 12 === 0 && (
                <span>C{Math.floor(note / 12) - 1}</span>
              )}

              {hasBlackRight && (
                <div
                  className={`piano-key-black absolute top-0 left-full -translate-x-1/2 ${activeSet.has(note + 1) ? 'active bg-gold-dark' : ''}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
