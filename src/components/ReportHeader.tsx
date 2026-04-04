import React from 'react';
import type { StudyReport } from '../types/report';

interface ReportHeaderProps {
  report: StudyReport;
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 75
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
      : score >= 50
      ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
      : 'bg-red-500/15 text-red-400 border-red-500/25';
  return (
    <div
      className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-2xl font-bold shrink-0 ${cls}`}
    >
      {score}
    </div>
  );
}

function formatTime(date: Date | null): string {
  if (!date) return 'today';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ report }) => {
  return (
    <div className="mb-6">
      {/* Title row */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white m-0">
            Study <span className="gradient-text">Report</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Generated today at {formatTime(report.createdAt)}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-outline px-4 py-2 rounded-xl text-purple-400 text-sm font-semibold border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer"
        >
          Download
        </button>
      </div>

      {/* Overall score */}
      <div className="flex items-center gap-4 mb-4">
        <ScoreBadge score={report.overallScore} />
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1">Overall score</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              Predicted exam:{' '}
              <strong className="text-white">{report.predictedExamScore}/100</strong>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
              {report.confidenceCalibration}
            </span>
          </div>
        </div>
      </div>

      {/* Strength */}
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 mb-2">
        <strong className="text-emerald-200">Top strength:</strong> {report.topStrength}
      </div>

      {/* Weakness */}
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
        <strong className="text-red-200">Top weakness:</strong> {report.topWeakness}
      </div>
    </div>
  );
};
