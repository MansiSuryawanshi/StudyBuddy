/**
 * Reusable session row inside DayScheduleCard.
 * Shows: time | label + topic pill | duration badge
 */
import React from 'react';
import type { BadgeType } from '../types';

interface SessionSlotProps {
  time: string;
  label: string;
  topicTag: string;
  duration: string;
  badgeType: BadgeType;
}

const BADGE_STYLES: Record<BadgeType, React.CSSProperties> = {
  coral:  { background: '#FAECE7', color: '#712B13' },
  purple: { background: '#EEEDFE', color: '#3C3489' },
  teal:   { background: '#E1F5EE', color: '#085041' },
};

const BADGE_LABELS: Record<BadgeType, string> = {
  coral:  'gap focus',
  purple: 'challenge',
  teal:   'review',
};

export const SessionSlot: React.FC<SessionSlotProps> = ({
  time,
  label,
  topicTag,
  duration,
  badgeType,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 0',
        borderBottom: '0.5px solid var(--border)',
      }}
    >
      {/* Time */}
      <span
        style={{
          minWidth: '64px',
          fontSize: '12px',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {time}
      </span>

      {/* Label + topic pill */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-h)', fontWeight: 500 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '999px',
            background: 'var(--code-bg)',
            color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}
        >
          {topicTag}
        </span>
      </div>

      {/* Badge + duration */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontWeight: 600,
            ...BADGE_STYLES[badgeType],
          }}
        >
          {BADGE_LABELS[badgeType]}
        </span>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: 'var(--code-bg)',
            color: 'var(--text)',
          }}
        >
          {duration}
        </span>
      </div>
    </div>
  );
};
