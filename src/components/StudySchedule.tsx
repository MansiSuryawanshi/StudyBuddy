/**
 * Study Schedule tab — adaptive weekly plan based on concept gaps from the quiz.
 * Calls Claude to generate personalized sessions targeting each identified gap.
 */
import React, { useState, useEffect } from 'react';
import { ScheduleResponse } from '../types';
import { generateSchedule } from '../services/claudeService';
import { MetricsRow } from './MetricsRow';
import { DayScheduleCard } from './DayScheduleCard';

interface StudyScheduleProps {
  conceptGaps?: string[];
  avgScore?: number;
  challengesDone?: number;
  onSwitchToChallenge?: () => void;
}

export const StudySchedule: React.FC<StudyScheduleProps> = ({
  conceptGaps = [],
  avgScore = 70,
  challengesDone = 0,
  onSwitchToChallenge,
}) => {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSessions =
    schedule?.schedule.reduce((sum, day) => sum + day.sessions.length, 0) ?? 0;

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateSchedule(conceptGaps, avgScore);
      setSchedule(result);
    } catch (err) {
      setError('Failed to generate schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conceptGaps.length > 0) {
      fetchSchedule();
    }
  }, []);

  // Empty state — no quiz taken yet
  if (conceptGaps.length === 0 && !schedule) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '40px',
            marginBottom: '16px',
          }}
        >
          📅
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>No plan yet</h2>
        <p style={{ color: 'var(--text)', marginBottom: '24px', lineHeight: 1.6 }}>
          Complete a Reasoning Challenge first to get your personalized plan
        </p>
        <button
          onClick={onSwitchToChallenge}
          style={{
            padding: '10px 24px',
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
    <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '4px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-h)' }}>
            This week · Adaptive plan
          </h2>
          <p style={{ color: 'var(--text)', fontSize: '13px', marginTop: '4px' }}>
            Based on your concept gaps
          </p>
        </div>
        {schedule && totalSessions > 0 && (
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#e6faf8',
              color: '#0d9488',
              border: '1px solid #99e6df',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {totalSessions} sessions left
          </span>
        )}
      </div>

      {/* Readiness message */}
      {schedule?.readiness_message && (
        <div
          style={{
            margin: '12px 0 20px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            fontSize: '13px',
            color: 'var(--accent)',
          }}
        >
          <strong>Priority gap:</strong> {schedule.priority_gap} —{' '}
          {schedule.readiness_message}
        </div>
      )}

      {/* Metrics row */}
      <MetricsRow
        challengesDone={challengesDone}
        avgUnderstanding={avgScore}
        gapsToClose={conceptGaps.length}
      />

      {/* Loading state */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            color: 'var(--text)',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          Generating your adaptive plan...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: '#fff0ee',
            color: '#c0392b',
            border: '1px solid #f5c6c0',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Day schedule cards */}
      {!loading && schedule && (
        <div>
          {schedule.schedule.map((day, i) => (
            <DayScheduleCard key={i} day={day} />
          ))}
        </div>
      )}

      {/* Regenerate button */}
      {!loading && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            onClick={fetchSchedule}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-bg)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Regenerate plan
          </button>
        </div>
      )}
    </div>
  );
};
