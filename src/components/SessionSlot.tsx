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
  rationale?: string | null;
  isLast?: boolean;
}

const BADGE_CLASSES: Record<BadgeType, string> = {
  coral:  'bg-red-500/15 text-red-300 border border-red-500/20',
  purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/20',
  teal:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
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
  rationale,
  isLast = false,
}) => {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${
        !isLast ? 'border-b border-white/[0.06]' : ''
      }`}
    >
      {/* Time */}
      <span className="min-w-[60px] text-xs text-gray-500 tabular-nums shrink-0">
        {time}
      </span>

      {/* Label + topic pill + Rationale */}
      <div className="flex-1 flex flex-col gap-1 justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-white font-medium leading-none">{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 whitespace-nowrap">
            {topicTag}
          </span>
        </div>
        
        {/* Factual rationale (if exists) */}
        {rationale && (
          <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Evidence:</span>
            <span className="text-[11px] text-purple-300 italic truncate max-w-[200px]">
              {rationale}
            </span>
          </div>
        )}
      </div>

      {/* Badge + duration */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${BADGE_CLASSES[badgeType]}`}>
          {BADGE_LABELS[badgeType]}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
          {duration}
        </span>
      </div>
    </div>
  );
};
