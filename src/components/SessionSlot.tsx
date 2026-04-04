/**
 * Reusable session row inside DayScheduleCard.
 * Shows: time | label + topic pill | duration badge
 */
import React from 'react';
import { BadgeType } from '../types';

interface SessionSlotProps {
  time: string;
  label: string;
  topicTag: string;
  duration: string;
  badgeType: BadgeType;
}

const BADGE_STYLES: Record<BadgeType, React.CSSProperties> = {
  coral: { background: '#fff0ee', color: '#c0392b', border: '1px solid #f5c6c0' },
  purple: { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  teal: { background: '#e6faf8', color: '#0d9488', border: '1px solid #99e6df' },
};

const BADGE_LABELS: Record<BadgeType, string> = {
  coral: 'gap focus',
  purple: 'challenge',
  teal: 'review',
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
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Time */}
      <span
        style={{
          minWidth: '68px',
          fontSize: '13px',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {time}
      </span>

      {/* Label + topic pill */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-h)', fontWeight: 500 }}>{label}</span>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '999px',
            background: 'var(--code-bg)',
            color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}
        >
          {topicTag}
        </span>
      </div>

      {/* Duration + type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span
          style={{
            fontSize: '12px',
            padding: '3px 8px',
            borderRadius: '999px',
            ...BADGE_STYLES[badgeType],
            fontWeight: 500,
          }}
        >
          {BADGE_LABELS[badgeType]}
        </span>
        <span
          style={{
            fontSize: '12px',
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
