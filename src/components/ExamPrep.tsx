import React, { useEffect, useState } from 'react';
import { ReadinessScore } from './ReadinessScore';
import { TopicCoverage } from './TopicCoverage';
import { WeakAreas } from './WeakAreas';
import { CrossExamination } from './CrossExamination';
import { useStore } from '../store/store';
import { getUserQuizAttempts, getExamDate, saveExamDate } from '../services/firebaseService';
import { deriveStudentAnalytics, mapStatsToProgress } from '../services/analyticsService';

export const ExamPrep: React.FC = () => {
  const readinessScore   = useStore((s) => s.readinessScore);
  const setTopicProgress = useStore((s) => s.setTopicProgress);
  const setWeakAreas     = useStore((s) => s.setWeakAreas);
  const setReadinessScore = useStore((s) => s.setReadinessScore);

  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);

  /** Standard calculation for the countdown. */
  const calculateDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(`[ExamPrep] Countdown: ${diffDays} days left until ${targetDate}`);
    return diffDays;
  };

  // Re-derive all Exam Prep data from real Firebase history.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const attempts = await getUserQuizAttempts();
        
        // 2. Load Exam Date
        const savedDate = await getExamDate();
        let currentDaysLeft: number | null = null;
        if (savedDate) {
          const dl = calculateDaysLeft(savedDate);
          setExamDateState(savedDate);
          setDaysLeft(dl);
          currentDaysLeft = dl;
          console.log(`[ExamPrep] Persistent exam date loaded: ${savedDate}. Days left: ${dl}`);
        }

        const analytics = deriveStudentAnalytics(attempts, currentDaysLeft);
        setTopicProgress(mapStatsToProgress(analytics.topicStats));
        setWeakAreas(analytics.weakTopics);
        setReadinessScore(analytics.readinessScore);
        setHasData(attempts.length > 0);
      } catch (err) {
        console.error("[ExamPrep] Data loading failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [setTopicProgress, setWeakAreas, setReadinessScore]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;

    setExamDateState(newDate);
    setDaysLeft(calculateDaysLeft(newDate));
    setIsEditingDate(false);
    
    try {
      await saveExamDate(newDate);
    } catch (err) {
      console.error("[ExamPrep] Failed to save exam date:", err);
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
          <p className="text-gray-400">Analyzing your study history...</p>
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
          <h3 className="ep-empty-title">No challenge data yet</h3>
          <p className="ep-empty-body">
            Complete at least one Reasoning Challenge to see your
            topic coverage, predicted weak areas, and exam readiness score.
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
