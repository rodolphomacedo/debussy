import { useEffect, useRef } from 'react'
import {
  Renderer,
  Stave,
  StaveConnector,
  Voice,
  Formatter,
} from 'vexflow'
import { buildMeasureNotes } from '../lib/scoreBuilder'
import type { ScoreData } from '../lib/demoScore'

const STAVE_WIDTH = 300
const STAVE_PADDING = 10
const TREBLE_Y = 40
const BASS_Y = 150
const FIRST_STAVE_EXTRA = 60
const SCORE_HEIGHT = 260
const CURSOR_COLOR = '#D4AF37'
const HIT_COLOR = '#4caf7a'
const MISS_COLOR = '#c94c4c'

const DARK_NOTE_COLOR = '#D4AF37'
const DARK_STAFF_COLOR = 'rgba(212, 175, 55, 0.4)'

export interface ScoreRendererProps {
  score: ScoreData
  cursorBeat?: number
  hitNotes?: Set<string>
  missNotes?: Set<string>
  darkMode?: boolean
}

function clearContainer(container: HTMLDivElement) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

export function ScoreRenderer({
  score,
  cursorBeat,
  hitNotes,
  missNotes,
  darkMode = false,
}: ScoreRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    clearContainer(container)

    const measureCount = score.measures.length
    const totalWidth =
      STAVE_PADDING +
      FIRST_STAVE_EXTRA + STAVE_WIDTH +
      (measureCount - 1) * STAVE_WIDTH +
      STAVE_PADDING

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(totalWidth, SCORE_HEIGHT)
    const context = renderer.getContext()

    // Apply dark mode colors to the context
    if (darkMode) {
      context.setFillStyle(DARK_NOTE_COLOR)
      context.setStrokeStyle(DARK_NOTE_COLOR)
    }

    let x = STAVE_PADDING

    for (let i = 0; i < measureCount; i++) {
      const measure = score.measures[i]
      const isFirst = i === 0
      const width = isFirst ? STAVE_WIDTH + FIRST_STAVE_EXTRA : STAVE_WIDTH

      const trebleStave = new Stave(x, TREBLE_Y, width)
      const bassStave = new Stave(x, BASS_Y, width)

      if (isFirst) {
        trebleStave.addClef('treble').addTimeSignature(score.timeSignature)
        bassStave.addClef('bass').addTimeSignature(score.timeSignature)
      }

      trebleStave.setContext(context).draw()
      bassStave.setContext(context).draw()

      if (isFirst) {
        new StaveConnector(trebleStave, bassStave)
          .setType('brace')
          .setContext(context)
          .draw()
        new StaveConnector(trebleStave, bassStave)
          .setType('singleLeft')
          .setContext(context)
          .draw()
      }

      new StaveConnector(trebleStave, bassStave)
        .setType('singleRight')
        .setContext(context)
        .draw()

      const trebleNotes = buildMeasureNotes(measure.treble, 'treble')
      const bassNotes = buildMeasureNotes(measure.bass, 'bass')

      // Apply coloring: hit/miss takes priority, then dark mode default
      trebleNotes.forEach((note, ni) => {
        const key = `${i}-${ni}`
        if (hitNotes?.has(key)) {
          note.setStyle({ fillStyle: HIT_COLOR, strokeStyle: HIT_COLOR })
        } else if (missNotes?.has(key)) {
          note.setStyle({ fillStyle: MISS_COLOR, strokeStyle: MISS_COLOR })
        } else if (darkMode) {
          note.setStyle({ fillStyle: DARK_NOTE_COLOR, strokeStyle: DARK_NOTE_COLOR })
        }
      })

      bassNotes.forEach((note, ni) => {
        const key = `${i}-bass-${ni}`
        if (hitNotes?.has(key)) {
          note.setStyle({ fillStyle: HIT_COLOR, strokeStyle: HIT_COLOR })
        } else if (missNotes?.has(key)) {
          note.setStyle({ fillStyle: MISS_COLOR, strokeStyle: MISS_COLOR })
        } else if (darkMode) {
          note.setStyle({ fillStyle: DARK_NOTE_COLOR, strokeStyle: DARK_NOTE_COLOR })
        }
      })

      const trebleVoice = new Voice({
        numBeats: score.numBeats,
        beatValue: score.beatValue,
      }).setMode(Voice.Mode.SOFT)

      const bassVoice = new Voice({
        numBeats: score.numBeats,
        beatValue: score.beatValue,
      }).setMode(Voice.Mode.SOFT)

      trebleVoice.addTickables(trebleNotes)
      bassVoice.addTickables(bassNotes)

      const formatter = new Formatter()
      formatter.joinVoices([trebleVoice])
      formatter.joinVoices([bassVoice])
      formatter.format(
        [trebleVoice, bassVoice],
        width - (isFirst ? 90 : 30),
      )

      trebleVoice.draw(context, trebleStave)
      bassVoice.draw(context, bassStave)

      x += width
    }

    // After VexFlow renders, apply dark mode — recolor all black SVG elements to gold.
    // VexFlow can emit stroke/fill as '#000000', 'black', 'rgb(0,0,0)', or unset (inherited).
    if (darkMode) {
      const svgEl = container.querySelector('svg')
      if (svgEl) {
        const isBlackColor = (v: string | null) =>
          !v || v === '' || v === '#000000' || v === 'black' || v === '#000' ||
          v === 'rgb(0, 0, 0)' || v === 'rgb(0,0,0)'

        svgEl.querySelectorAll('path, line, rect, circle, polygon, polyline').forEach(el => {
          const stroke = el.getAttribute('stroke')
          const fill = el.getAttribute('fill')

          // Notes and beams already colored per-note above — skip if already set to
          // hit/miss colors so we don't overwrite them
          const isHitMiss = (v: string | null) =>
            v === HIT_COLOR || v === MISS_COLOR

          if (!isHitMiss(stroke) && isBlackColor(stroke)) {
            el.setAttribute('stroke', DARK_STAFF_COLOR)
          }
          if (!isHitMiss(fill) && fill !== 'none' && isBlackColor(fill)) {
            el.setAttribute('fill', DARK_NOTE_COLOR)
          }
        })

        // Also handle text elements (accidentals, clef numbers, etc.)
        svgEl.querySelectorAll('text').forEach(el => {
          const fill = el.getAttribute('fill')
          if (!fill || fill === '#000000' || fill === 'black' || fill === '#000') {
            el.setAttribute('fill', DARK_NOTE_COLOR)
          }
        })
      }
    }

    // Draw cursor
    if (cursorBeat !== undefined && cursorBeat >= 0) {
      const beatsPerMeasure = score.numBeats
      const measureIndex = Math.floor(cursorBeat / beatsPerMeasure)
      const beatInMeasure = cursorBeat % beatsPerMeasure

      if (measureIndex < measureCount) {
        let cursorX = STAVE_PADDING
        for (let i = 0; i < measureIndex; i++) {
          cursorX += i === 0 ? STAVE_WIDTH + FIRST_STAVE_EXTRA : STAVE_WIDTH
        }
        const currentWidth = measureIndex === 0
          ? STAVE_WIDTH + FIRST_STAVE_EXTRA
          : STAVE_WIDTH
        const noteArea = currentWidth - (measureIndex === 0 ? 90 : 30)
        const offset = measureIndex === 0 ? 80 : 20
        cursorX += offset + (beatInMeasure / beatsPerMeasure) * noteArea

        const svgEl = container.querySelector('svg')
        if (svgEl) {
          // Cursor glow (wider, semi-transparent)
          const glow = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          glow.setAttribute('x1', String(cursorX))
          glow.setAttribute('y1', String(TREBLE_Y))
          glow.setAttribute('x2', String(cursorX))
          glow.setAttribute('y2', String(BASS_Y + 80))
          glow.setAttribute('stroke', CURSOR_COLOR)
          glow.setAttribute('stroke-width', '6')
          glow.setAttribute('opacity', '0.2')
          svgEl.appendChild(glow)

          // Cursor line
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          line.setAttribute('x1', String(cursorX))
          line.setAttribute('y1', String(TREBLE_Y))
          line.setAttribute('x2', String(cursorX))
          line.setAttribute('y2', String(BASS_Y + 80))
          line.setAttribute('stroke', CURSOR_COLOR)
          line.setAttribute('stroke-width', '2')
          line.setAttribute('opacity', '0.8')
          svgEl.appendChild(line)
        }
      }
    }
  }, [score, cursorBeat, hitNotes, missNotes, darkMode])

  return (
    <div
      ref={containerRef}
      className="score-renderer"
      style={{ overflowX: 'auto', width: '100%' }}
    />
  )
}
