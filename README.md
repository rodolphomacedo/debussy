# Debussy — Impressionist Piano Learning

A 100% browser-based piano learning application that connects your digital piano via USB/MIDI, renders real-time sheet music, produces realistic piano sound, and evaluates your performance with A–F grading.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Practice Mode** — Play along with sheet music and receive real-time feedback with hit/error sounds and A–F grading
- **Capture Mode** — Free play that automatically transcribes your performance into sheet music
- **Real-Time MIDI** — Connect any USB/MIDI keyboard (tested with Yamaha P-125)
- **Realistic Sound** — Salamander Grand Piano samples via Tone.js Sampler
- **Sheet Music Rendering** — Grand staff (treble + bass clef) with animated cursor via VexFlow
- **Performance Scoring** — Timing-based evaluation with perfect/partial hit detection and detailed statistics

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5 | Static typing |
| Vite | 8 | Build tool & dev server |
| VexFlow | 5 | SVG sheet music rendering |
| Tone.js | 15 | Audio engine (Sampler + Transport) |
| WebMidi | 3 | Web MIDI API wrapper |
| Zustand | 5 | Global state management |
| Tailwind CSS | 4 | Utility-first styling |
| Vitest | latest | Unit & component testing |

## Getting Started

### Prerequisites

- Node.js 18+
- A USB/MIDI digital piano (optional — the app works without one)
- A Chromium-based browser (Chrome, Edge, Brave) for Web MIDI API support

### Installation

```bash
git clone https://github.com/rodolphomacedo/debussy.git
cd debussy
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Running Tests

```bash
npm test          # Run all tests once
npm run test:watch  # Watch mode
```

### Building for Production

```bash
npm run build
```

Output goes to `dist/`.

## Architecture

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root layout + screen navigation
├── store/
│   └── useAppStore.ts          # Zustand global state
├── hooks/
│   ├── useMidi.ts              # Web MIDI: noteOn/noteOff events
│   └── usePlayback.ts          # Tone.Transport clock + cursor sync
├── components/
│   ├── LoadingScreen.tsx       # Splash screen + audio init
│   ├── HomeScreen.tsx          # Mode selection (Practice/Capture)
│   ├── PracticeScreen.tsx      # Play-along mode + scoring
│   ├── CaptureScreen.tsx       # Free play → sheet music
│   ├── ResultsScreen.tsx       # Grade + performance breakdown
│   ├── ScoreRenderer.tsx       # VexFlow grand staff renderer
│   ├── PianoKeyboard.tsx       # Visual keyboard (C3–C5)
│   └── MidiMonitor.tsx         # MIDI connection status
├── lib/
│   ├── midiToNote.ts           # MIDI number ↔ VexFlow notation
│   ├── scorer.ts               # Performance evaluation engine
│   ├── scoreBuilder.ts         # Build VexFlow structures from notes
│   ├── audioEngine.ts          # Tone.Sampler + Salamander samples
│   ├── quantize.ts             # Duration quantization for capture
│   └── demoScore.ts            # Für Elise demo (8 bars)
└── styles/
    └── global.css              # Ornate gold/leather theme
```

### Data Flow

1. **MIDI Input** → `useMidi` hook receives noteOn/noteOff events from the connected keyboard
2. **Audio** → `audioEngine` plays Salamander Grand Piano samples via Tone.Sampler
3. **Practice Mode** → `usePlayback` drives Tone.Transport clock, `scorer` evaluates timing accuracy
4. **Capture Mode** → Raw MIDI events are quantized and converted to VexFlow notation
5. **Rendering** → `ScoreRenderer` draws the grand staff using VexFlow 5

### Scoring Algorithm

- **Timing window:** ±300ms from the expected beat
- **Perfect hit** (≤150ms): 1.0 points
- **Partial hit** (150–300ms): 0.5 points
- **Miss:** 0 points
- **Extra notes:** -0.1 penalty each
- **Grades:** A ≥ 90%, B ≥ 75%, C ≥ 60%, D ≥ 45%, F < 45%

## Browser Support

Web MIDI API is required for MIDI input. Currently supported in:

- Google Chrome
- Microsoft Edge
- Brave
- Opera

Firefox and Safari do not support Web MIDI API natively.

## License

[MIT](LICENSE) — grabatus.com
