/**
 * TopicCoverage – animated progress bars for each study topic.
 * Color rules: >75% purple, 50–75% amber, <50% red.
 * Owner: Developer 3 (Exam Prep)
 */
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import type { TopicProgress } from '../types';

export const TopicCoverage: React.FC = () => {
  const topics = useStore((s) => s.topicProgress);
  // Animate bars in on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const getBarColor = (pct: number) => {
    if (pct > 75) return 'var(--accent)';       // purple
    if (pct >= 50) return 'var(--amber)';        // amber
    return 'var(--danger)';                      // red
  };

  const getBadge = (pct: number) => {
    if (pct > 75) return { label: 'Strong', cls: 'badge-purple' };
    if (pct >= 50) return { label: 'Moderate', cls: 'badge-amber' };
    return { label: 'Weak', cls: 'badge-red' };
  };

  return (
    <div className="ep-card">
      <div className="ep-card-header">
        <h3 className="ep-card-title">Topic Coverage</h3>
        <span className="ep-card-subtitle">{topics.length} topics tracked</span>
      </div>

      <div className="topic-list">
        {topics.map((topic: TopicProgress, idx: number) => {
          const badge = getBadge(topic.percentage);
          return (
            <div key={idx} className="topic-row">
              <div className="topic-meta">
                <span className="topic-name">{topic.name}</span>
                <span className={`topic-badge ${badge.cls}`}>{badge.label}</span>
              </div>

              <div className="topic-bar-wrap">
                <div className="topic-bar-track">
                  <div
                    className="topic-bar-fill"
                    style={{
                      width: mounted ? `${topic.percentage}%` : '0%',
                      backgroundColor: getBarColor(topic.percentage),
                      transitionDelay: `${idx * 80}ms`,
                    }}
                  />
                </div>
                <span
                  className="topic-pct"
                  style={{ color: getBarColor(topic.percentage) }}
                >
                  {topic.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
