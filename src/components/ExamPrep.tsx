/**
 * ExamPrep tab – Exam Readiness page.
 * Data is derived from real quiz answers recorded in the store during the Challenge.
 */
import React, { useEffect } from 'react';
import { ReadinessScore } from './ReadinessScore';
import { TopicCoverage } from './TopicCoverage';
import { WeakAreas } from './WeakAreas';
import { CrossExamination } from './CrossExamination';
import { useStore } from '../store/store';
import type { TopicProgress, QuizAnswer } from '../types';

/** Compute topic progress bars from raw quiz answers. */
function computeTopicProgress(answers: QuizAnswer[]): TopicProgress[] {
  const map = new Map<string, { correct: number; total: number }>();

  for (const a of answers) {
    const topic = a.sourceTopic || 'General';
    const entry = map.get(topic) ?? { correct: 0, total: 0 };
    entry.total += 1;
    // null (ungraded short-answer) counts as 50%
    if (a.isCorrect === true) entry.correct += 1;
    else if (a.isCorrect === null) entry.correct += 0.5;
    map.set(topic, entry);
  }

  return Array.from(map.entries()).map(([name, { correct, total }]) => ({
    name,
    percentage: Math.round((correct / total) * 100),
  }));
}

/** Topics below 60% become predicted weak areas. */
function computeWeakAreas(topics: TopicProgress[]): string[] {
  return topics.filter((t) => t.percentage < 60).map((t) => t.name);
}

/** Overall readiness = average topic percentage (clamped). */
function computeReadiness(topics: TopicProgress[]): number {
  if (topics.length === 0) return 50;
  const avg = topics.reduce((s, t) => s + t.percentage, 0) / topics.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

export const ExamPrep: React.FC = () => {
  const quizAnswers      = useStore((s) => s.quizAnswers);
  const readinessScore   = useStore((s) => s.readinessScore);
  const setTopicProgress = useStore((s) => s.setTopicProgress);
  const setWeakAreas     = useStore((s) => s.setWeakAreas);
  const setReadinessScore = useStore((s) => s.setReadinessScore);

  // Re-derive all Exam Prep data whenever quiz answers change.
  useEffect(() => {
    const topics = computeTopicProgress(quizAnswers);
    const weak   = computeWeakAreas(topics);
    setTopicProgress(topics);
    setWeakAreas(weak);
    if (quizAnswers.length > 0) {
      setReadinessScore(computeReadiness(topics));
    }
  }, [quizAnswers, setTopicProgress, setWeakAreas, setReadinessScore]);

  const daysToExam = 12;

  const getReadinessPill = (score: number) => {
    if (score >= 75) return { label: 'Ready!',        cls: 'ep-pill-green' };
    if (score >= 50) return { label: 'Almost there',  cls: 'ep-pill-teal' };
    return              { label: 'Not ready yet',     cls: 'ep-pill-amber' };
  };

  const pill = getReadinessPill(readinessScore);
  const hasData = quizAnswers.length > 0;

  return (
    <div className="ep-root">
      {/* ── Page header ── */}
      <div className="ep-header">
        <div className="ep-header-left">
          <h1 className="ep-title">Exam Readiness</h1>
          <p className="ep-subtitle">Track your preparation and close knowledge gaps</p>
        </div>
        <div className="ep-header-right">
          <div className="ep-days-box">
            <span className="ep-days-number">{daysToExam}</span>
            <span className="ep-days-label">days to exam</span>
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
            Complete at least one question in the <strong>Challenge</strong> tab to see your
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
