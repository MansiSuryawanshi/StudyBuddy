import React from 'react';
import type { ReportSection } from '../types/report';

interface ReportScoreGridProps {
  sections: ReportSection[];
}

function scoreClasses(score: number): string {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (score >= 50) return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  return 'bg-red-500/15 text-red-400 border-red-500/20';
}

export const ReportScoreGrid: React.FC<ReportScoreGridProps> = ({ sections }) => {
  const scrollTo = (title: string) => {
    document.getElementById(`section-${title}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {sections.map((section) => (
        <button
          key={section.title}
          onClick={() => scrollTo(section.title)}
          className="glass rounded-xl p-4 text-left cursor-pointer hover:border-purple-500/30 transition-all"
        >
          <p className="text-xs text-gray-400 mb-2">{section.title}</p>
          <span
            className={`inline-block text-2xl font-bold px-2.5 py-0.5 rounded-lg border ${scoreClasses(section.score)}`}
          >
            {section.score}
          </span>
          <p className="text-xs text-gray-400 mt-2 leading-snug line-clamp-2">
            {section.summary.split('.')[0]}.
          </p>
        </button>
      ))}
    </div>
  );
};
