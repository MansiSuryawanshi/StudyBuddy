/**
 * Study Schedule tab — adaptive weekly plan based on concept gaps from the quiz.
 * Reads concept gaps from the store, calls Claude to generate a gap-targeted schedule.
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
  const session = useStore((state) => state.session);
  const cachedSchedule = useStore((state) => state.schedule);
  const setSchedule = useStore((state) => state.setSchedule);

  // Derive concept gaps from all session scores
  const scores = Object.values(session?.scores ?? {});
  const conceptGaps = [...new Set(scores.flatMap((s) => s.conceptGapTags))];
  const avgScore =
    scores.length === 0
      ? 0
      : Math.round(
          scores.reduce((sum, s) => sum + (s.correctness + s.reasoningDepth + s.clarity) / 3, 0) /
            scores.length,
        );

  const [localSchedule, setLocalSchedule] = useState<ScheduleResponse | null>(cachedSchedule);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGapsNudge, setNewGapsNudge] = useState(false);

  // Track previous gap count to show "new gaps" nudge
  const prevGapCount = useRef(conceptGaps.length);

  useEffect(() => {
    if (conceptGaps.length > prevGapCount.current && localSchedule !== null) {
      setNewGapsNudge(true);
    }
    prevGapCount.current = conceptGaps.length;
  }, [conceptGaps.length, localSchedule]);

  // Auto-generate on mount if gaps exist and no schedule cached
  useEffect(() => {
    if (conceptGaps.length > 0 && localSchedule === null) {
      void fetchSchedule();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    setNewGapsNudge(false);
    try {
      const result = await generateSchedule(conceptGaps, avgScore);
      setLocalSchedule(result);
      setSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule.');
    } finally {
      setLoading(false);
    }
  };

  const totalSessions =
    localSchedule?.schedule.reduce((sum, day) => sum + day.sessions.length, 0) ?? 0;

  // ── Empty state ──────────────────────────────────────────────────────────
  if (conceptGaps.length === 0 && localSchedule === null) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>📅</div>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-h)',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          No plan yet
        </p>
        <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Complete a Reasoning Challenge first to get your personalized plan
        </p>
        <button
          onClick={onSwitchToChallenge}
          style={{
            padding: '9px 22px',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Start a challenge
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '4px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-h)' }}>
            This week · Adaptive plan
          </h2>
          <p style={{ color: 'var(--text)', fontSize: '13px', marginTop: '4px' }}>
            Based on your concept gaps
          </p>
        </div>
        {totalSessions > 0 && (
          <span
            style={{
              padding: '4px 11px',
              borderRadius: '999px',
              background: '#E1F5EE',
              color: '#085041',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              marginTop: '4px',
            }}
          >
            {totalSessions} sessions left
          </span>
        )}
      </div>

      {/* Priority / readiness banner */}
      {localSchedule?.readiness_message && (
        <div
          style={{
            margin: '12px 0 18px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            fontSize: '13px',
            color: 'var(--accent)',
          }}
        >
          <strong>Priority gap:</strong> {localSchedule.priority_gap} —{' '}
          {localSchedule.readiness_message}
        </div>
      )}

      {/* New gaps nudge */}
      {newGapsNudge && (
        <div
          style={{
            margin: '0 0 16px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#FAECE7',
            border: '1px solid #f5c6c0',
            fontSize: '13px',
            color: '#712B13',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>New gaps detected — regenerate plan?</span>
          <button
            onClick={() => void fetchSchedule()}
            style={{
              background: '#712B13',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Regenerate
          </button>
        </div>
      )}

      {/* Metrics */}
      <MetricsRow />

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text)', fontSize: '14px' }}>
          <div style={{ fontSize: '22px', marginBottom: '10px' }}>⏳</div>
          Generating your adaptive plan...
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#FAECE7',
            color: '#712B13',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Day cards */}
      {!loading && localSchedule && (
        <div>
          {localSchedule.schedule.map((day, i) => (
            <DayScheduleCard key={i} day={day} />
          ))}
        </div>
      )}

      {/* Regenerate button */}
      {!loading && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            onClick={() => void fetchSchedule()}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Regenerate plan
          </button>
        </div>
      )}
    </div>
  );
};
