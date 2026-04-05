/**
 * Study Schedule tab — adaptive weekly plan based on concept gaps from the quiz.
 */
import React, { useState, useEffect, useRef } from 'react';
import type { ScheduleResponse } from '../types';
import { useStore } from '../store/store';
import { generateSchedule } from '../services/claudeService';
import { getUserQuizAttempts, getExamDate } from '../services/firebaseService';
import { MetricsRow } from './MetricsRow';
import { DayScheduleCard } from './DayScheduleCard';

interface StudyScheduleProps {
  onSwitchToChallenge: () => void;
}

export const StudySchedule: React.FC<StudyScheduleProps> = ({ onSwitchToChallenge }) => {
  const cachedSchedule = useStore((state) => state.schedule);
  const setSchedule = useStore((state) => state.setSchedule);

  const [localSchedule, setLocalSchedule] = useState<ScheduleResponse | null>(cachedSchedule);
  const [loading, setLoading] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGapsNudge, setNewGapsNudge] = useState(false);

  // Data derived from latest Firebase quiz attempt
  const [conceptGaps, setConceptGaps] = useState<string[]>([]);
  const [topicAccuracy, setTopicAccuracy] = useState<{ topic: string; accuracy: number }[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [challengesDone, setChallengesDone] = useState(0);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const prevGapCount = useRef(0);

  /** Calculate days left from date string */
  const calculateDaysLeft = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Load latest quiz attempt and exam date from Firebase on mount
  useEffect(() => {
    const loadAttempts = async () => {
      setLoadingAttempts(true);
      try {
        // 1. Fetch History
        const attempts = await getUserQuizAttempts(); // ordered by createdAt desc
        setChallengesDone(attempts.length);

        if (attempts.length === 0) {
          setLoadingAttempts(false);
          return;
        }

        // 2. Fetch Exam Date
        const dateStr = await getExamDate();
        let currentDaysLeft = 7; // fallback
        if (dateStr) {
          currentDaysLeft = calculateDaysLeft(dateStr);
          setDaysLeft(currentDaysLeft);
          console.log(`[StudySchedule] Persistent exam date loaded: ${dateStr}. Days left: ${currentDaysLeft}`);
        } else {
          console.log("[StudySchedule] No exam date found. Using default 7 days.");
        }

        const latest = attempts[0];
        const weakSet = new Set(latest.weakTopics);
        const strongSet = new Set(latest.strongTopics);
        const allTopics = [...new Set([...latest.weakTopics, ...latest.strongTopics])];

        const accuracy = allTopics.map(topic => {
          const inWeak   = weakSet.has(topic);
          const inStrong = strongSet.has(topic);
          if (inWeak && !inStrong)  return { topic, accuracy: 0 };
          if (!inWeak && inStrong)  return { topic, accuracy: 100 };
          return { topic, accuracy: 50 }; // appears in both
        });

        accuracy.sort((a, b) => a.accuracy - b.accuracy);
        setTopicAccuracy(accuracy);

        const gaps = accuracy.filter(t => t.accuracy < 70).map(t => t.topic);
        setConceptGaps(gaps);
        setAvgScore(latest.accuracy);

        // Auto-generate schedule if none cached
        if (cachedSchedule === null && gaps.length > 0) {
          void fetchScheduleWith(gaps, latest.accuracy, accuracy, currentDaysLeft);
        }

        if (gaps.length > prevGapCount.current && localSchedule !== null) {
          setNewGapsNudge(true);
        }
        prevGapCount.current = gaps.length;
      } catch (e) {
        console.error('[StudySchedule] Failed to load quiz attempts:', e);
      } finally {
        setLoadingAttempts(false);
      }
    };
    void loadAttempts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchScheduleWith = async (
    gaps: string[],
    score: number,
    accuracy: { topic: string; accuracy: number }[],
    daysToExam: number = daysLeft ?? 7
  ) => {
    setLoading(true);
    setError(null);
    setNewGapsNudge(false);
    try {
      console.log(`[StudySchedule] Requesting adaptive schedule for ${daysToExam} days left.`);
      const result = await generateSchedule(gaps, score, daysToExam, accuracy);
      setLocalSchedule(result);
      setSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = () => fetchScheduleWith(conceptGaps, avgScore, topicAccuracy, daysLeft ?? 7);

  const totalSessions =
    localSchedule?.schedule.reduce((sum, day) => sum + day.sessions.length, 0) ?? 0;

  // ── Loading quiz attempts from Firebase ──────────────────────────────────
  if (loadingAttempts) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/10" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400">Loading your quiz results…</p>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (challengesDone === 0 && localSchedule === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Glow orb */}
        <div className="orb w-64 h-64 bg-purple-600/20 -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute" />

        <div className="animate-slide-up">
          <div className="text-5xl mb-6">📅</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
            No Plan{' '}
            <span className="gradient-text">Yet</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-sm leading-relaxed">
            Complete a Reasoning Challenge to unlock your personalized adaptive study plan
          </p>
          <button
            onClick={onSwitchToChallenge}
            className="btn-premium px-10 py-4 rounded-2xl text-white text-base font-bold shadow-2xl shadow-purple-500/30"
          >
            Start a Challenge →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">

      {/* Hero heading */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2">
          This Week ·{' '}
          <span className="gradient-text">Adaptive Plan</span>
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-gray-400 text-base">Based on your concept gaps</p>
          {totalSessions > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              {totalSessions} sessions planned
            </span>
          )}
        </div>
      </div>

      {/* Priority / readiness banner */}
      {localSchedule?.readiness_message && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300 animate-fade-in">
          <span className="font-semibold text-purple-200">Priority gap: </span>
          <span className="text-white font-medium">{localSchedule.priority_gap}</span>
          {' '} — {localSchedule.readiness_message}
        </div>
      )}

      {/* New gaps nudge */}
      {newGapsNudge && (
        <div className="mb-5 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex justify-between items-center animate-fade-in">
          <span className="text-sm text-orange-300">New gaps detected — regenerate your plan?</span>
          <button
            onClick={() => void fetchSchedule()}
            className="ml-4 shrink-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            Regenerate
          </button>
        </div>
      )}

      {/* Metrics */}
      <MetricsRow
        challengesDone={challengesDone}
        avgScore={avgScore}
        gapsCount={conceptGaps.length}
      />

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
