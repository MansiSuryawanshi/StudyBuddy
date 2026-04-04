/**
 * Reveal screen: depth insight card, side-by-side score cards, concept gap card. Fades in on mount.
 * Owner: Developer 1 (Frontend UI)
 */
import React, { useEffect, useState } from 'react';
import type { ScoreResult } from '../types';
import ScoreCard from './ScoreCard';
import ConceptGapCard from './ConceptGapCard';

interface RevealScreenProps {
  scoreResult: ScoreResult;
  answerA: string;
  answerB: string;
}

const RevealScreen: React.FC<RevealScreenProps> = ({ scoreResult }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const { student_a, student_b, depth_insight, same_answer_different_depth, winner } = scoreResult;

  return (
    <div
      className="flex flex-col gap-4 w-full transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* 1. Depth insight card */}
      {same_answer_different_depth && (
        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest">
            Same answer · different depth
          </p>
          <p className="text-purple-100 font-medium text-sm">{depth_insight}</p>
        </div>
      )}

      {/* 2. Side-by-side score cards */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          studentLabel="Peer A"
          scores={student_a}
          isWinner={winner === 'A' || winner === 'tie'}
        />
        <ScoreCard
          studentLabel="Peer B"
          scores={student_b}
          isWinner={winner === 'B' || winner === 'tie'}
        />
      </div>

      {/* 3. Concept gap card */}
      <ConceptGapCard
        conceptGapA={student_a.concept_gap}
        conceptGapB={student_b.concept_gap}
        winner={winner}
      />

      {/* Winner callout */}
      {winner !== 'tie' ? (
        <div className="text-center py-2">
          <span
            className="text-xs font-semibold px-4 py-1.5 rounded-full text-purple-200"
            style={{
              background: 'rgba(124,58,237,0.25)',
              border: '1px solid rgba(139,92,246,0.4)',
            }}
          >
            🏆 Peer {winner} showed deeper understanding
          </span>
        </div>
      ) : (
        <div className="text-center py-2">
          <span
            className="text-xs font-semibold px-4 py-1.5 rounded-full text-green-300"
            style={{
              background: 'rgba(20,184,166,0.2)',
              border: '1px solid rgba(94,234,212,0.3)',
            }}
          >
            🤝 Both students performed equally well
          </span>
        </div>
      )}
    </div>
  );
};

export default RevealScreen;
