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

export type BadgeType = 'coral' | 'purple' | 'teal';

export interface SessionSlotData {
  time: string;
  label: string;
  topic_tag: string;
  duration: string;
  badge_type: BadgeType;
  targets_gap: string | null;
}

export interface DaySchedule {
  day: string;
  sessions: SessionSlotData[];
}

export interface ScheduleResponse {
  schedule: DaySchedule[];
  priority_gap: string;
  readiness_message: string;
}
