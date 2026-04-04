import React, { useState, useEffect } from 'react';
import type { StudyReport } from '../types/report';
import { getReports, getReportById } from '../services/reportService';

interface ReportHistoryProps {
  currentReportId: string | null;
  onLoadReport: (report: StudyReport) => void;
}

function scoreClasses(score: number): string {
  if (score >= 75) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  if (score >= 50) return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  return 'bg-red-500/15 text-red-400 border-red-500/20';
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({ currentReportId, onLoadReport }) => {
  const [reports, setReports] = useState<StudyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    getReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, [currentReportId]);

  const handleClick = async (id: string) => {
    if (id === currentReportId) return;
    setLoadingId(id);
    try {
      const report = await getReportById(id);
      if (report) onLoadReport(report);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-white mb-3">Previous reports</p>

      {loading && (
        <p className="text-sm text-gray-500">Loading history…</p>
      )}

      {!loading && reports.length === 0 && (
        <p className="text-sm text-gray-500">This is your first report.</p>
      )}

      {!loading &&
        reports.map((r) => (
          <button
            key={r.id}
            onClick={() => void handleClick(r.id)}
            disabled={loadingId === r.id}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 mb-2 text-left transition-all cursor-pointer ${
              r.id === currentReportId
                ? 'bg-purple-500/10 border border-purple-500/25'
                : 'glass hover:border-white/15'
            } ${loadingId === r.id ? 'opacity-50' : 'opacity-100'}`}
          >
            <span className="text-xs text-gray-500 min-w-[90px] shrink-0">
              {formatDate(r.createdAt)}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${scoreClasses(r.overallScore)}`}
            >
              {r.overallScore}
            </span>
            <span className="text-xs text-gray-400 truncate">
              {r.topWeakness.slice(0, 60)}{r.topWeakness.length > 60 ? '…' : ''}
            </span>
          </button>
        ))}
    </div>
  );
};
