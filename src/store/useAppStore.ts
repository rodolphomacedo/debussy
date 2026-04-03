import { create } from 'zustand'
import type { ScoreData } from '../lib/demoScore'
import type { ScoreResult } from '../lib/scorer'

export type Screen = 'loading' | 'home' | 'selection' | 'config' | 'practice' | 'results' | 'capture' | 'ear-training' | 'composer'

export interface CapturedNote {
  pitch: number
  velocity: number
  startTime: number
  endTime: number
}

interface AppState {
  screen: Screen
  mode: 'practice' | 'capture'
  bpm: number
  lastScore: ScoreResult | null
  capturedNotes: CapturedNote[]
  activeScore: ScoreData | null
  isAudioReady: boolean
  selectedScore: ScoreData | null
  handSelection: 'both' | 'left' | 'right'
  initialCount: boolean
  soundFeedback: boolean
  settingsOpen: boolean
  metronomeVolume: number
  pianoVolume: number
  sfxVolume: number
  keyboardOctaves: number
  sustainLock: boolean

  setScreen: (screen: Screen) => void
  setMode: (mode: 'practice' | 'capture') => void
  setBpm: (bpm: number) => void
  setLastScore: (score: ScoreResult | null) => void
  addCapturedNote: (note: CapturedNote) => void
  clearCapturedNotes: () => void
  setActiveScore: (score: ScoreData | null) => void
  setAudioReady: (ready: boolean) => void
  setSelectedScore: (score: ScoreData | null) => void
  setHandSelection: (hand: 'both' | 'left' | 'right') => void
  setInitialCount: (on: boolean) => void
  setSoundFeedback: (on: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setMetronomeVolume: (vol: number) => void
  setPianoVolume: (vol: number) => void
  setSfxVolume: (vol: number) => void
  setKeyboardOctaves: (octaves: number) => void
  setSustainLock: (on: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'loading',
  mode: 'practice',
  bpm: 72,
  lastScore: null,
  capturedNotes: [],
  activeScore: null,
  isAudioReady: false,
  selectedScore: null,
  handSelection: 'both',
  initialCount: true,
  soundFeedback: true,
  settingsOpen: false,
  metronomeVolume: 0.7,
  pianoVolume: 0.8,
  sfxVolume: 0.5,
  keyboardOctaves: 3,
  sustainLock: false,

  setScreen: (screen) => set({ screen }),
  setMode: (mode) => set({ mode }),
  setBpm: (bpm) => set({ bpm }),
  setLastScore: (score) => set({ lastScore: score }),
  addCapturedNote: (note) =>
    set((state) => ({ capturedNotes: [...state.capturedNotes, note] })),
  clearCapturedNotes: () => set({ capturedNotes: [] }),
  setActiveScore: (score) => set({ activeScore: score }),
  setAudioReady: (ready) => set({ isAudioReady: ready }),
  setSelectedScore: (score) => set({ selectedScore: score }),
  setHandSelection: (hand) => set({ handSelection: hand }),
  setInitialCount: (on) => set({ initialCount: on }),
  setSoundFeedback: (on) => set({ soundFeedback: on }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setMetronomeVolume: (vol) => set({ metronomeVolume: vol }),
  setPianoVolume: (vol) => set({ pianoVolume: vol }),
  setSfxVolume: (vol) => set({ sfxVolume: vol }),
  setKeyboardOctaves: (octaves) => set({ keyboardOctaves: octaves }),
  setSustainLock: (on) => set({ sustainLock: on }),
}))
