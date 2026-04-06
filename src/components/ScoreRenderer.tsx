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
const STAVE_PADDING = 30
const TREBLE_Y = 40
const BASS_Y = 150
const FIRST_STAVE_EXTRA = 60
const SCORE_HEIGHT = 260

/** Returns the pixel X position of the playback cursor for a given beat. */
export function computeScoreCursorX(beat: number, numBeats: number): number {
  const measureIndex = Math.floor(beat / numBeats)
  const beatInMeasure = beat % numBeats
  let x = STAVE_PADDING
  for (let i = 0; i < measureIndex; i++) {
    x += i === 0 ? STAVE_WIDTH + FIRST_STAVE_EXTRA : STAVE_WIDTH
  }
  const w = measureIndex === 0 ? STAVE_WIDTH + FIRST_STAVE_EXTRA : STAVE_WIDTH
  const noteArea = w - (measureIndex === 0 ? 90 : 30)
  const offset = measureIndex === 0 ? 80 : 20
  x += offset + (beatInMeasure / numBeats) * noteArea
  return x
}
const CURSOR_COLOR = '#D4AF37'
const HIT_COLOR = '#4caf7a'
const MISS_COLOR = '#c94c4c'
const DARK_NOTE_COLOR = '#D4AF37'
const DARK_STAFF_COLOR = 'rgba(212, 175, 55, 0.5)'

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

/** Recolor all SVG elements to gold — handles both attributes and inline styles. */
function applyDarkMode(svgEl: SVGSVGElement) {
  const isBlack = (v: string | null | undefined) => {
    if (!v || v === '' || v === 'none') return false
    const n = v.trim().toLowerCase()
    return n === '#000000' || n === 'black' || n === '#000' ||
           n === 'rgb(0, 0, 0)' || n === 'rgb(0,0,0)'
  }

  svgEl.querySelectorAll<SVGElement>('path, line, rect, circle, polyline, polygon, text').forEach(el => {
    const fillAttr = el.getAttribute('fill')
    const strokeAttr = el.getAttribute('stroke')
    const inlineFill = el.style.fill
    const inlineStroke = el.style.stroke

    // --- FILL ---
    if (fillAttr !== 'none') {
      if (!fillAttr || isBlack(fillAttr)) {
        el.setAttribute('fill', DARK_NOTE_COLOR)
      }
    }
    if (inlineFill && inlineFill !== 'none' && isBlack(inlineFill)) {
      el.style.fill = DARK_NOTE_COLOR
    }

    // --- STROKE ---
    if (strokeAttr !== 'none') {
      if (!strokeAttr || isBlack(strokeAttr)) {
        el.setAttribute('stroke', DARK_STAFF_COLOR)
      }
    }
    if (inlineStroke && inlineStroke !== 'none' && isBlack(inlineStroke)) {
      el.style.stroke = DARK_STAFF_COLOR
    }
  })
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

    try {
      const measureCount = score.measures.length
      if (measureCount === 0) return

      const totalWidth =
        STAVE_PADDING +
        FIRST_STAVE_EXTRA + STAVE_WIDTH +
        (measureCount - 1) * STAVE_WIDTH +
        STAVE_PADDING

      const renderer = new Renderer(container, Renderer.Backends.SVG)
      renderer.resize(totalWidth, SCORE_HEIGHT)
      const context = renderer.getContext()

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

      // Post-process SVG — fix any remaining black elements VexFlow may
      // have rendered using inline styles or attributes after the context override
      if (darkMode) {
        const svgEl = container.querySelector<SVGSVGElement>('svg')
        if (svgEl) {
          applyDarkMode(svgEl)

          // Restore hit/miss colors that applyDarkMode may have clobbered
          svgEl.querySelectorAll<SVGElement>('[data-hit]').forEach(el => {
            el.setAttribute('fill', HIT_COLOR)
            el.setAttribute('stroke', HIT_COLOR)
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
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            glow.setAttribute('x1', String(cursorX))
            glow.setAttribute('y1', String(TREBLE_Y))
            glow.setAttribute('x2', String(cursorX))
            glow.setAttribute('y2', String(BASS_Y + 80))
            glow.setAttribute('stroke', CURSOR_COLOR)
            glow.setAttribute('stroke-width', '6')
            glow.setAttribute('opacity', '0.2')
            svgEl.appendChild(glow)

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
    } catch (err) {
      // Show render error visibly so it can be diagnosed
      container.innerHTML = `
        <div style="color:#D4AF37;padding:20px;font-family:serif;font-size:14px;opacity:0.7;">
          Score render error: ${err instanceof Error ? err.message : String(err)}
        </div>`
    }
  }, [score, cursorBeat, hitNotes, missNotes, darkMode])

  return (
    <div
      ref={containerRef}
      className="score-renderer"
      style={{ overflowX: 'auto', width: '100%', minHeight: `${SCORE_HEIGHT}px` }}
    />
  )
}
