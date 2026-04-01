import { create } from 'zustand'
import type { ScoreData } from '../lib/demoScore'
import type { ScoreResult } from '../lib/scorer'

export type Screen = 'loading' | 'home' | 'practice' | 'results' | 'capture'

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

  setScreen: (screen: Screen) => void
  setMode: (mode: 'practice' | 'capture') => void
  setBpm: (bpm: number) => void
  setLastScore: (score: ScoreResult | null) => void
  addCapturedNote: (note: CapturedNote) => void
  clearCapturedNotes: () => void
  setActiveScore: (score: ScoreData | null) => void
  setAudioReady: (ready: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'loading',
  mode: 'practice',
  bpm: 72,
  lastScore: null,
  capturedNotes: [],
  activeScore: null,
  isAudioReady: false,

  setScreen: (screen) => set({ screen }),
  setMode: (mode) => set({ mode }),
  setBpm: (bpm) => set({ bpm }),
  setLastScore: (score) => set({ lastScore: score }),
  addCapturedNote: (note) =>
    set((state) => ({ capturedNotes: [...state.capturedNotes, note] })),
  clearCapturedNotes: () => set({ capturedNotes: [] }),
  setActiveScore: (score) => set({ activeScore: score }),
  setAudioReady: (ready) => set({ isAudioReady: ready }),
}))
