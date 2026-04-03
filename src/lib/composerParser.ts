import type { NoteData } from './demoScore'

// Supported durations: w, h, q, 8, 16, 32 + d suffix for dotted
const DURATION_MAP: Record<string, string> = {
  w: 'w', '1': 'w',
  h: 'h', '2': 'h',
  q: 'q', '4': 'q',
  '8': '8', e: '8',
  '16': '16', s: '16',
  '32': '32',
}

function parseUserDuration(dur: string): string {
  const clean = dur.toLowerCase().trim()
  const dotted = clean.endsWith('d')
  const base = dotted ? clean.slice(0, -1) : clean
  const vex = DURATION_MAP[base]
  if (!vex) throw new Error(`Unknown duration: "${dur}"`)
  return dotted ? `${vex}d` : vex
}

/** Convert user pitch like "C4", "D#5", "Bb3" to VexFlow key "c/4", "d#/5", "bb/3" */
function parsePitch(pitch: string): string {
  const m = pitch.match(/^([A-Ga-g])(##|bb|#|b)?(\d)$/)
  if (!m) throw new Error(`Invalid pitch: "${pitch}"`)
  const note = m[1].toLowerCase()
  const acc = (m[2] ?? '').toLowerCase()
  const oct = m[3]
  return acc ? `${note}${acc}/${oct}` : `${note}/${oct}`
}

function parseToken(token: string, clef: 'treble' | 'bass'): NoteData {
  const slashIdx = token.lastIndexOf('/')
  if (slashIdx === -1) throw new Error(`Missing "/" in: "${token}". Format: C4/q`)

  const pitchPart = token.slice(0, slashIdx).trim()
  const durPart = token.slice(slashIdx + 1).trim()
  const dur = parseUserDuration(durPart)

  if (/^(rest|r)$/i.test(pitchPart)) {
    const restKey = clef === 'treble' ? 'b/4' : 'd/3'
    return { keys: [restKey], duration: `${dur}r` }
  }

  if (pitchPart.startsWith('(') && pitchPart.endsWith(')')) {
    const keys = pitchPart.slice(1, -1).split(',').map(p => parsePitch(p.trim()))
    return { keys, duration: dur }
  }

  return { keys: [parsePitch(pitchPart)], duration: dur }
}

/**
 * Parse a line of note text into NoteData[].
 * Format: "C4/q, D#5/8, rest/q, (C4,E4,G4)/q"
 * Durations: w h q 8 16 32, add 'd' for dotted (qd, 8d)
 */
export function parseNoteText(text: string, clef: 'treble' | 'bass'): NoteData[] {
  const tokens = text
    .split(/,\s*(?![^(]*\))|\s+(?![^(]*\))/)
    .map(t => t.trim())
    .filter(t => t.length > 0)

  if (tokens.length === 0) return []
  return tokens.map(token => parseToken(token, clef))
}

// ── Serialization (NoteData → user text) ────────────────────────────────────

function vexKeyToUser(key: string): string {
  const m = key.match(/^([a-g])(##|bb|#|b)?\/(\d)$/)
  if (!m) return key
  const note = m[1].toUpperCase()
  const acc = m[2] ?? ''
  const oct = m[3]
  // Capitalize single flat/sharp that looks like 'b' → 'b' (keep lowercase for flat indicator)
  // VexFlow uses 'bb' for Bb, '#' for sharp. User format: Bb4, D#5
  return `${note}${acc}${oct}`
}

function vexDurToUser(dur: string): string {
  const isRest = dur.endsWith('r')
  const clean = isRest ? dur.slice(0, -1) : dur
  const isDotted = clean.endsWith('d')
  const base = isDotted ? clean.slice(0, -1) : clean
  const labels: Record<string, string> = { w: 'w', h: 'h', q: 'q', '8': '8', '16': '16', '32': '32' }
  return (labels[base] ?? base) + (isDotted ? 'd' : '')
}

/** Convert NoteData[] back to user-friendly text */
export function noteDataToText(notes: NoteData[]): string {
  return notes.map(note => {
    const isRest = note.duration.endsWith('r')
    const dur = vexDurToUser(note.duration)
    if (isRest) return `rest/${dur}`
    if (note.keys.length > 1) {
      return `(${note.keys.map(vexKeyToUser).join(',')})/${dur}`
    }
    return `${vexKeyToUser(note.keys[0])}/${dur}`
  }).join(', ')
}
