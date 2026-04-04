/**
 * Study Report tab — generates a Claude-powered 4-section performance report,
 * saves it to Firebase Firestore, and shows history of past reports.
 */
import React, { useState, useEffect } from 'react';
import type { StudyReport as StudyReportType } from '../types/report';
import { useStore } from '../store/store';
import { useStudySnapshot } from '../hooks/useStudySnapshot';
import { generateReport } from '../services/claudeService';
import { saveReport } from '../services/reportService';
import { ReportHeader } from './ReportHeader';
import { ReportScoreGrid } from './ReportScoreGrid';
import { ReportSectionCard } from './ReportSectionCard';
import { ActionPlan } from './ActionPlan';
import { ReportHistory } from './ReportHistory';

type ViewState = 'empty' | 'generating' | 'viewing';

const LOADING_MESSAGES = [
  'Analyzing your quiz performance...',
  'Reviewing study habits...',
  'Assessing exam readiness...',
  'Writing your personalized report...',
];

const DATA_SOURCES = [
  { label: 'Reasoning Challenge', icon: '🧠', desc: 'Quiz scores & concept gaps' },
  { label: 'Study Schedule',      icon: '📅', desc: 'Weekly plan & sessions'    },
  { label: 'Exam Prep',           icon: '📝', desc: 'Practice test results'     },
];

export const StudyReport: React.FC = () => {
  const session = useStore((state) => state.session);
  const snapshot = useStudySnapshot();

  const [viewState, setViewState] = useState<ViewState>('empty');
  const [report, setReport] = useState<StudyReportType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);

  const scores = Object.values(session?.scores ?? {});
  const hasQuizData = scores.length > 0;
  const hasSchedule = useStore((state) => state.schedule) !== null;
  const dataAvailable = [hasQuizData, hasSchedule, false];

  useEffect(() => {
    if (viewState !== 'generating') return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [viewState]);

  const handleGenerate = async () => {
    setViewState('generating');
    setError(null);
    setMsgIndex(0);
    try {
      const generated = await generateReport(snapshot);

      const reportToSave: StudyReportType = {
        ...generated,
        id: '',
        createdAt: null,
        studentId: 'anonymous',
        summary: generated.topStrength,
        rawData: snapshot,
      };

      const docId = await saveReport(reportToSave);
      setReport({ ...reportToSave, id: docId, createdAt: new Date() });
      setViewState('viewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report.');
      setViewState('empty');
    }
  };

  // ── Generating state ───────────────────────────────────────────────────────
  if (viewState === 'generating') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="glass-strong rounded-3xl p-12 max-w-sm w-full text-center animate-slide-up">
          <div className="text-5xl mb-6">📊</div>
          <h3 className="text-xl font-bold text-white mb-2 min-h-7 transition-all">
            {LOADING_MESSAGES[msgIndex]}
          </h3>
          <p className="text-gray-400 text-sm mb-8">Claude is analyzing all your study data</p>
          <div className="flex justify-center gap-2">
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === msgIndex ? 'w-6 bg-purple-500' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Viewing state ──────────────────────────────────────────────────────────
  if (viewState === 'viewing' && report) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">
        <ReportHeader report={report} />
        <ReportScoreGrid sections={report.sections} />
        {report.sections.map((section, i) => (
          <ReportSectionCard key={i} section={section} />
        ))}
        <ActionPlan actionPlan={report.actionPlan} />
        <div className="border-t border-white/[0.06] pt-8 mt-4">
          <ReportHistory
            currentReportId={report.id}
            onLoadReport={(r) => { setReport(r); setViewState('viewing'); }}
          />
        </div>
        <div className="text-center mt-6">
          <button
            onClick={() => void handleGenerate()}
            className="btn-outline px-8 py-3 rounded-2xl text-purple-400 text-sm font-bold border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer"
          >
            Generate New Report
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  return (
    <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">

      {/* Hero heading */}
      <div className="mb-10 animate-slide-up">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2">
          Study{' '}
          <span className="gradient-text">Report</span>
        </h1>
        <p className="text-gray-400 text-base">
          AI-generated performance analysis across all your activity
        </p>
      </div>

      {/* Data sources grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-up anim-delay-1">
        {DATA_SOURCES.map(({ label, icon, desc }, idx) => {
          const has = dataAvailable[idx];
          return (
            <div
              key={label}
              className={`glass rounded-2xl p-5 transition-all ${
                has
                  ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    has
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-white/[0.06] text-gray-500 border border-white/10'
                  }`}
                >
                  {has ? 'Ready' : 'No data'}
                </span>
              </div>
              <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6 animate-fade-in">
          <span className="font-semibold">Error: </span>{error}
        </div>
      )}

      {/* Generate button */}
      <div className="animate-slide-up anim-delay-2">
        <button
          onClick={() => void handleGenerate()}
          disabled={!hasQuizData}
          className={`w-full py-5 rounded-2xl text-base font-black transition-all ${
            hasQuizData
              ? 'btn-premium text-white shadow-2xl shadow-purple-500/25 cursor-pointer'
              : 'bg-white/[0.04] text-gray-600 cursor-not-allowed border border-white/[0.06]'
          }`}
        >
          {hasQuizData ? 'Generate My Report →' : 'Complete a Challenge First'}
        </button>
        {!hasQuizData && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Complete at least one Reasoning Challenge to unlock report generation
          </p>
        )}
      </div>

      {/* History */}
      <div className="border-t border-white/[0.06] pt-8 mt-10 animate-fade-in">
        <ReportHistory
          currentReportId={null}
          onLoadReport={(r) => { setReport(r); setViewState('viewing'); }}
        />
      </div>
    </div>
  );
};
