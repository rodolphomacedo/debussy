import { useMidi } from '../hooks/useMidi'
import { midiToNoteName } from '../lib/midiToNote'

export interface MidiMonitorProps {
  onNoteOn?: (note: number, velocity: number) => void
  onNoteOff?: (note: number) => void
}

export function MidiMonitor({ onNoteOn, onNoteOff }: MidiMonitorProps = {}) {
  const { devices, activeNote, isConnected, error } = useMidi({ onNoteOn, onNoteOff })

  return (
    <div className="midi-monitor">
      <div className="midi-status">
        <span
          className={`midi-indicator ${isConnected ? 'connected' : 'disconnected'}`}
        />
        <span>{isConnected ? 'MIDI Connected' : 'No MIDI Device'}</span>
      </div>

      {error && <p className="midi-error">{error}</p>}

      {devices.length > 0 && (
        <ul className="midi-devices">
          {devices.map(device => (
            <li key={device.id}>{device.name}</li>
          ))}
        </ul>
      )}

      <div className="midi-note">
        {activeNote !== null ? (
          <span className="note-display">{midiToNoteName(activeNote)}</span>
        ) : (
          <span className="note-placeholder">—</span>
        )}
      </div>
    </div>
  )
}
