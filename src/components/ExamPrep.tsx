import React, { useEffect, useState } from 'react';
import { ReadinessScore } from './ReadinessScore';
import { TopicCoverage } from './TopicCoverage';
import { WeakAreas } from './WeakAreas';
import { CrossExamination } from './CrossExamination';
import { useStore } from '../store/store';
import { saveExamDate } from '../services/firebaseService';
import { deriveStudentAnalytics, mapStatsToProgress } from '../services/analyticsService';

export const ExamPrep: React.FC = () => {
  const readinessScore   = useStore((s) => s.readinessScore);
  const setTopicProgress = useStore((s) => s.setTopicProgress);
  const setWeakAreas     = useStore((s) => s.setWeakAreas);
  const setReadinessScore = useStore((s) => s.setReadinessScore);

  // Centralized State from Store
  const examDate    = useStore((s) => s.examDate);
  const setExamDate = useStore((s) => s.setExamDate);
  const daysLeft    = useStore((s) => s.daysLeft);
  const setDaysLeft = useStore((s) => s.setDaysLeft);
  const allAttempts = useStore((s) => s.allAttempts);
  const isInitialLoadComplete = useStore((s) => s.isInitialLoadComplete);

  const [isLoading, setIsLoading] = useState(!isInitialLoadComplete);
  const [isEditingDate, setIsEditingDate] = useState(false);

  // Derived check for empty state
  const hasData = allAttempts.length > 0;

  /** Standard calculation for the countdown. */
  const calculateDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Reactive Derivation: Triggered whenever history OR exam date changes.
  useEffect(() => {
    if (!isInitialLoadComplete && allAttempts.length === 0) return;

    console.group("[ExamPrep-REACTIVE] Syncing Analytics");
    const analytics = deriveStudentAnalytics(allAttempts, daysLeft);
    
    setTopicProgress(mapStatsToProgress(analytics.topicStats));
    setWeakAreas(analytics.weakTopics);
    setReadinessScore(analytics.readinessScore);
    setIsLoading(false);
    
    console.log(`Analytics Derived | Readiness: ${analytics.readinessScore}% | Topics: ${analytics.topicStats.length}`);
    console.groupEnd();
  }, [allAttempts, examDate, daysLeft, setTopicProgress, setWeakAreas, setReadinessScore, isInitialLoadComplete]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;

    const ds = calculateDaysLeft(newDate);
    console.log(`[ExamPrep-SYNC] New Date: ${newDate} (${ds} days)`);
    
    setExamDate(newDate);
    setDaysLeft(ds);
    setIsEditingDate(false);
    
    try {
      await saveExamDate(newDate);
    } catch (err) {
      console.error("[ExamPrep-SYNC] Save failed:", err);
    }
  };

  const getReadinessPill = (score: number) => {
    if (score >= 75) return { label: 'Ready!',        cls: 'ep-pill-green' };
    if (score >= 50) return { label: 'Almost there',  cls: 'ep-pill-teal' };
    return              { label: 'Not ready yet',     cls: 'ep-pill-amber' };
  };

  const pill = getReadinessPill(readinessScore);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="ep-root flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-400">Analyzing study landscape...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ep-root">
      {/* ── Page header ── */}
      <div className="ep-header">
        <div className="ep-header-left">
          <h1 className="ep-title">Exam Readiness</h1>
          <p className="ep-subtitle">
            {daysLeft !== null && daysLeft <= 7 
              ? "🕒 Critical window: Focus on highest impact topics." 
              : "Track your preparation and close knowledge gaps"}
          </p>
        </div>
        <div className="ep-header-right">
          <div className="ep-days-box" onClick={() => setIsEditingDate(true)} style={{ cursor: 'pointer' }}>
            {isEditingDate ? (
              <input 
                type="date" 
                className="ep-date-input"
                autoFocus
                onChange={handleDateChange}
                onBlur={() => setIsEditingDate(false)}
                defaultValue={examDate || ''}
              />
            ) : (
              <>
                <span className="ep-days-number">
                  {daysLeft === null ? '--' : daysLeft < 0 ? 'Passed' : daysLeft === 0 ? 'Today' : daysLeft}
                </span>
                <span className="ep-days-label">
                  {daysLeft === null ? 'set date' : daysLeft < 0 ? 'exam date' : daysLeft === 0 ? 'is exam' : 'days left'}
                </span>
              </>
            )}
          </div>
          <span className={`ep-readiness-pill ${pill.cls}`}>{pill.label}</span>
        </div>
      </div>

      {/* ── Empty state – no challenge data yet ── */}
      {!hasData && (
        <div className="ep-empty-state">
          <div className="ep-empty-icon">📋</div>
          <h3 className="ep-empty-title">No evidence found</h3>
          <p className="ep-empty-body">
            Take a Reasoning Challenge to ground your readiness score in real performance data.
          </p>
        </div>
      )}

      {/* ── Two-column body (only shown when there is data) ── */}
      {hasData && (
        <div className="ep-body">
          {/* Left: score ring + weak areas */}
          <div className="ep-col-left">
            <ReadinessScore score={readinessScore} />
            <WeakAreas />
          </div>

          {/* Right: topic bars + cross-examination */}
          <div className="ep-col-right">
            <TopicCoverage />
            <CrossExamination />
          </div>
        </div>
      )}
    </div>
  );
};
