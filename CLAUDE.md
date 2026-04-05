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

## PracticeScreen Architecture (STRICT)

The practice screen has **EXACTLY 2 parts** — no intermediate sections. Period.

```
┌─────────────────────────────────────────┐
│  TOP SECTION  (OrnateFrame corners)     │
│  ─────────────────────────────────────  │
│  PracticeHeader  (back · logo · stats)  │
│  PracticeHeader  (title · composer·BPM) │
│  ─────────────────────────────────────  │
│  ScoreRenderer  ← ALWAYS VISIBLE        │
│  ─────────────────────────────────────  │
│  PracticeControls (tabs · play · metro) │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  PIANO KEYBOARD  (PianoKeyboard)        │
└─────────────────────────────────────────┘
```

**Rules — violation = bug:**
- EVERYTHING except the piano must live inside the top section (`.practice-top-section`)
- The `OrnateFrame` is `absolute inset-0` inside the top section — its corners frame ALL content
- The score (`ScoreRenderer`) must ALWAYS be visible — never collapse, never overflow outside
- `.practice-layout` must have exactly 2 direct children: top section + keyboard
- NO third element, NO intermediate section between top section and keyboard

**Componentization rule:** Every UI element is a reusable component. The screen file (`PracticeScreen.tsx`) is only the composition of those components — no raw HTML elements for UI pieces:
- `PracticeHeader` — back button, logo, title/composer/BPM, stats/mode indicator
- `PracticeControls` — mode tabs, play/reset buttons, metronome toggle
- Score area uses `ScoreRenderer` directly (already a component)

**CSS rules that enforce this:**
- `.practice-top-section`: `flex: 1 1 0` — takes all space except keyboard
- `.practice-score-box`: `flex: 1 1 auto; min-height: 180px` — never collapses
- `.practice-header-row`, `.practice-info-row`, `.practice-controls-row`: `flex-shrink: 0` — never collapse
