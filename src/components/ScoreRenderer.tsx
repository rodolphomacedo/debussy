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
const FIRST_STAVE_EXTRA = 60 // Extra width for clef + time signature on first stave
const SCORE_HEIGHT = 260
const CURSOR_COLOR = '#facc15'
const HIT_COLOR = '#4caf7a'
const MISS_COLOR = '#c94c4c'

export interface ScoreRendererProps {
  score: ScoreData
  cursorBeat?: number
  hitNotes?: Set<string>  // "measureIndex-noteIndex" keys
  missNotes?: Set<string>
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
}: ScoreRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear previous render safely (no innerHTML)
    clearContainer(container)

    const measureCount = score.measures.length
    const totalWidth =
      STAVE_PADDING +
      FIRST_STAVE_EXTRA + STAVE_WIDTH + // first measure wider
      (measureCount - 1) * STAVE_WIDTH +
      STAVE_PADDING

    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(totalWidth, SCORE_HEIGHT)
    const context = renderer.getContext()

    let x = STAVE_PADDING

    for (let i = 0; i < measureCount; i++) {
      const measure = score.measures[i]
      const isFirst = i === 0
      const width = isFirst ? STAVE_WIDTH + FIRST_STAVE_EXTRA : STAVE_WIDTH

      // Create staves
      const trebleStave = new Stave(x, TREBLE_Y, width)
      const bassStave = new Stave(x, BASS_Y, width)

      if (isFirst) {
        trebleStave.addClef('treble').addTimeSignature(score.timeSignature)
        bassStave.addClef('bass').addTimeSignature(score.timeSignature)
      }

      trebleStave.setContext(context).draw()
      bassStave.setContext(context).draw()

      // Connectors on first measure
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

      // Right barline connector
      new StaveConnector(trebleStave, bassStave)
        .setType('singleRight')
        .setContext(context)
        .draw()

      // Build notes
      const trebleNotes = buildMeasureNotes(measure.treble, 'treble')
      const bassNotes = buildMeasureNotes(measure.bass, 'bass')

      // Apply hit/miss coloring
      if (hitNotes || missNotes) {
        trebleNotes.forEach((note, ni) => {
          const key = `${i}-${ni}`
          if (hitNotes?.has(key)) {
            note.setStyle({ fillStyle: HIT_COLOR, strokeStyle: HIT_COLOR })
          } else if (missNotes?.has(key)) {
            note.setStyle({ fillStyle: MISS_COLOR, strokeStyle: MISS_COLOR })
          }
        })
      }

      // Create voices
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

      // Format and draw
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

    // Draw animated cursor
    if (cursorBeat !== undefined && cursorBeat >= 0) {
      const beatsPerMeasure = score.numBeats
      const measureIndex = Math.floor(cursorBeat / beatsPerMeasure)
      const beatInMeasure = cursorBeat % beatsPerMeasure

      if (measureIndex < measureCount) {
        // Calculate cursor x position
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

        // Draw cursor line spanning both staves
        const svgEl = container.querySelector('svg')
        if (svgEl) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          line.setAttribute('x1', String(cursorX))
          line.setAttribute('y1', String(TREBLE_Y))
          line.setAttribute('x2', String(cursorX))
          line.setAttribute('y2', String(BASS_Y + 80))
          line.setAttribute('stroke', CURSOR_COLOR)
          line.setAttribute('stroke-width', '2')
          line.setAttribute('opacity', '0.7')
          svgEl.appendChild(line)
        }
      }
    }
  }, [score, cursorBeat, hitNotes, missNotes])

  return (
    <div
      ref={containerRef}
      className="score-renderer"
      style={{ overflowX: 'auto', width: '100%' }}
    />
  )
}
