/**
 * Three metric summary cards reading live values from the store.
 * Challenges done · Avg understanding · Gaps to close
 */
import React from 'react';
import { useStore } from '../store/store';

function MetricCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--code-bg)',
        borderRadius: '8px',
        padding: '14px 10px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '26px',
          fontWeight: 600,
          color: 'var(--text-h)',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}
      >
        {value}
        {sub && (
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text)', marginLeft: '2px' }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export const MetricsRow: React.FC = () => {
  const session = useStore((state) => state.session);

  const scores = Object.values(session?.scores ?? {});

  const challengesDone = scores.length;

  const avgUnderstanding =
    scores.length === 0
      ? 0
      : Math.round(scores.reduce((sum, s) => sum + s.student_a.total, 0) / scores.length);

  const allGaps = [...new Set([
    ...scores.map((s) => s.student_a.concept_gap).filter((g): g is string => g !== null),
    ...scores.map((s) => s.student_b.concept_gap).filter((g): g is string => g !== null),
  ])];
  const gapsToClose = allGaps.length;

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <MetricCard label="Challenges done" value={challengesDone} />
      <MetricCard label="Avg understanding" value={avgUnderstanding} sub="/100" />
      <MetricCard label="Gaps to close" value={gapsToClose} />
    </div>
  );
};
