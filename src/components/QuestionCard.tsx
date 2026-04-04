/**
 * Renders the question card with subject pill and challenge counter.
 * Owner: Developer 1 (Frontend UI)
 */
import React from 'react';

interface QuestionCardProps {
  question: string;
  subject: string;
  challengeNumber: number;
  total: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, subject, challengeNumber, total }) => {
  return (
    <div className="glass-card rounded-2xl p-5 w-full">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            background: 'rgba(139,92,246,0.2)',
            color: '#c4b5fd',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          {subject}
        </span>
        <span className="text-xs font-medium text-gray-400">
          Challenge {challengeNumber} of {total}
        </span>
      </div>

      {/* Question text */}
      <p className="text-white font-semibold text-lg leading-snug">{question}</p>
    </div>
  );
};

export default QuestionCard;
