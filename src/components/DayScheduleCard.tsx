/**
 * Card for one day's study sessions.
 */
import React, { useState } from 'react';
import type { DaySchedule } from '../types';
import { SessionSlot } from './SessionSlot';

interface DayScheduleCardProps {
  day: DaySchedule;
}

export const DayScheduleCard: React.FC<DayScheduleCardProps> = ({ day }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/20">
      {/* Day header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{day.day}</span>
          <span className="text-xs text-gray-500">{day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}</span>
        </div>
        <span className={`text-gray-500 text-xs transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}>
          ▲
        </span>
      </button>

      {/* Sessions */}
      {!collapsed && (
        <div className="px-5 pb-3 border-t border-white/[0.05]">
          {day.sessions.map((session, i) => (
            <SessionSlot
              key={i}
              time={session.time}
              label={session.label}
              topicTag={session.targets_gap ?? session.topic_tag}
              duration={session.duration}
              badgeType={session.badge_type}
              isLast={i === day.sessions.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
