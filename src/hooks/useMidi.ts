import { useCallback, useEffect, useRef, useState } from 'react'
import { WebMidi, type Input, type NoteMessageEvent } from 'webmidi'

export interface MidiDevice {
  id: string
  name: string
}

export interface PedalState {
  sustain: boolean
  sostenuto: boolean
  soft: boolean
}

export interface UseMidiOptions {
  onNoteOn?: (note: number, velocity: number) => void
  onNoteOff?: (note: number) => void
  onSustainChange?: (active: boolean) => void
  onSostenutoChange?: (active: boolean) => void
  onSoftPedalChange?: (active: boolean) => void
}

export interface UseMidiReturn {
  devices: MidiDevice[]
  activeNote: number | null
  pressedNotes: Set<number>
  pedals: PedalState
  isConnected: boolean
  error: string | null
}

// CC numbers for piano pedals
const CC_SUSTAIN = 64
const CC_SOSTENUTO = 66
const CC_SOFT = 67

export function useMidi(options: UseMidiOptions = {}): UseMidiReturn {
  const [devices, setDevices] = useState<MidiDevice[]>([])
  const [activeNote, setActiveNote] = useState<number | null>(null)
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(new Set())
  const [pedals, setPedals] = useState<PedalState>({ sustain: false, sostenuto: false, soft: false })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optionsRef = useRef(options)
  optionsRef.current = options

  const updateDevices = useCallback(() => {
    const inputs = WebMidi.inputs.map((input: Input) => ({
      id: input.id,
      name: input.name ?? 'Unknown Device',
    }))
    setDevices(inputs)
    setIsConnected(inputs.length > 0)
  }, [])

  const handleNoteOn = useCallback((e: NoteMessageEvent) => {
    const midi = e.note.number
    const velocity = e.note.rawAttack / 127
    setActiveNote(midi)
    setPressedNotes(prev => {
      const next = new Set(prev)
      next.add(midi)
      return next
    })
    optionsRef.current.onNoteOn?.(midi, velocity)
  }, [])

  const handleNoteOff = useCallback((e: NoteMessageEvent) => {
    const midi = e.note.number
    setPressedNotes(prev => {
      const next = new Set(prev)
      next.delete(midi)
      return next
    })
    optionsRef.current.onNoteOff?.(midi)
  }, [])

  const handleControlChange = useCallback((e: { controller: { number: number }; rawValue?: number; value?: number | boolean }) => {
    const cc = e.controller.number
    // CC value >= 64 = on, < 64 = off (MIDI standard)
    const rawVal = e.rawValue ?? (typeof e.value === 'number' ? Math.round(e.value * 127) : (e.value ? 127 : 0))
    const active = rawVal >= 64

    if (cc === CC_SUSTAIN) {
      setPedals(prev => ({ ...prev, sustain: active }))
      optionsRef.current.onSustainChange?.(active)
    } else if (cc === CC_SOSTENUTO) {
      setPedals(prev => ({ ...prev, sostenuto: active }))
      optionsRef.current.onSostenutoChange?.(active)
    } else if (cc === CC_SOFT) {
      setPedals(prev => ({ ...prev, soft: active }))
      optionsRef.current.onSoftPedalChange?.(active)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        await WebMidi.enable({ sysex: false })
        if (!mounted) return

        updateDevices()

        WebMidi.addListener('connected', updateDevices)
        WebMidi.addListener('disconnected', updateDevices)

        for (const input of WebMidi.inputs) {
          input.addListener('noteon', handleNoteOn)
          input.addListener('noteoff', handleNoteOff)
          input.addListener('controlchange', handleControlChange)
        }
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to enable MIDI')
      }
    }

    init()

    return () => {
      mounted = false
      try {
        for (const input of WebMidi.inputs) {
          input.removeListener('noteon', handleNoteOn)
          input.removeListener('noteoff', handleNoteOff)
          input.removeListener('controlchange', handleControlChange)
        }
        WebMidi.removeListener('connected', updateDevices)
        WebMidi.removeListener('disconnected', updateDevices)
      } catch {
        // WebMidi may not be enabled yet
      }
    }
  }, [updateDevices, handleNoteOn, handleNoteOff, handleControlChange])

  return { devices, activeNote, pressedNotes, pedals, isConnected, error }
}
