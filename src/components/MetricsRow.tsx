/**
 * Three metric summary cards reading live values from the store.
 */
import React from 'react';
import { useStore } from '../store/store';

function MetricCard({ label, value, sub, icon }: { label: string; value: number; sub?: string; icon: string }) {
  return (
    <div className="glass-strong flex-1 rounded-2xl p-5 text-center card-feature">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-black text-white leading-tight tracking-tighter">
        {value}
        {sub && <span className="text-sm font-normal text-gray-400 ml-1">{sub}</span>}
      </div>
      <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
    </div>
  );
}

export const MetricsRow: React.FC = () => {
  const session = useStore((state) => state.session);
  const scores = Object.values(session?.scores ?? {});

  const challengesDone = scores.length;
  const avgUnderstanding =
    scores.length === 0 ? 0
      : Math.round(scores.reduce((sum, s) => sum + s.student_a.total, 0) / scores.length);
  const allGaps = [...new Set([
    ...scores.map((s) => s.student_a.concept_gap).filter((g): g is string => g !== null),
    ...scores.map((s) => s.student_b.concept_gap).filter((g): g is string => g !== null),
  ])];

  return (
    <div className="flex gap-4 mb-8">
      <MetricCard icon="🎯" label="Challenges done" value={challengesDone} />
      <MetricCard icon="🧠" label="Avg understanding" value={avgUnderstanding} sub="/100" />
      <MetricCard icon="⚡" label="Gaps to close" value={allGaps.length} />
    </div>
  );
};
