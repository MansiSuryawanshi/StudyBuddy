/**
 * Score card for one student: animated bars per dimension, misconception badge, winner border.
 * Owner: Developer 1 (Frontend UI)
 */
import React, { useEffect, useState } from 'react';
import type { StudentScore } from '../types';

interface ScoreCardProps {
  studentLabel: string;
  scores: StudentScore;
  isWinner: boolean;
}

const barColor = (score: number): string => {
  if (score > 7) return '#1D9E75';
  if (score >= 4) return '#F59E0B';
  return '#E24B4A';
};

const DIMENSIONS: {
  key: keyof Pick<StudentScore, 'correctness' | 'reasoning_depth' | 'clarity'>;
  label: string;
}[] = [
  { key: 'correctness',     label: 'Correctness' },
  { key: 'reasoning_depth', label: 'Reasoning Depth' },
  { key: 'clarity',         label: 'Clarity' },
];

const ScoreCard: React.FC<ScoreCardProps> = ({ studentLabel, scores, isWinner }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const inner = (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-100 text-sm">{studentLabel}</span>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={
            isWinner
              ? {
                  background: 'rgba(139,92,246,0.3)',
                  color: '#ddd6fe',
                  border: '1px solid rgba(167,139,250,0.4)',
                }
              : {
                  background: 'rgba(20,184,166,0.2)',
                  color: '#5eead4',
                  border: '1px solid rgba(94,234,212,0.3)',
                }
          }
        >
          {scores.total} / 100
        </span>
      </div>

      {/* Animated bars */}
      <div className="flex flex-col gap-3">
        {DIMENSIONS.map(({ key, label }) => {
          const val = scores[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <span
                className="text-xs font-medium text-gray-400 shrink-0"
                style={{ width: 110 }}
              >
                {label}
              </span>
              <div
                className="flex-1 rounded-full h-2 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-[800ms] ease-out"
                  style={{
                    width: mounted ? `${val * 10}%` : '0%',
                    backgroundColor: barColor(val),
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-200 shrink-0 w-5 text-right">
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Misconception */}
      {scores.misconception_present ? (
        <p className="text-xs font-medium text-red-400">
          Misconception:{' '}
          <span className="font-semibold">{scores.misconception_name ?? 'Unspecified'}</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-green-400">✓ No misconceptions detected</p>
      )}
    </div>
  );

  // Winner gets a gradient border wrapper
  if (isWinner) {
    return (
      <div className="gradient-border p-0.5 rounded-2xl h-full">
        {inner}
      </div>
    );
  }

  return inner;
};

export default ScoreCard;
