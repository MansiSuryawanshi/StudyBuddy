/**
 * Tab navigation: Reasoning Challenge / Exam Prep / Results History / Study Schedule.
 * Owner: Developer 1 (Frontend UI)
 */
import React from 'react';

export type TabId = 'challenge' | 'exam-prep' | 'history' | 'schedule' | 'report';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'challenge', label: 'Reasoning Challenge' },
  { id: 'exam-prep', label: 'Exam Prep' },
  { id: 'history', label: 'Results History' },
  { id: 'schedule', label: 'Study Schedule' },
  { id: 'report', label: 'Study Report' },
];

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '2px',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px 0',
        overflowX: 'auto',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--sans)',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
