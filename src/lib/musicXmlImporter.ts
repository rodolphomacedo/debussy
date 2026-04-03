import type { ScoreData, MeasureData, NoteData } from './demoScore'

const DURATION_MAP: Record<string, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  '16th': '16',
  '32nd': '32',
}

const ALTER_MAP: Record<string, string> = {
  '1': '#',
  '-1': 'b',
  '2': '##',
  '-2': 'bb',
}

function el(parent: Element, tag: string): string {
  return parent.querySelector(tag)?.textContent?.trim() ?? ''
}

/**
 * Parse a MusicXML string into ScoreData.
 * Supports grand staff (staff 1 = treble, staff 2 = bass),
 * chords (<chord/>), rests, dotted notes, and accidentals.
 */
export function importMusicXml(xmlString: string): ScoreData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid MusicXML: ' + doc.querySelector('parsererror')?.textContent)
  }

  const title =
    doc.querySelector('work-title')?.textContent?.trim() ||
    doc.querySelector('movement-title')?.textContent?.trim() ||
    'Untitled'

  const composer = doc.querySelector('creator[type="composer"]')?.textContent?.trim() ?? ''

  const part = doc.querySelector('part')
  if (!part) throw new Error('No parts found in MusicXML')

  const measureEls = part.querySelectorAll('measure')
  if (measureEls.length === 0) throw new Error('No measures found in MusicXML')

  let numBeats = 4
  let beatValue = 4
  let timeSignature = '4/4'

  const measures: MeasureData[] = []

  for (const measureEl of measureEls) {
    // Update time signature if specified in this measure
    const beatsEl = measureEl.querySelector('time beats')
    const beatTypeEl = measureEl.querySelector('time beat-type')
    if (beatsEl && beatTypeEl) {
      numBeats = parseInt(beatsEl.textContent ?? '4')
      beatValue = parseInt(beatTypeEl.textContent ?? '4')
      timeSignature = `${numBeats}/${beatValue}`
    }

    const treble: NoteData[] = []
    const bass: NoteData[] = []
    let lastTrebleIdx = -1
    let lastBassIdx = -1

    for (const noteEl of measureEl.querySelectorAll('note')) {
      // Skip grace notes
      if (noteEl.querySelector('grace')) continue

      const isChord = !!noteEl.querySelector('chord')
      const isRest = !!noteEl.querySelector('rest')
      const staffText = el(noteEl, 'staff')
      const staff = staffText ? parseInt(staffText) : 1

      const typeText = el(noteEl, 'type')
      const dotted = !!noteEl.querySelector('dot')
      const vexDur = DURATION_MAP[typeText] ?? 'q'
      const fullDur = dotted ? `${vexDur}d` : vexDur

      if (isRest) {
        const restKey = staff === 1 ? 'b/4' : 'd/3'
        const note: NoteData = { keys: [restKey], duration: `${fullDur}r` }
        if (staff === 1) { treble.push(note); lastTrebleIdx = treble.length - 1 }
        else { bass.push(note); lastBassIdx = bass.length - 1 }
        continue
      }

      const step = el(noteEl, 'step').toLowerCase()
      const octave = el(noteEl, 'octave')
      const alterText = el(noteEl, 'alter')
      const acc = alterText ? (ALTER_MAP[alterText] ?? '') : ''
      const key = acc ? `${step}${acc}/${octave}` : `${step}/${octave}`

      if (isChord) {
        if (staff === 1 && lastTrebleIdx >= 0) treble[lastTrebleIdx].keys.push(key)
        else if (staff !== 1 && lastBassIdx >= 0) bass[lastBassIdx].keys.push(key)
      } else {
        const note: NoteData = { keys: [key], duration: fullDur }
        if (staff === 1) { treble.push(note); lastTrebleIdx = treble.length - 1 }
        else { bass.push(note); lastBassIdx = bass.length - 1 }
      }
    }

    if (treble.length > 0 || bass.length > 0) {
      measures.push({ treble, bass })
    }
  }

  if (measures.length === 0) throw new Error('No notes found in MusicXML')

  return { title, composer, timeSignature, numBeats, beatValue, bpm: 72, measures }
}
