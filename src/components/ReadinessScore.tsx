/**
 * ReadinessScore – large animated number showing 0–100 overall exam readiness.
 * Updates visibly whenever the student passes/fails a cross-examination.
 * Owner: Developer 3 (Exam Prep)
 */
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  score: number;
  previousScore?: number;
}

export const ReadinessScore: React.FC<Props> = ({ score, previousScore }) => {
  const [displayScore, setDisplayScore] = useState(previousScore ?? score);
  const [isAnimating, setIsAnimating] = useState(false);
  const [delta, setDelta] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Animate counter from old to new score
  useEffect(() => {
    if (displayScore === score) return;

    setIsAnimating(true);
    const diff = score - displayScore;
    setDelta(diff);

    const start = displayScore;
    const end = score;
    const duration = 900; // ms
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayScore(end);
        setIsAnimating(false);
        setTimeout(() => setDelta(0), 1200);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  const getBadgeColor = (s: number) => {
    if (s >= 75) return 'var(--ready-green)';
    if (s >= 50) return 'var(--almost-teal)';
    return 'var(--not-ready-amber)';
  };

  const getGlow = (s: number) => {
    if (s >= 75) return '0 0 32px rgba(52,211,153,0.35)';
    if (s >= 50) return '0 0 32px rgba(45,212,191,0.3)';
    return '0 0 32px rgba(251,191,36,0.3)';
  };

  const arcPercent = displayScore / 100;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * arcPercent;

  return (
    <div className="readiness-score-card">
      <p className="readiness-label">Exam Readiness</p>

      <div className="readiness-ring-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* track */}
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* progress arc */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={getBadgeColor(displayScore)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset="0"
            transform="rotate(-90 70 70)"
            style={{
              transition: 'stroke-dasharray 0.05s linear, stroke 0.4s ease',
              filter: `drop-shadow(${getGlow(displayScore)})`,
            }}
          />
        </svg>

        {/* big number inside ring */}
        <div className="readiness-number-wrap">
          <span
            className="readiness-number"
            style={{ color: getBadgeColor(displayScore) }}
          >
            {displayScore}
          </span>
          <span className="readiness-out-of">/100</span>
        </div>
      </div>

      {/* delta chip – appears briefly after a verdict */}
      {isAnimating && delta !== 0 && (
        <div
          className={`readiness-delta ${delta > 0 ? 'delta-up' : 'delta-down'}`}
        >
          {delta > 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0)}
        </div>
      )}
    </div>
  );
};
