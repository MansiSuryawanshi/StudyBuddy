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
  severity: "low" | "medium" | "high";
  correction: string;
}

export interface ScoreResult {
  userId: string;
  correctness: number;
  reasoningDepth: number;
  clarity: number;
  misconceptionScore: number;
  misconceptions: MisconceptionResult[];
  conceptGapTags: string[];
}

export interface Session {
  roomId: string;
  phase: "waiting" | "answering" | "analyzing" | "revealed";
  currentQuestion: Question | null;
  players: string[];
  answers: Record<string, Answer>;
  scores: Record<string, ScoreResult>;
}
