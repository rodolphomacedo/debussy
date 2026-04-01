import { useCallback, useEffect, useRef, useState } from 'react'
import { WebMidi, type Input, type NoteMessageEvent } from 'webmidi'

export interface MidiDevice {
  id: string
  name: string
}

export interface UseMidiOptions {
  onNoteOn?: (note: number, velocity: number) => void
  onNoteOff?: (note: number) => void
}

export interface UseMidiReturn {
  devices: MidiDevice[]
  activeNote: number | null
  pressedNotes: Set<number>
  isConnected: boolean
  error: string | null
}

export function useMidi(options: UseMidiOptions = {}): UseMidiReturn {
  const [devices, setDevices] = useState<MidiDevice[]>([])
  const [activeNote, setActiveNote] = useState<number | null>(null)
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(new Set())
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
        }
        WebMidi.removeListener('connected', updateDevices)
        WebMidi.removeListener('disconnected', updateDevices)
      } catch {
        // WebMidi may not be enabled yet
      }
    }
  }, [updateDevices, handleNoteOn, handleNoteOff])

  return { devices, activeNote, pressedNotes, isConnected, error }
}
