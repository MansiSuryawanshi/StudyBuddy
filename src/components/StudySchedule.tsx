/**
 * Study Schedule tab — adaptive weekly plan based on concept gaps from the quiz.
 */
import React, { useState, useEffect, useRef } from 'react';
import type { ScheduleResponse } from '../types';
import { useStore } from '../store/store';
import { generateSchedule } from '../services/claudeService';
import { MetricsRow } from './MetricsRow';
import { DayScheduleCard } from './DayScheduleCard';

interface StudyScheduleProps {
  onSwitchToChallenge: () => void;
}

export const StudySchedule: React.FC<StudyScheduleProps> = ({ onSwitchToChallenge }) => {
  const cachedSchedule = useStore((state) => state.schedule);
  const setSchedule = useStore((state) => state.setSchedule);

  // Global Context
  const examDate    = useStore((s) => s.examDate);
  const daysLeft    = useStore((s) => s.daysLeft);
  const allAttempts = useStore((s) => s.allAttempts);
  const isInitialLoadComplete = useStore((s) => s.isInitialLoadComplete);

  const [localSchedule, setLocalSchedule] = useState<ScheduleResponse | null>(cachedSchedule);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGapsNudge, setNewGapsNudge] = useState(false);

  // Derived state from history (Calculated once based on store)
  const [conceptGaps, setConceptGaps] = useState<string[]>([]);
  const [topicAccuracy, setTopicAccuracy] = useState<{ topic: string; accuracy: number }[]>([]);
  const [avgScore, setAvgScore] = useState(0);

  const prevGapCount = useRef(0);
  const prevExamDate = useRef<string | null>(examDate);

  // Reactive Logic: Monitor store for new history or new exam date
  useEffect(() => {
    if (!isInitialLoadComplete && allAttempts.length === 0) return;

    // 1. Check for History Updates
    if (allAttempts.length > 0) {
      const latest = allAttempts[0];
      const weakSet = new Set(latest.weakTopics);
      const strongSet = new Set(latest.strongTopics);
      const allTopics = [...new Set([...latest.weakTopics, ...latest.strongTopics])];

      const accuracy = allTopics.map(topic => {
        const inWeak   = weakSet.has(topic);
        const inStrong = strongSet.has(topic);
        if (inWeak && !inStrong)  return { topic, accuracy: 0 };
        if (!inWeak && inStrong)  return { topic, accuracy: 100 };
        return { topic, accuracy: 50 };
      }).sort((a, b) => a.accuracy - b.accuracy);

      setTopicAccuracy(accuracy);
      setAvgScore(latest.accuracy);
      const gaps = accuracy.filter(t => t.accuracy < 70).map(t => t.topic);
      setConceptGaps(gaps);

      // 2. Manage Nudges
      if (prevGapCount.current > 0 && gaps.length > prevGapCount.current) {
        setNewGapsNudge(true);
      }
      prevGapCount.current = gaps.length;
    }

    // 3. Monitor Exam Date Changes
    if (examDate !== prevExamDate.current) {
      console.log(`[StudySchedule-SYNC] Exam date changed: ${prevExamDate.current} -> ${examDate}. Flagging for regeneration.`);
      setNewGapsNudge(true);
      prevExamDate.current = examDate;
    }

    // Auto-generate if empty
    if (cachedSchedule === null && allAttempts.length > 0 && !loading) {
      void fetchSchedule();
    }
  }, [allAttempts, examDate, isInitialLoadComplete, cachedSchedule, loading]);

  const fetchScheduleWith = async (
    gaps: string[],
    score: number,
    accuracy: { topic: string; accuracy: number }[],
    days: number
  ) => {
    console.group(`[StudySchedule-Pipeline] Generating plan...`);
    console.log(`Step 1: Context gathered. Gaps: ${gaps.length}, AvgScore: ${score}, DaysLeft: ${days}`);
    
    setLoading(true);
    setError(null);
    setNewGapsNudge(false);
    
    try {
      console.log(`Step 2: Calling Claude API (or local fallback)...`);
      const result = await generateSchedule(gaps, score, days, accuracy);
      
      if (result.isFallback) {
        console.warn(`Step 3: AI Generation failed/unavailable. Using grounded fallback.`);
      } else {
        console.log(`Step 3: AI Generation SUCCESS!`);
      }
      
      setLocalSchedule(result);
      setSchedule(result);
      console.log(`Step 4: Schedule synchronized with global store.`);
    } catch (err: any) {
      console.error(`Step 3.FAIL: Critical error in schedule pipeline`, err);
      setError(err?.message || 'Unexpected failure in study plan generation.');
    } finally {
      setLoading(false);
      console.log(`Step 5: Pipeline finished. Loading cleared.`);
      console.groupEnd();
    }
  };

  const fetchSchedule = () => fetchScheduleWith(conceptGaps, avgScore, topicAccuracy, daysLeft ?? 7);

  const totalSessions =
    localSchedule?.schedule.reduce((sum, day) => sum + day.sessions.length, 0) ?? 0;

  // ── Initial Loading from Store ──────────────────────────────────────────
  if (!isInitialLoadComplete) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-400">Loading your knowledge map...</p>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (allAttempts.length === 0 && localSchedule === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="orb w-64 h-64 bg-purple-600/20 -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />
        <div className="animate-slide-up">
          <div className="text-5xl mb-6">📅</div>
          <h2 className="text-4xl font-black text-white mb-3">No Plan Yet</h2>
          <p className="text-gray-400 mb-10 max-w-sm">Complete a challenge to unlock your personalized adaptive study plan.</p>
          <button onClick={onSwitchToChallenge} className="btn-premium px-10 py-4 rounded-2xl text-white font-bold">Start a Challenge →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-4xl font-black text-white mb-2">Adaptive Plan</h1>
        <div className="flex items-center gap-3">
          <p className="text-gray-400">Based on your concept gaps</p>
          {totalSessions > 0 && <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">{totalSessions} sessions planned</span>}
        </div>
      </div>

      {localSchedule?.readiness_message && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300">
          <span className="font-semibold text-purple-200">Priority gap: </span>
          <span className="text-white font-medium">{localSchedule.priority_gap}</span> — {localSchedule.readiness_message}
        </div>
      )}

      {localSchedule?.isFallback && (
        <div className="mb-5 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1 animate-fade-in">
          <span className="text-sm font-black text-blue-400 uppercase tracking-widest">Grounded Fallback</span>
          <p className="text-xs text-blue-300 font-medium">AI generation failed/unavailable. Showing a static plan optimized for your recent mistakes and exam deadline.</p>
        </div>
      )}

      {newGapsNudge && (
        <div className="mb-5 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex justify-between items-center animate-fade-in shadow-lg shadow-orange-500/5">
          <span className="text-sm text-orange-300 font-medium">New performance data — recalculate plan?</span>
          <button onClick={() => void fetchSchedule()} className="ml-4 shrink-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer">Regenerate</button>
        </div>
      )}

      <MetricsRow challengesDone={allAttempts.length} avgScore={avgScore} gapsCount={conceptGaps.length} />

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="text-5xl mb-5 animate-bounce-dot" style={{ animationDuration: '1s' }}>⏳</div>
          <p className="text-gray-400 text-base">Generating your adaptive plan...</p>
          <p className="text-gray-600 text-sm mt-1">Claude is thinking hard for you</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6">
          <span className="font-semibold">Error: </span>{error}
        </div>
      )}

      {/* Day cards */}
      {!loading && localSchedule && (
        <div className="space-y-3 animate-fade-in">
          {localSchedule.schedule.map((day, i) => (
            <DayScheduleCard key={i} day={day} />
          ))}
        </div>
      )}

      {/* Regenerate button */}
      {!loading && (
        <div className="text-center mt-8">
          <button
            onClick={() => void fetchSchedule()}
            className="btn-outline px-8 py-3 rounded-2xl text-purple-400 text-sm font-bold border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer"
          >
            Regenerate Plan
          </button>
        </div>
      )}
    </div>
  );
};
