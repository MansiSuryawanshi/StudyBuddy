/**
 * Three metric summary cards: challenges done, avg understanding, gaps to close.
 */
import React from 'react';

interface MetricsRowProps {
  challengesDone: number;
  avgUnderstanding: number;
  gapsToClose: number;
}

const MetricCard: React.FC<{ label: string; value: string | number; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div
    style={{
      flex: 1,
      background: 'var(--code-bg)',
      borderRadius: '10px',
      padding: '16px 12px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontSize: '28px',
        fontWeight: 600,
        color: 'var(--text-h)',
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
      }}
    >
      {value}
      {sub && (
        <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text)', marginLeft: '2px' }}>
          {sub}
        </span>
      )}
    </div>
    <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>{label}</div>
  </div>
);

export const MetricsRow: React.FC<MetricsRowProps> = ({
  challengesDone,
  avgUnderstanding,
  gapsToClose,
}) => {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
      <MetricCard label="Challenges done" value={challengesDone} />
      <MetricCard label="Avg understanding" value={avgUnderstanding} sub="/100" />
      <MetricCard label="Gaps to close" value={gapsToClose} />
    </div>
  );
};
