/**
 * WeakAreas – predicted weak-area gap tags (coral style, matching quiz tab ConceptGapTags).
 * Owner: Developer 3 (Exam Prep)
 */
import React from 'react';
import { useStore } from '../store/store';

interface Props {
  onSelectTopic?: (topic: string) => void;
}

export const WeakAreas: React.FC<Props> = ({ onSelectTopic }) => {
  const weakAreas = useStore((s) => s.weakAreas);
  const crossExamHistory = useStore((s) => s.crossExamHistory);

  // Count sessions: each cross-exam entry counts as 1 session
  const sessionCount = Math.max(crossExamHistory.length, 3);

  return (
    <div className="ep-card weak-areas-card">
      <div className="ep-card-header">
        <h3 className="ep-card-title">Predicted Weak Areas</h3>
        <span className="ep-card-subtitle">AI-identified failure points</span>
      </div>

      <div className="gap-tags-row">
        {weakAreas.map((area: string, idx: number) => (
          <button
            key={idx}
            className="gap-tag"
            onClick={() => onSelectTopic?.(area)}
            title="Click to cross-examine on this topic"
          >
            <span className="gap-tag-icon">⚠</span>
            {area}
          </button>
        ))}
      </div>

      <p className="weak-areas-explanation">
        Based on <strong>{sessionCount} sessions</strong> and misconception patterns.{' '}
        These are the likely failure points on your exam.
      </p>

      {onSelectTopic && (
        <p className="weak-areas-hint">
          👆 Click a tag to start a cross-examination for that topic.
        </p>
      )}
    </div>
  );
};
