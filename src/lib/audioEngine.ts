import * as Tone from 'tone'

/**
 * Salamander Grand Piano samples — multi-velocity Steinway recordings.
 * We load one sample per octave; Tone.Sampler auto-repitches the rest.
 * Hosted on the official Tone.js examples CDN.
 */
const SALAMANDER_BASE_URL =
  'https://tonejs.github.io/audio/salamander/'

const SALAMANDER_URLS: Record<string, string> = {
  A0: 'A0.mp3',
  C1: 'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  A1: 'A1.mp3',
  C2: 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2: 'A2.mp3',
  C3: 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5: 'A5.mp3',
  C6: 'C6.mp3',
  'D#6': 'Ds6.mp3',
  'F#6': 'Fs6.mp3',
  A6: 'A6.mp3',
  C7: 'C7.mp3',
  'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3',
  A7: 'A7.mp3',
  C8: 'C8.mp3',
}

let piano: Tone.Sampler | null = null
let audioReady = false

// ── Sustain pedal state ──
// When sustain is active, released keys are held until pedal lifts
let sustainActive = false
const sustainedNotes = new Set<number>()

/**
 * Initialize the audio engine. Must be called inside a user gesture handler
 * (click, keydown) due to browser autoplay policy.
 */
export async function initAudio(): Promise<void> {
  if (audioReady) return

  await Tone.start()

  // Eliminate scheduling lookahead for instant response to key presses
  Tone.getContext().lookAhead = 0

  piano = new Tone.Sampler({
    urls: SALAMANDER_URLS,
    baseUrl: SALAMANDER_BASE_URL,
    release: 1,
    onload: () => {
      audioReady = true
    },
  }).toDestination()

  // Wait for all samples to finish loading
  await Tone.loaded()
  audioReady = true
}

/**
 * Check if the audio engine is ready to play.
 */
export function isAudioReady(): boolean {
  return audioReady
}

/**
 * Convert a MIDI number to a Tone.js note name (e.g., 60 → "C4").
 */
export function midiToToneNote(midi: number): string {
  return Tone.Frequency(midi, 'midi').toNote()
}

/**
 * Play a piano note by MIDI number.
 */
export function playNote(midiNumber: number, velocity = 0.8): void {
  if (!piano || !audioReady) return
  const note = midiToToneNote(midiNumber)
  sustainedNotes.delete(midiNumber)
  piano.triggerAttack(note, Tone.now(), velocity)
}

/**
 * Release a piano note by MIDI number.
 * If sustain pedal is active, the note is held until the pedal lifts.
 */
export function releaseNote(midiNumber: number): void {
  if (!piano || !audioReady) return
  if (sustainActive) {
    sustainedNotes.add(midiNumber)
    return
  }
  const note = midiToToneNote(midiNumber)
  piano.triggerRelease(note, Tone.now())
}

/**
 * Set the sustain pedal state.
 * When released (false), all held notes are released.
 */
export function setSustain(active: boolean): void {
  sustainActive = active
  if (!active && piano && audioReady) {
    for (const midi of sustainedNotes) {
      const note = midiToToneNote(midi)
      piano.triggerRelease(note, Tone.now())
    }
    sustainedNotes.clear()
  }
}

/**
 * Check if sustain is currently active.
 */
export function isSustainActive(): boolean {
  return sustainActive
}

/**
 * Apply soft pedal (una corda) — reduces velocity of subsequent notes.
 * This is handled at the MIDI input level, not here.
 */
export function setSoftPedal(_active: boolean): void {
  // Soft pedal effect is applied by reducing velocity at the input layer
}

/**
 * Play an error sound — tritone interval (D4 + Ab4).
 * Sawtooth oscillator, very short envelope (0.15s).
 * The tritone ("diabolus in musica") is immediately recognizable as "wrong".
 */
export function playErrorSound(): void {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
  }).toDestination()

  synth.triggerAttackRelease(['D4', 'Ab4'], '16n')
  setTimeout(() => synth.dispose(), 500)
}

/**
 * Play a piano note at a specific Tone.js transport time (for scheduled playback).
 * `atTime` is a Tone.js time value in seconds from transport start.
 */
export function playScheduledNote(midiNumber: number, durationSec: number, atTime: number): void {
  if (!piano || !audioReady) return
  const note = midiToToneNote(midiNumber)
  piano.triggerAttackRelease(note, durationSec, atTime, 0.75)
}

// Singleton metronome synth — created once, reused across calls
let _clickSynth: Tone.Synth | null = null

function getClickSynth(): Tone.Synth {
  if (!_clickSynth) {
    _clickSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.04 },
      volume: -8,
    }).toDestination()
  }
  return _clickSynth
}

/**
 * Play a metronome tick at a specific Tone.js transport time.
 */
export function playMetronomeTick(atTime: number, isDownbeat = false): void {
  if (!audioReady) return
  getClickSynth().triggerAttackRelease(isDownbeat ? 'G6' : 'C6', '32n', atTime)
}

/**
 * Play a hit/success sound — a soft, high sine bell.
 */
export function playHitSound(): void {
  const bell = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).toDestination()

  bell.triggerAttackRelease('C6', '32n')
  setTimeout(() => bell.dispose(), 500)
}
