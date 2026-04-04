/**
 * Card for one day's study sessions.
 */
import React from 'react';
import type { DaySchedule } from '../types';
import { SessionSlot } from './SessionSlot';

interface DayScheduleCardProps {
  day: DaySchedule;
}

export const DayScheduleCard: React.FC<DayScheduleCardProps> = ({ day }) => {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '18px 20px',
        marginBottom: '12px',
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-h)',
          letterSpacing: '-0.1px',
        }}
      >
        {day.day}
      </p>
      <div>
        {day.sessions.map((session, i) => (
          <div
            key={i}
            style={i === day.sessions.length - 1 ? { borderBottom: 'none' } : undefined}
          >
            <SessionSlot
              time={session.time}
              label={session.label}
              topicTag={session.targets_gap ?? session.topic_tag}
              duration={session.duration}
              badgeType={session.badge_type}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
