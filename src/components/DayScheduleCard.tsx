/**
 * Card for one day's study sessions.
 * Shows day name and a list of SessionSlot rows.
 */
import React from 'react';
import { DaySchedule } from '../types';
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
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '16px',
        boxShadow: 'rgba(0,0,0,0.04) 0 2px 8px',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-h)',
          letterSpacing: '-0.2px',
        }}
      >
        {day.day}
      </h3>
      <div>
        {day.sessions.map((session, i) => (
          <SessionSlot
            key={i}
            time={session.time}
            label={session.label}
            topicTag={session.topic_tag}
            duration={session.duration}
            badgeType={session.badge_type}
          />
        ))}
      </div>
    </div>
  );
};
