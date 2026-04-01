import type { ScoreResult } from '../lib/scorer'

export interface ResultOverlayProps {
  result: ScoreResult
  onClose: () => void
}

const GRADE_COLORS: Record<string, string> = {
  A: '#4caf7a',
  B: '#7bc74d',
  C: '#facc15',
  D: '#f59e0b',
  F: '#c94c4c',
}

const GRADE_LABELS: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Needs Practice',
  F: 'Try Again',
}

export function ResultOverlay({ result, onClose }: ResultOverlayProps) {
  const gradeColor = GRADE_COLORS[result.grade] ?? '#e8e6e1'

  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="result-grade" style={{ color: gradeColor }}>
          {result.grade}
        </div>
        <div className="result-label" style={{ color: gradeColor }}>
          {GRADE_LABELS[result.grade]}
        </div>
        <div className="result-score">{result.percentScore}%</div>

        <div className="result-breakdown">
          <div className="result-row">
            <span>Hits</span>
            <span className="result-value hit">{result.hits}</span>
          </div>
          <div className="result-row">
            <span>Misses</span>
            <span className="result-value miss">{result.misses}</span>
          </div>
          <div className="result-row">
            <span>Extra notes</span>
            <span className="result-value extra">{result.extras}</span>
          </div>
          {result.timingErrors.length > 0 && (
            <div className="result-row">
              <span>Avg timing</span>
              <span className="result-value">
                {Math.round(
                  result.timingErrors.reduce((a, b) => a + b, 0) /
                    result.timingErrors.length,
                )}
                ms
              </span>
            </div>
          )}
        </div>

        <button className="result-close" onClick={onClose}>
          Play Again
        </button>
      </div>
    </div>
  )
}
