# Debussy

Browser-based MIDI piano practice app with real-time scoring and sheet music rendering.

## Stack

- **Runtime:** Vite 8 + React 19 + TypeScript 5
- **Sheet Music:** VexFlow 5 (SVG rendering)
- **MIDI:** WebMidi 3 (Web MIDI API wrapper)
- **Audio:** Tone.js 15 + Salamander Grand Piano samples via Tone.Sampler
- **State:** Zustand 5
- **Testing:** Vitest 4 + @testing-library/react + jsdom

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm test` — run all tests once
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — ESLint

## Conventions

- All code, comments, documentation, tests, and commit messages in **English**
- TDD: write tests first for all `src/lib/` modules
- Component tests with @testing-library/react for UI components
- Use Vitest globals (`describe`, `it`, `expect`) — no imports needed
- Strict TypeScript: no `any`, no type assertions unless unavoidable
- Functional components with hooks (no class components)
- State management via Zustand store (`src/store/useAppStore.ts`)
- File naming: camelCase for lib/hooks, PascalCase for components

## Project Structure

- `src/lib/` — Pure logic (no React, no side effects). Fully unit-tested.
- `src/hooks/` — React hooks wrapping browser APIs (MIDI, audio, transport)
- `src/components/` — React UI components
- `src/store/` — Zustand global state
- `src/test/` — Test setup and shared test utilities
- `src/styles/` — CSS

## Architecture Notes

- Audio requires user gesture to initialize (browser restriction). Use `initAudio()` on first click.
- MIDI note numbers: 0–127. Split point for hands: C4 (MIDI 60) — treble ≥ 60, bass < 60.
- VexFlow 5 uses string-based `setType('brace')` for StaveConnector (not enum).
- Scoring tolerance: ±300ms window (perfect ≤150ms, partial 150–300ms).
