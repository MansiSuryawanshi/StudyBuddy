import React from 'react';
import type { ReportSection } from '../types/report';

interface ReportSectionCardProps {
  section: ReportSection;
}

function scoreClasses(score: number): string {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (score >= 50) return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  return 'bg-red-500/15 text-red-400 border-red-500/20';
}

export const ReportSectionCard: React.FC<ReportSectionCardProps> = ({ section }) => {
  return (
    <div id={`section-${section.title}`} className="glass rounded-xl p-5 mb-3">
      {/* Title + score badge */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold text-white m-0">{section.title}</p>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreClasses(section.score)}`}
        >
          {section.score}/100
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-400 leading-relaxed mb-3">{section.summary}</p>

      {/* Key findings */}
      <ul className="space-y-1.5 mb-3 p-0 list-none">
        {section.keyFindings.map((finding, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400 leading-snug">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            {finding}
          </li>
        ))}
      </ul>

      {/* Recommendation */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300 leading-relaxed">
        <strong className="text-purple-200">Recommendation:</strong> {section.recommendation}
      </div>
    </div>
  );
};
