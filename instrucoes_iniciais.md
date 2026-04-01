ano Score
### Guia Técnico de Implementação
_MIDI · Partitura · Áudio · Scoring em Tempo Real_

---

## 1. Visão Geral do Projeto

O Piano Score é uma aplicação web que roda 100% no browser, sem backend necessário. Ela conecta um piano digital (ex: Yamaha P-125) via USB/MIDI, renderiza partituras com duas claves (clave de sol e fá), produz som com timbre real de piano usando soundfonts, e avalia a execução do músico em tempo real — dando uma nota de A a F ao final.

O projeto tem dois modos principais:

- **Modo Prática:** a partitura avança no tempo, o músico toca junto, e ao final recebe uma avaliação detalhada com breakdown por nota.
- **Modo Captura:** o músico toca livremente e a aplicação converte as notas MIDI em partitura automaticamente, separando mão direita e esquerda.

---

## 2. Stack Tecnológica

### 2.1 Dependências Principais

| Lib | Versão | Uso |
|-----|--------|-----|
| `vite` | ^5 | Build tool, servidor de desenvolvimento |
| `react` | ^18 | UI e gerenciamento de componentes |
| `typescript` | ^5 | Tipagem estática |
| `vexflow` | ^4.2 | Renderização de partitura em SVG/Canvas |
| `webmidi` | ^3 | Wrapper sobre Web MIDI API do browser |
| `tone` | ^14 | Clock de alta precisão e síntese de áudio |
| `@tonejs/piano` | ^0.2 | Timbre de piano via soundfonts (amostras reais) |
| `zustand` | ^4 | Estado global simples e reativo |

### 2.2 Comandos de Instalação

```bash
npx create-vite piano-score --template react-ts
cd piano-score
npm install vexflow@4 webmidi tone @tonejs/piano zustand
npm run dev
```

> **Nota de compatibilidade:** Chrome/Edge suportam a Web MIDI API nativamente sem plugins. Firefox requer a extensão "Jazz-Plugin" ou "WebMIDIAPIShim". A aplicação deve ser servida em HTTPS ou localhost.

---

## 3. Estrutura de Arquivos

```
piano-score/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── store/
│   │   └── useAppStore.ts          # estado global (modo, notas, score)
│   ├── hooks/
│   │   ├── useMidi.ts              # Web MIDI: eventos noteOn/noteOff
│   │   └── usePlayback.ts          # clock, cursor, sincronização
│   ├── components/
│   │   ├── ScoreRenderer.tsx       # VexFlow: duas claves + cursor animado
│   │   ├── ScoreCapture.tsx        # modo captura → partitura
│   │   ├── ScorePlayer.tsx         # modo prática + scoring
│   │   ├── MidiMonitor.tsx         # dispositivo MIDI + nota atual
│   │   ├── PianoKeyboard.tsx       # teclado visual C3–C6
│   │   └── ResultOverlay.tsx       # nota final + breakdown
│   ├── lib/
│   │   ├── midiToNote.ts           # MIDI number → notação VexFlow
│   │   ├── scorer.ts               # lógica de avaliação
│   │   ├── scoreBuilder.ts         # estrutura VexFlow a partir de notas
│   │   ├── audioEngine.ts          # timbre de piano + sons de erro
│   │   └── demoScore.ts            # Für Elise (8 compassos) como exemplo
│   └── styles/
│       └── global.css
├── index.html
├── vite.config.ts
└── package.json
```

---

## 4. Plano de Implementação — 5 Sessões

Cada sessão é projetada para durar 1–2 horas no Claude Code e resulta em código funcional e testável. Execute em sequência — cada sessão depende da anterior.

---

### Sessão 1 — Setup + MIDI Input

**Objetivo:** projeto rodando com MIDI conectado e notas aparecendo em tempo real.

**Prompt para Claude Code:**

```
Crie um projeto Vite + React + TypeScript chamado piano-score.
Instale: vexflow@4, webmidi@3, tone, @tonejs/piano, zustand.

Crie src/hooks/useMidi.ts que:
- Inicializa WebMidi.enable() com sysex: false
- Expõe: devices (lista de inputs), activeNote (último noteOn),
  pressedNotes (Set<number> das notas ativas no momento)
  - Emite eventos noteOn/noteOff via callbacks

  Crie src/lib/midiToNote.ts que converte MIDI number para
  notação VexFlow (ex: 60 → "c/4", 61 → "c#/4", 72 → "c/5").
  Trate todas as oitavas de 0 a 8.

  Crie src/components/MidiMonitor.tsx que exibe:
  - Lista de dispositivos MIDI conectados
  - A nota sendo pressionada em tempo real (nome + oitava)
  - Indicador visual (ponto verde/vermelho) de conexão
  ```

  ---

### Sessão 2 — Renderização da Partitura

**Objetivo:** partitura de duas claves renderizada com VexFlow.

**Prompt para Claude Code:**

```
Crie src/lib/demoScore.ts com estrutura de dados representando
8 compassos de Für Elise em 3/4, duas vozes:
  - treble: melodia (clave de sol)
    - bass: acompanhamento longo (clave de fá)
    Formato de cada nota: { pitch: "e/5", duration: "q", startBeat: number }

    Crie src/components/ScoreRenderer.tsx que:
    - Recebe um array de compassos com treble[] e bass[]
    - Renderiza grand staff (duas claves) com VexFlow 4, SVG
    - Usa StaveConnector com tipo "brace" para ligar as duas claves
    - Mostra cursor vertical (linha SVG animada) via prop cursorBeat
    - Aceita props hitNotes e missNotes para colorir notas (verde/vermelho)
    - Usa um ref para o container e redesenha ao mudar props
    - Suporta scroll horizontal se a partitura for longa
    ```

    > **Atenção VexFlow 4:** o StaveConnector usa `.setType('brace')` como string — não existe mais o enum `StaveConnector.type` da v3. Veja a Seção 7 para detalhes.

    ---

### Sessão 3 — Motor de Áudio

**Objetivo:** notas soando com timbre real de piano e feedback sonoro de erro.

**Prompt para Claude Code:**

```
Crie src/lib/audioEngine.ts com as seguintes responsabilidades:

1. PIANO COM TIMBRE REAL:
   - Importe Piano de @tonejs/piano
      - Crie e exporte async function initAudio(): Promise<void>
           que instancia o Piano e chama piano.load()
              - Exporte function playNote(midiNumber: number, velocity = 0.8)
                   que converte MIDI para notação Tone.js e chama piano.keyDown()
                      - Exporte function releaseNote(midiNumber: number)
                           que chama piano.keyUp()

                           2. AVISO SONORO DE ERRO:
                              - Crie um Tone.PolySynth com oscilador "sawtooth" e envelope curto
                                 - Exporte function playErrorSound() que toca um cluster dissonante
                                      (D4 + Ab4 simultaneamente, duração 0.15s — intervalo de trítono)
                                         - O som deve ser imediatamente reconhecível como "errado"

                                         3. AVISO SONORO DE ACERTO:
                                            - Exporte function playHitSound() com um sino curto e suave
                                                 usando Tone.Synth, oscilador "sine", frequência alta, decay rápido

                                                 Exporte também: isAudioReady(): boolean
                                                 Inicialize o Tone.context no primeiro gesto do usuário (exigência do browser).
                                                 ```

                                                 ---

### Sessão 4 — Modo Prática + Scoring

**Objetivo:** o usuário toca junto com a partitura e recebe avaliação ao final.

**Prompt para Claude Code:**

```
Crie src/hooks/usePlayback.ts que:
- Usa Tone.Transport como clock principal (não setTimeout)
- Expõe: start(), stop(), reset(), currentBeat (reativo via useState)
- Dispara callback onExpectedNote(note, beat) no momento certo
- Suporta configurar BPM (padrão: 72)

Crie src/lib/scorer.ts com:

interface PlayedNote   { pitch: number; timestamp: number }
interface ExpectedNote { pitch: string; beat: number; beatMs: number }
interface ScoreResult  {
      hits: number; misses: number; extras: number;
        timingErrors: number[]; percentScore: number; grade: Grade
}

function evaluatePerformance(expected, played): ScoreResult
- Janela de tolerância de timing: ±300ms
- Pitch correto com timing ≤ 150ms = hit perfeito (peso 1.0)
- Pitch correto com timing 150–300ms = hit parcial (peso 0.5)
- Nota esperada não tocada = miss
- Nota extra sem correspondência = penalidade leve (-0.1)
- Grade: A ≥ 90%, B ≥ 75%, C ≥ 60%, D ≥ 45%, F < 45%

Crie src/components/ScorePlayer.tsx que:
- Integra usePlayback, useMidi e audioEngine
- Toca playErrorSound() imediatamente ao errar uma nota
- Toca playHitSound() para acertos
- Ao terminar, chama evaluatePerformance e exibe ResultOverlay
- Mostra barra de progresso da execução
```

---

### Sessão 5 — Modo Captura + UI Final

**Objetivo:** captura de notas via MIDI, geração de partitura e polimento visual.

**Prompt para Claude Code:**

```
Crie src/components/ScoreCapture.tsx que:
- Escuta eventos MIDI via useMidi + toca som via audioEngine ao capturar
- Captura: pitch, velocity, timestamp do noteOn e noteOff
- Quantiza durações para o grid mais próximo: w/h/q/8/16
  usando BPM configurável (padrão 120)
    Função: quantizeDuration(durationMs, bpm): VexFlowDuration
    - Agrupa notas em compassos automaticamente pelo BPM
    - Separa mão direita (notas >= 60, C4) e mão esquerda (< 60)
    - Permite: iniciar/parar captura, limpar, confirmar (popula ScoreRenderer)
    - Exibe notas capturadas como pills coloridas durante a gravação

    Crie src/components/PianoKeyboard.tsx:
    - Renderiza oitavas C3 a C6 em SVG (3 oitavas, 21 teclas brancas)
    - Teclas brancas: 28px width, 80px height
    - Teclas pretas: 18px width, 50px height, posicionadas corretamente
    - Destaca teclas pressionadas via pressedNotes do useMidi
    - Mostra nome da nota abaixo das teclas Dó de cada oitava

    Crie src/store/useAppStore.ts com zustand:
    - mode: "practice" | "capture"
    - bpm: number (padrão 72)
    - lastScore: ScoreResult | null
    - capturedNotes: CapturedNote[]
    - activeScore: ScoreData

    Integre tudo em App.tsx com layout:
    - Header: nome, indicador MIDI, modo atual
    - Sidebar esquerda: controles de modo, score, BPM, dispositivo MIDI
    - Centro: ScoreRenderer + controles de playback
    - Footer: PianoKeyboard visual
    - Tema escuro, fundo #0f0e0c, fonte Instrument Serif nos títulos
    ```

    ---

## 5. Motor de Áudio — Detalhes Técnicos

### 5.1 Soundfont via @tonejs/piano

O `@tonejs/piano` carrega amostras de piano Steinway em múltiplas camadas de velocidade, dando um timbre muito mais natural que síntese pura. As amostras (~5MB) são carregadas via CDN na primeira inicialização.

```typescript
// src/lib/audioEngine.ts
import { Piano } from '@tonejs/piano'
import * as Tone from 'tone'

const piano = new Piano({ velocities: 4 })  // 4 camadas de velocity
piano.toDestination()

export async function initAudio() {
      await Tone.start()    // exigido pelo browser (gesto do usuário)
        await piano.load()    // carrega samples — mostrar spinner aqui
}

export function playNote(midi: number, velocity = 0.8) {
      const note = Tone.Frequency(midi, 'midi').toNote()
        piano.keyDown({ note, velocity })
}

export function releaseNote(midi: number) {
      const note = Tone.Frequency(midi, 'midi').toNote()
        piano.keyUp({ note })
}
```

### 5.2 Som de Erro — Trítono

O aviso de erro usa dois osciladores em intervalo de trítono (D4 + Ab4). É o intervalo historicamente chamado de _diabolus in musica_ — dissonância máxima, inconfundível sem ser irritante com o envelope curtíssimo de 0.15s.

```typescript
export function playErrorSound() {
      const synth = new Tone.PolySynth(Tone.Synth, {
              oscillator: { type: 'sawtooth' },
                  envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 }
                    }).toDestination()
                      synth.triggerAttackRelease(['D4', 'Ab4'], '16n')
                        setTimeout(() => synth.dispose(), 500)
}
```

### 5.3 Som de Acerto — Sino

```typescript
export function playHitSound() {
      const bell = new Tone.Synth({
              oscillator: { type: 'sine' },
                  envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
                    }).toDestination()
                      bell.triggerAttackRelease('C6', '32n')
                        setTimeout(() => bell.dispose(), 500)
}
```

> **Importante:** o browser bloqueia qualquer áudio antes de um gesto do usuário (click, keydown). O `initAudio()` deve ser chamado dentro de um `onClick`. Uma boa UX é mostrar uma tela "Clique para começar" na primeira abertura.

---

## 6. Lógica de Scoring

### 6.1 Tabela de Pesos

| Situação | Classificação | Peso |
|----------|--------------|------|
| Pitch correto + timing ≤ 150ms | Hit perfeito | 1.0 |
| Pitch correto + timing 150–300ms | Hit parcial | 0.5 |
| Pitch correto + timing > 300ms | Miss (tardio) | 0.0 |
| Nota esperada não tocada | Miss | 0.0 |
| Nota tocada sem correspondência | Extra | -0.1 (penalidade) |

### 6.2 Tabela de Notas

| Nota | Percentual Mínimo | Descrição |
|------|------------------|-----------|
| A | ≥ 90% | Excelente — quase sem erros |
| B | ≥ 75% | Bom — erros esporádicos |
| C | ≥ 60% | Regular — precisa praticar |
| D | ≥ 45% | Fraco — muitos erros |
| F | < 45% | Tente de novo |

### 6.3 Implementação de Referência

```typescript
// src/lib/scorer.ts
export function evaluatePerformance(
  expected: ExpectedNote[],
    played: PlayedNote[]
    ): ScoreResult {
          let totalWeight = 0
            let earnedWeight = 0
              const matched = new Set<number>()

                for (const exp of expected) {
                        totalWeight += 1
                            const expMidi = noteNameToMidi(exp.pitch)
                                const matchIdx = played.findIndex((p, i) =>
                                      !matched.has(i) &&
                                            p.pitch === expMidi &&
                                                  Math.abs(p.timestamp - exp.beatMs) < 300
                                                      )
                                    if (matchIdx >= 0) {
                                              const timingErr = Math.abs(played[matchIdx].timestamp - exp.beatMs)
                                                    earnedWeight += timingErr < 150 ? 1.0 : 0.5
                                                          matched.add(matchIdx)
                                                              }
                                                                }

                                                                  const extras = played.length - matched.size
                                                                    earnedWeight = Math.max(0, earnedWeight - extras * 0.1)

                                                                      const pct = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0
                                                                        return {
                                                                                hits: matched.size,
                                                                                    misses: expected.length - matched.size,
                                                                                        extras,
                                                                                            timingErrors: [],
                                                                                                percentScore: pct,
                                                                                                    grade: pctToGrade(pct)
                                                                                                      }
    }
    ```

    ---

## 7. VexFlow 4 — Dicas Críticas

### 7.1 Grand Staff com Duas Claves

A parte mais delicada é conectar as duas claves corretamente com `StaveConnector`:

```typescript
import { Renderer, Stave, StaveConnector, Formatter, Voice } from 'vexflow'

const renderer = new Renderer(divRef.current, Renderer.Backends.SVG)
renderer.resize(800, 280)
const ctx = renderer.getContext()

const treble = new Stave(10, 40, 750).addClef('treble').addTimeSignature('3/4')
const bass   = new Stave(10, 140, 750).addClef('bass').addTimeSignature('3/4')

treble.setContext(ctx).draw()
bass.setContext(ctx).draw()

// Strings válidas para setType(): 'brace' | 'bracket' | 'singleLeft' | 'singleRight'
new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw()
new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw()
new StaveConnector(treble, bass).setType('singleRight').setContext(ctx).draw()
```

> **VexFlow v3 vs v4:** na v3 existia o enum `StaveConnector.type`. Na v4 passou a ser string passada diretamente para `.setType()`. Misturar as duas APIs é a causa mais comum de erros silenciosos na renderização.

### 7.2 Colorindo Notas (Acerto/Erro)

```typescript
staveNotes.forEach((note, i) => {
      if (hitNotes.includes(i)) {
              note.setStyle({ fillStyle: '#4CAF7A', strokeStyle: '#4CAF7A' })
                } else if (missNotes.includes(i)) {
                        note.setStyle({ fillStyle: '#C94C4C', strokeStyle: '#C94C4C' })
                          }
})
// Chamar setStyle() antes do Formatter.joinVoices() e draw()
```

---

## 8. Web MIDI API — Referência Rápida

### 8.1 Tabela de Eventos

| Evento | Status Byte | Descrição |
|--------|------------|-----------|
| Note On | 144 (0x90) | Tecla pressionada, velocity > 0 |
| Note Off | 128 (0x80) | Tecla liberada |
| Note On velocity=0 | 144 com data[2]=0 | Equivalente a Note Off (padrão em muitos pianos) |
| Control Change | 176 (0xB0) | Pedal, volume, modulação |
| Pitch Bend | 224 (0xE0) | Pitch wheel |

### 8.2 Acesso Direto (sem biblioteca)

```typescript
const midi = await navigator.requestMIDIAccess()

midi.inputs.forEach(input => {
      input.onmidimessage = (event) => {
              const [status, note, velocity] = event.data
                  const isNoteOn  = status === 144 && velocity > 0
                      const isNoteOff = status === 128 || (status === 144 && velocity === 0)

                          if (isNoteOn)  handleNoteOn(note, velocity)
                                  if (isNoteOff) handleNoteOff(note)
                                        }
})

// Detectar conexão/desconexão de dispositivos
midi.onstatechange = (event) => {
      console.log(event.port.name, event.port.state) // 'connected' | 'disconnected'
}
```

---

## 9. Quantização de Notas na Captura

A quantização converte a duração real tocada (em ms) para a figura musical mais próxima — é essencialmente um arredondamento no grid musical.

```typescript
// src/lib/quantize.ts
type VFDuration = 'w' | 'h' | 'q' | '8' | '16'

export function quantizeDuration(durationMs: number, bpm: number): VFDuration {
      const beatMs = 60_000 / bpm
        const grids: [VFDuration, number][] = [
            ['w',  beatMs * 4],
                ['h',  beatMs * 2],
                    ['q',  beatMs * 1],
                        ['8',  beatMs * 0.5],
                            ['16', beatMs * 0.25],
                              ]
                                return grids.reduce((best, curr) =>
                                    Math.abs(curr[1] - durationMs) < Math.abs(best[1] - durationMs) ? curr : best
                                      )[0]
}
```

**Separação de mãos:** notas com MIDI number ≥ 60 (C4 em diante) vão para a clave de sol; abaixo de 60 vão para a clave de fá. Simples e funciona para a maioria das músicas.

---

## 10. Ordem de Execução

```
Sessão 1  →  Sessão 2  →  Sessão 3  →  Sessão 4  →  Sessão 5
MIDI input    Partitura     Áudio        Scoring       UI Final
```

Cada sessão entrega algo tangível e testável antes de avançar.

---

## 11. Troubleshooting Comum

| Problema | Causa | Solução |
|----------|-------|---------|
| MIDI não detectado | Permissão negada no browser | Verificar permissões em `chrome://settings/content/midi` |
| Sem áudio na primeira nota | Browser bloqueou AudioContext | Chamar `initAudio()` dentro de um `onClick` |
| VexFlow não renderiza | Container sem dimensões | Garantir que o div tem width/height antes de `new Renderer()` |
| StaveConnector erro | API v3 vs v4 misturada | Usar `.setType('brace')` como string, não enum |
| Notas com timing ruim | `setTimeout` impreciso | Usar `Tone.Transport` como clock, não `setTimeout` |
| `@tonejs/piano` lento | Samples carregando (~5MB) | Mostrar loading spinner durante `piano.load()` |

---

## 12. Referências

- [VexFlow 4 — GitHub](https://github.com/0xfe/vexflow)
- [WebMIDI.js v3 — Docs](https://webmidijs.org)
- [Tone.js — Docs](https://tonejs.github.io)
- [@tonejs/piano — GitHub](https://github.com/tambien/Piano)
- [Web MIDI API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [Zustand — Docs](https://docs.pmnd.rs/zustand)
- [VexFlow Tutorial — Grand Staff](https://github.com/0xfe/vexflow/wiki/Tutorial)

---

_Piano Score · Guia Técnico · gerado com Claude_j
