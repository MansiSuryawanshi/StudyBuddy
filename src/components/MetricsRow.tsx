/**
 * Three metric summary cards — driven by props from StudySchedule.
 */
import React from 'react';

interface MetricsRowProps {
  challengesDone: number;
  avgScore: number;
  gapsCount: number;
}

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

export const MetricsRow: React.FC<MetricsRowProps> = ({ challengesDone, avgScore, gapsCount }) => {
  return (
    <div className="flex gap-4 mb-8">
      <MetricCard icon="🎯" label="Challenges done"   value={challengesDone} />
      <MetricCard icon="🧠" label="Avg understanding" value={avgScore} sub="/100" />
      <MetricCard icon="⚡" label="Gaps to close"     value={gapsCount} />
    </div>
  );
};
