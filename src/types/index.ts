export type QuestionType = "mcq" | "short_answer";

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  sourceTopic?: string;
}

export interface StudyDocument {
  id?: string;
  fileName: string;
  uploadedAt: any;
  rawText: string;
  extractedTopics?: string[];
  processed: boolean;
}

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

export interface Answer {
  userId: string;
  text: string;
  timestamp: string;
  confidenceRating?: number;
}

export interface Session {
  roomId: string;
  phase: SessionPhase;
  currentQuestion: GeneratedQuestion | null;
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
