/**
 * Displays concept gap tags for the lower-scoring student; both shown on a tie.
 * Owner: Developer 1 (Frontend UI)
 */
import React from 'react';

interface ConceptGapCardProps {
  conceptGapA: string | null;
  conceptGapB: string | null;
  winner: 'A' | 'B' | 'tie';
}

const GapTag: React.FC<{ label: string; student: string }> = ({ label, student }) => (
  <div className="flex items-start gap-3">
    <span className="text-xs text-gray-500 font-medium pt-0.5 shrink-0">Peer {student}</span>
    <span
      className="text-xs font-semibold px-3 py-1.5 rounded-full text-orange-300"
      style={{
        background: 'rgba(249,115,22,0.2)',
        border: '1px solid rgba(249,115,22,0.3)',
      }}
    >
      {label}
    </span>
  </div>
);

const ConceptGapCard: React.FC<ConceptGapCardProps> = ({ conceptGapA, conceptGapB, winner }) => {
  const showA = (winner === 'B' || winner === 'tie') && !!conceptGapA;
  const showB = (winner === 'A' || winner === 'tie') && !!conceptGapB;

  if (!showA && !showB) return null;

  return (
    <div className="glass-card rounded-2xl p-4 mt-3 space-y-3">
      <p className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
        Concept gap detected
      </p>

      <div className="flex flex-col gap-2">
        {showA && <GapTag label={conceptGapA!} student="A" />}
        {showB && <GapTag label={conceptGapB!} student="B" />}
      </div>

      <p className="text-xs text-gray-500">
        Next challenge will target this gap specifically.
      </p>
    </div>
  );
};

export default ConceptGapCard;
