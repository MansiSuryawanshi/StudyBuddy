/**
 * Shared TypeScript interfaces used across all 3 developer modules.
 * Owner: Shared (all developers)
 */

export interface StudentScore {
  correctness: number;
  reasoning_depth: number;
  clarity: number;
  total: number;
  misconception_present: boolean;
  misconception_name: string | null;
  concept_gap: string | null;
}

export interface ScoreResult {
  student_a: StudentScore;
  student_b: StudentScore;
  depth_insight: string;
  same_answer_different_depth: boolean;
  winner: 'A' | 'B' | 'tie';
}

export type SessionPhase = 'question' | 'answering' | 'analyzing' | 'revealed';

export interface Question {
  id: string;
  topic: string;
  text: string;
  expectedConcepts: string[];
}

export interface Answer {
  userId: string;
  text: string;
  timestamp: string;
  confidenceRating?: number;
}

export interface MisconceptionResult {
  namedMisconception: string;
  severity: 'low' | 'medium' | 'high';
  correction: string;
}

export interface Session {
  roomId: string;
  phase: SessionPhase;
  currentQuestion: Question | null;
  players: string[];
  answers: Record<string, Answer>;
  scores: Record<string, ScoreResult>;
}
